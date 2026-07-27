/**
 * ユーザースクリプトの動作テスト。
 *
 * 本物の YouTube ではなく、同じ構造のダミーページを用意して、
 * GM_* の関数を差し替えたうえで動かしている。
 * i.ytimg.com へのリクエストも横取りして「maxres がある動画 / 無い動画」を再現する。
 *
 *     npm i -D playwright   # 未導入の場合
 *     node test/test-userscript.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = fs.readFileSync(
  path.join(here, '..', 'youtube-thumbnail-downloader.user.js'),
  'utf8',
);

let chromium;
try {
  ({ chromium } = createRequire(import.meta.url)('playwright'));
} catch {
  console.error('playwright が見つかりません。`npm i -D playwright` を実行してください。');
  process.exit(2);
}

// ---------------------------------------------------------------- 画像の用意

/** 指定サイズの単色 PNG を作る（テスト用の画像を外部に頼らないため）。 */
function solidPng(width, height, rgb) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let row = 0; row < height; row += 1) {
    const offset = row * (width * 3 + 1);
    raw[offset] = 0;  // フィルタ種別 None
    for (let column = 0; column < width; column += 1) {
      raw.set(rgb, offset + 1 + column * 3);
    }
  }

  const chunk = (kind, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(kind), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32 ? zlib.crc32(body) : crc32(body));
    return Buffer.concat([length, body, crc]);
  };

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);  // 8bit RGB

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Node 20 以前には zlib.crc32 が無いので自前で用意する。
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const IMAGES = {
  large: solidPng(1280, 720, [40, 90, 160]),
  medium: solidPng(480, 360, [60, 140, 80]),
  // 存在しない解像度を要求したときに YouTube が返すグレー画像と同じ大きさ。
  placeholder: solidPng(120, 90, [51, 51, 51]),
};

// ---------------------------------------------------------------- ダミーページ

const HAS_MAX = 'dQw4w9WgXcQ';  // maxres がある動画
const NO_MAX = 'aBcDeFgHiJk';   // maxres も sd も無い動画

const PAGE = `<meta charset="utf-8">
<style>
  body { margin: 0; background: #0f0f0f; color: #fff; font-family: sans-serif; }
  ytd-video-renderer { display: block; width: 260px; margin: 20px; }
  a#thumbnail { display: block; width: 240px; height: 135px; }
  a#thumbnail img { width: 100%; height: 100%; object-fit: cover; }
</style>
<ytd-video-renderer>
  <a id="thumbnail" href="/watch?v=${HAS_MAX}"><img src="https://i.ytimg.com/vi/${HAS_MAX}/hqdefault.jpg"></a>
  <a id="video-title" href="/watch?v=${HAS_MAX}" title="【解説】猫の生態: 第1回">【解説】猫の生態: 第1回</a>
</ytd-video-renderer>
<ytd-video-renderer>
  <a id="thumbnail" href="/shorts/${NO_MAX}"><img src="https://i.ytimg.com/vi/${NO_MAX}/hqdefault.jpg"></a>
  <a id="video-title" href="/shorts/${NO_MAX}" title="小さい動画">小さい動画</a>
</ytd-video-renderer>
<a id="plain" href="/watch?v=${HAS_MAX}">タイトルだけのリンク</a>
<input id="box" placeholder="検索欄">`;

// GM_* の代役。呼ばれた内容を window.__gm に記録する。
function installGmStubs() {
  window.__gm = { downloads: [], menus: [], values: {} };
  window.GM_download = (options) => {
    window.__gm.downloads.push({ url: options.url, name: options.name });
    setTimeout(() => options.onload && options.onload(), 0);
  };
  window.GM_xmlhttpRequest = (options) => setTimeout(() => options.onerror && options.onerror(), 0);
  window.GM_registerMenuCommand = (name) => window.__gm.menus.push(name);
  window.GM_setValue = (key, value) => { window.__gm.values[key] = value; };
  window.GM_getValue = (key, fallback) => (key in window.__gm.values ? window.__gm.values[key] : fallback);
  window.GM_addStyle = (css) => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.append(style);
  };
}

// ---------------------------------------------------------------- テスト本体

let failed = 0;

function check(name, got, want) {
  if (JSON.stringify(got) === JSON.stringify(want)) {
    console.log(`  ok   ${name}`);
    return;
  }
  failed += 1;
  console.log(`  FAIL ${name}\n         got  ${JSON.stringify(got)}\n         want ${JSON.stringify(want)}`);
}

const browser = await chromium.launch({ channel: 'chromium', headless: true });
const context = await browser.newContext({ viewport: { width: 900, height: 700 } });

// 解像度ごとに「ある / ない」を作り分ける。
await context.route('https://i.ytimg.com/**', (route) => {
  const url = route.request().url();
  const missing = url.includes(`/${NO_MAX}/`) && /maxresdefault|sddefault/.test(url);
  const body = missing ? IMAGES.placeholder : /maxresdefault/.test(url) ? IMAGES.large : IMAGES.medium;
  route.fulfill({ body, contentType: 'image/png' });
});

const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(String(error)));

await page.addInitScript(installGmStubs);
await page.route('https://www.youtube.com/**', (route) =>
  route.fulfill({ contentType: 'text/html; charset=utf-8', body: PAGE }));

await page.goto(`https://www.youtube.com/watch?v=${HAS_MAX}`);
await page.evaluate(SCRIPT);
await page.waitForTimeout(300);

console.log('起動');
check('メニューが 3 つ登録される', await page.evaluate(() => window.__gm.menus.length), 3);

console.log('サムネイル上のボタン');
await page.hover('#plain');
await page.waitForTimeout(200);
check('文字だけのリンクには出さない', await page.evaluate(() => document.querySelector('.ytdl-badge').hidden), true);

await page.hover('ytd-video-renderer:nth-of-type(1) a#thumbnail');
await page.waitForTimeout(200);
check('サムネイルに乗せると出る', await page.evaluate(() => document.querySelector('.ytdl-badge').hidden), false);
check(
  'サムネイルの右上に載る',
  await page.evaluate(() => {
    const badge = document.querySelector('.ytdl-badge').getBoundingClientRect();
    const thumb = document.querySelector('ytd-video-renderer:nth-of-type(1) a#thumbnail').getBoundingClientRect();
    return badge.right <= thumb.right + 1 && badge.left > thumb.left
      && badge.top >= thumb.top - 1 && badge.bottom < thumb.bottom;
  }),
  true,
);

console.log('保存');
await page.click('.ytdl-badge');
await page.waitForTimeout(900);
check(
  'maxres がある動画は maxres を保存',
  await page.evaluate(() => window.__gm.downloads.at(-1)),
  {
    url: `https://i.ytimg.com/vi/${HAS_MAX}/maxresdefault.jpg`,
    name: `【解説】猫の生態 第1回_${HAS_MAX}_maxresdefault.jpg`,
  },
);
check('クリックしても動画ページへ遷移しない', page.url().includes('watch?v='), true);
check('完了が表示される', (await page.textContent('.ytdl-toast')).startsWith('保存しました'), true);

await page.hover('ytd-video-renderer:nth-of-type(2) a#thumbnail');
await page.waitForTimeout(200);
await page.click('.ytdl-badge');
await page.waitForTimeout(1200);
check(
  'maxres も sd も無い動画は hq に落ちる',
  await page.evaluate(() => window.__gm.downloads.at(-1)),
  {
    url: `https://i.ytimg.com/vi/${NO_MAX}/hqdefault.jpg`,
    name: `小さい動画_${NO_MAX}_hqdefault.jpg`,
  },
);

console.log('解像度の選択画面');
await page.hover('ytd-video-renderer:nth-of-type(2) a#thumbnail');
await page.waitForTimeout(200);
await page.click('.ytdl-badge', { modifiers: ['Shift'] });
await page.waitForTimeout(1200);
check(
  '無い解像度は選べない',
  await page.evaluate(() =>
    [...document.querySelectorAll('.ytdl-row')].map((row) =>
      `${row.querySelector('b').textContent}:${row.disabled ? 'disabled' : 'enabled'}`)),
  ['Max:disabled', 'SD:disabled', 'HQ:enabled', 'MQ:enabled', 'S:enabled'],
);
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
check('Esc で閉じる', await page.evaluate(() => !!document.querySelector('.ytdl-backdrop')), false);

console.log('キーボード');
await page.evaluate(() => { window.__gm.downloads.length = 0; });
await page.keyboard.press('Alt+t');
await page.waitForTimeout(900);
check(
  'Alt+T で今見ている動画を保存',
  await page.evaluate(() => window.__gm.downloads.at(-1)?.url),
  `https://i.ytimg.com/vi/${HAS_MAX}/maxresdefault.jpg`,
);

await page.evaluate(() => { window.__gm.downloads.length = 0; });
await page.click('#box');
await page.keyboard.press('Alt+t');
await page.waitForTimeout(600);
check('検索欄の入力中は反応しない', await page.evaluate(() => window.__gm.downloads.length), 0);

console.log('\nJS エラー:', errors.length ? errors : 'なし');
if (errors.length) failed += errors.length;

await browser.close();
console.log(failed === 0 ? '\nすべて成功しました。' : `\n${failed} 件失敗しました。`);
process.exit(failed === 0 ? 0 : 1);

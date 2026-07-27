/**
 * common.js の URL 解析・ファイル名生成のテスト。
 * Chrome の API に触らない純粋な関数だけを対象にしているので、Node だけで動く。
 *
 *     node tools/test-common.mjs
 */

import {
  extractVideoId,
  thumbnailUrl,
  cleanVideoTitle,
  sanitizeFilename,
  buildFilename,
  isPlaceholder,
} from '../common.js';

let failed = 0;

function eq(name, got, want) {
  if (got === want) {
    console.log(`  ok   ${name}`);
    return;
  }
  failed += 1;
  console.log(`  FAIL ${name}\n         got  ${JSON.stringify(got)}\n         want ${JSON.stringify(want)}`);
}

const ID = 'dQw4w9WgXcQ';

console.log('extractVideoId');
eq('通常の視聴 URL', extractVideoId(`https://www.youtube.com/watch?v=${ID}`), ID);
eq('再生位置つき', extractVideoId(`https://www.youtube.com/watch?v=${ID}&t=42s&list=PLabc`), ID);
eq('v が先頭でない', extractVideoId(`https://www.youtube.com/watch?t=1&v=${ID}`), ID);
eq('短縮 URL', extractVideoId(`https://youtu.be/${ID}?si=xyz`), ID);
eq('ショート', extractVideoId(`https://www.youtube.com/shorts/${ID}`), ID);
eq('埋め込み', extractVideoId(`https://www.youtube.com/embed/${ID}`), ID);
eq('ライブ', extractVideoId(`https://www.youtube.com/live/${ID}`), ID);
eq('モバイル版', extractVideoId(`https://m.youtube.com/watch?v=${ID}`), ID);
eq('YouTube Music', extractVideoId(`https://music.youtube.com/watch?v=${ID}`), ID);
eq('サムネイルの直リンク', extractVideoId(`https://i.ytimg.com/vi/${ID}/hqdefault.jpg`), ID);
eq('ID だけ', extractVideoId(ID), ID);
eq('ID だけ（前後に空白）', extractVideoId(`  ${ID}  `), ID);
eq('トップページ', extractVideoId('https://www.youtube.com/'), null);
eq('チャンネルページ', extractVideoId('https://www.youtube.com/@SomeChannel'), null);
eq('関係ない文字列', extractVideoId('hello world'), null);
eq('短すぎる', extractVideoId('abc'), null);
eq('空文字', extractVideoId(''), null);
eq('undefined', extractVideoId(undefined), null);

console.log('thumbnailUrl');
eq('JPG', thumbnailUrl(ID, 'maxresdefault'), `https://i.ytimg.com/vi/${ID}/maxresdefault.jpg`);
eq('WebP', thumbnailUrl(ID, 'sddefault', 'webp'), `https://i.ytimg.com/vi_webp/${ID}/sddefault.webp`);

console.log('cleanVideoTitle');
eq('末尾の - YouTube を削る', cleanVideoTitle('猫の動画 - YouTube'), '猫の動画');
eq('未読件数も削る', cleanVideoTitle('(12) 猫の動画 - YouTube'), '猫の動画');
eq('undefined', cleanVideoTitle(undefined), '');

console.log('sanitizeFilename');
eq('禁止文字を除去', sanitizeFilename('a/b\\c:d*e?f"g<h>i|j'), 'abcdefghij');
eq('日本語と記号は残す', sanitizeFilename('【解説】猫の生態 - 第1回'), '【解説】猫の生態 - 第1回');
eq('末尾のドットを除去', sanitizeFilename('naming rules...'), 'naming rules');
eq('連続する空白をまとめる', sanitizeFilename('  a   b  '), 'a b');
eq('100 文字で打ち切る', sanitizeFilename('x'.repeat(300)).length, 100);

console.log('buildFilename');
eq(
  'タイトルあり',
  buildFilename({ videoId: ID, quality: 'maxresdefault', format: 'jpg', title: '猫の動画' }),
  `猫の動画_${ID}_maxresdefault.jpg`,
);
eq(
  'タイトルなし',
  buildFilename({ videoId: ID, quality: 'hqdefault', format: 'webp', title: '' }),
  `${ID}_hqdefault.webp`,
);
eq(
  'タイトルが禁止文字だけ',
  buildFilename({ videoId: ID, quality: 'sddefault', format: 'jpg', title: '///' }),
  `${ID}_sddefault.jpg`,
);

console.log('isPlaceholder');
eq('120px の maxres は代替画像', isPlaceholder('maxresdefault', 120), true);
eq('1280px の maxres は本物', isPlaceholder('maxresdefault', 1280), false);
eq('default は元々 120px', isPlaceholder('default', 120), false);

console.log(failed === 0 ? '\nすべて成功しました。' : `\n${failed} 件失敗しました。`);
process.exit(failed === 0 ? 0 : 1);

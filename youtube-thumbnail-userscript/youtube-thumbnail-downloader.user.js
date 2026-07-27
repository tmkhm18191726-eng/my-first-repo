// ==UserScript==
// @name         YouTube サムネイル ダウンローダー
// @namespace    https://github.com/tmkhm18191726-eng/my-first-repo
// @version      1.0.0
// @description  YouTube のサムネイルにマウスを乗せると出るボタンから、最高画質の画像をワンクリックで保存します。解像度を選んで保存することもできます。
// @author       tmkhm18191726-eng
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @match        https://music.youtube.com/*
// @connect      i.ytimg.com
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @run-at       document-idle
// @noframes
// ==/UserScript==

/*
 * 使い方
 *   - 一覧・検索結果・関連動画のサムネイルにマウスを乗せる → 右上に出る ↓ ボタンをクリック
 *   - ↓ ボタンを Shift + クリック → 解像度を選ぶ画面
 *   - 視聴ページで Alt + T → 今見ている動画のサムネイルを保存
 *   - Tampermonkey のメニューから JPG / WebP の切り替えなど
 */

(() => {
  'use strict';

  // ------------------------------------------------------------ 定数

  // YouTube のサムネイルは動画 ID から URL が決まる公開画像。
  // maxres / sd は動画によっては存在せず、その場合は 404 か 120x90 のグレー画像が返る。
  const QUALITIES = [
    { key: 'maxresdefault', label: 'Max', size: '1280 × 720' },
    { key: 'sddefault', label: 'SD', size: '640 × 480' },
    { key: 'hqdefault', label: 'HQ', size: '480 × 360' },
    { key: 'mqdefault', label: 'MQ', size: '320 × 180' },
    { key: 'default', label: 'S', size: '120 × 90' },
  ];

  // 存在するかどうかを問い合わせる必要があるのはこの 2 つだけ。
  const UNCERTAIN = new Set(['maxresdefault', 'sddefault']);

  const ID = '[A-Za-z0-9_-]{11}';

  const URL_PATTERNS = [
    new RegExp(`[?&]v=(${ID})`),
    new RegExp(`youtu\\.be/(${ID})`),
    new RegExp(`/shorts/(${ID})`),
    new RegExp(`/embed/(${ID})`),
    new RegExp(`/live/(${ID})`),
    new RegExp(`i\\.ytimg\\.com/vi(?:_webp)?/(${ID})/`),
  ];

  // サムネイルを含むリンク。タイトル文字だけのリンクは対象外にしたいので、
  // 画像を持っているかどうかを別途確認する。
  const LINK_SELECTOR = 'a[href*="/watch?v="], a[href*="/shorts/"], a[href*="youtu.be/"]';

  // 動画タイトルを探すときに順に試すセレクタ。YouTube の DOM 変更に少しでも耐えるよう複数用意する。
  const TITLE_SELECTORS = [
    '#video-title',
    'a#video-title-link',
    'yt-formatted-string#video-title',
    'h3 a',
    '.title',
  ];

  const CARD_SELECTOR = [
    'ytd-rich-item-renderer',
    'ytd-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-grid-video-renderer',
    'ytd-playlist-video-renderer',
    'ytd-reel-item-renderer',
    'ytm-video-with-context-renderer',
  ].join(',');

  // ------------------------------------------------------------ 設定

  const store = {
    get(key, fallback) {
      try {
        return typeof GM_getValue === 'function' ? GM_getValue(key, fallback) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        if (typeof GM_setValue === 'function') GM_setValue(key, value);
      } catch {
        /* 保存できなくても動作には影響しない */
      }
    },
  };

  const settings = {
    format: store.get('format', 'jpg') === 'webp' ? 'webp' : 'jpg',
  };

  // ------------------------------------------------------------ URL とファイル名

  function extractVideoId(input) {
    if (!input) return null;
    const text = String(input).trim();

    for (const pattern of URL_PATTERNS) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    if (new RegExp(`^${ID}$`).test(text)) return text;
    return null;
  }

  function thumbnailUrl(videoId, quality, format) {
    return format === 'webp'
      ? `https://i.ytimg.com/vi_webp/${videoId}/${quality}.webp`
      : `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
  }

  function sanitizeFilename(name) {
    // 制御文字はすべて半角スペースより小さいので、比較だけで落とせる。
    const withoutControls = Array.from(String(name || ''))
      .filter((char) => char >= ' ')
      .join('');

    return withoutControls
      .replace(/[<>:"/\\|?*]/g, '')  // OS が禁止している文字
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[.\s]+$/, '')        // Windows は末尾のドット・空白を嫌う
      .slice(0, 100)
      .trim();
  }

  function buildFilename(videoId, quality, format, title) {
    const ext = format === 'webp' ? 'webp' : 'jpg';
    const base = sanitizeFilename(title);
    return `${base ? `${base}_` : ''}${videoId}_${quality}.${ext}`;
  }

  function cleanVideoTitle(text) {
    return String(text || '')
      .replace(/^\(\d+\)\s*/, '')      // 未読通知の「(3) 」
      .replace(/\s*-\s*YouTube$/, '')  // 末尾の「 - YouTube」
      .trim();
  }

  // ------------------------------------------------------------ 存在確認

  /** 読み込めたら実際の幅を、ダメなら null を返す。 */
  function probeWidth(url) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image.naturalWidth);
      image.onerror = () => resolve(null);
      image.src = url;
    });
  }

  /**
   * 存在しない解像度は 404 になるか 120x90 のグレー画像が返るので、
   * 読み込めた画像の幅で本物かどうかを見分ける。
   */
  async function isAvailable(videoId, quality, format) {
    if (!UNCERTAIN.has(quality)) return true;
    const width = await probeWidth(thumbnailUrl(videoId, quality, format));
    return width !== null && width > 120;
  }

  /** 実際に存在する中で一番大きい解像度を返す。 */
  async function bestQuality(videoId, format) {
    for (const quality of QUALITIES) {
      if (await isAvailable(videoId, quality.key, format)) return quality.key;
    }
    return null;
  }

  // ------------------------------------------------------------ 保存

  function gmDownload(url, name) {
    return new Promise((resolve, reject) => {
      if (typeof GM_download !== 'function') {
        reject(new Error('GM_download が使えません'));
        return;
      }
      let settled = false;
      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        fn(value);
      };
      try {
        GM_download({
          url,
          name,
          saveAs: false,
          onload: () => finish(resolve),
          onerror: (event) => finish(reject, new Error(event?.error || 'ダウンロードに失敗')),
          ontimeout: () => finish(reject, new Error('タイムアウト')),
        });
      } catch (error) {
        finish(reject, error);
      }
    });
  }

  /** GM_download が使えない場合の逃げ道。画像を取得して Blob として保存する。 */
  function blobDownload(url, name) {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest !== 'function') {
        reject(new Error('GM_xmlhttpRequest が使えません'));
        return;
      }
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        responseType: 'blob',
        onload: (response) => {
          if (response.status !== 200) {
            reject(new Error(`HTTP ${response.status}`));
            return;
          }
          const objectUrl = URL.createObjectURL(response.response);
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = name;
          document.body.append(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
          resolve();
        },
        onerror: () => reject(new Error('画像を取得できませんでした')),
        ontimeout: () => reject(new Error('タイムアウト')),
      });
    });
  }

  async function save(videoId, quality, title) {
    const { format } = settings;
    const url = thumbnailUrl(videoId, quality, format);
    const filename = buildFilename(videoId, quality, format, title);

    try {
      await gmDownload(url, filename);
    } catch {
      // ダウンロードマネージャが使えない環境や、ファイル名を弾かれた場合に備える。
      try {
        await blobDownload(url, filename);
      } catch (error) {
        toast(`保存に失敗しました: ${error.message}`, 'error');
        return;
      }
    }
    toast(`保存しました: ${filename}`);
  }

  /** 一番大きいサイズを自動で選んで保存する。 */
  async function saveBest(videoId, title) {
    if (!videoId) {
      toast('動画が見つかりません', 'error');
      return;
    }
    toast('サイズを確認しています…');
    const quality = await bestQuality(videoId, settings.format);
    if (!quality) {
      toast('サムネイルを取得できませんでした', 'error');
      return;
    }
    await save(videoId, quality, title);
  }

  // ------------------------------------------------------------ 画面まわり

  const CSS = `
    .ytdl-badge {
      position: fixed;
      z-index: 2147483000;
      width: 30px;
      height: 30px;
      display: grid;
      place-items: center;
      border: 0;
      border-radius: 8px;
      background: rgba(15, 15, 15, 0.82);
      color: #fff;
      font: 700 15px/1 system-ui, sans-serif;
      cursor: pointer;
      opacity: 0.85;
      transition: opacity 0.12s, background 0.12s;
    }
    .ytdl-badge:hover { opacity: 1; background: #e6222e; }
    .ytdl-badge[hidden] { display: none; }

    .ytdl-toast {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 2147483001;
      max-width: 340px;
      padding: 10px 14px;
      border-radius: 8px;
      background: rgba(15, 15, 15, 0.95);
      color: #f1f1f1;
      font: 13px/1.45 system-ui, sans-serif;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45);
      word-break: break-all;
    }
    .ytdl-toast.error { background: #7a2626; }

    .ytdl-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2147483002;
      display: grid;
      place-items: center;
      background: rgba(0, 0, 0, 0.6);
    }

    .ytdl-dialog {
      width: 340px;
      padding: 16px;
      border-radius: 10px;
      background: #1c1c1c;
      color: #f1f1f1;
      font: 13px/1.45 system-ui, sans-serif;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
    }
    .ytdl-dialog h2 {
      margin: 0 0 4px;
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ytdl-dialog .ytdl-sub {
      margin-bottom: 12px;
      color: #a0a0a0;
      font-size: 11px;
      font-family: ui-monospace, Consolas, monospace;
    }
    .ytdl-row {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      margin-top: 6px;
      padding: 8px 10px;
      border: 1px solid #303030;
      border-radius: 6px;
      background: #272727;
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
    }
    .ytdl-row:hover:not(:disabled) { border-color: #5a5a5a; }
    .ytdl-row:disabled { opacity: 0.4; cursor: default; }
    .ytdl-row b { flex: 0 0 34px; }
    .ytdl-row .ytdl-size { flex: 1; color: #a0a0a0; font-size: 11px; }
    .ytdl-row .ytdl-state { font-size: 10px; color: #a0a0a0; }
    .ytdl-row .ytdl-state.ok { color: #4ccf72; }
    .ytdl-row .ytdl-state.missing { color: #d8a13a; }
    .ytdl-close {
      width: 100%;
      margin-top: 12px;
      padding: 8px;
      border: 0;
      border-radius: 6px;
      background: #383838;
      color: #f1f1f1;
      font: inherit;
      cursor: pointer;
    }
  `;

  function injectStyle() {
    if (typeof GM_addStyle === 'function') {
      GM_addStyle(CSS);
      return;
    }
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.append(style);
  }

  let toastTimer = null;

  function toast(message, kind = '') {
    let element = document.querySelector('.ytdl-toast');
    if (!element) {
      element = document.createElement('div');
      element.className = 'ytdl-toast';
      document.body.append(element);
    }
    element.className = `ytdl-toast ${kind}`.trim();
    element.textContent = message;

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.remove(), 3200);
  }

  // ------------------------------------------------------------ 解像度の選択画面

  function openPicker(videoId, title) {
    document.querySelector('.ytdl-backdrop')?.remove();

    const backdrop = document.createElement('div');
    backdrop.className = 'ytdl-backdrop';

    const dialog = document.createElement('div');
    dialog.className = 'ytdl-dialog';

    const heading = document.createElement('h2');
    heading.textContent = title || '(タイトルなし)';

    const sub = document.createElement('div');
    sub.className = 'ytdl-sub';
    sub.textContent = `${videoId} ・ ${settings.format.toUpperCase()}`;

    dialog.append(heading, sub);

    for (const quality of QUALITIES) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'ytdl-row';

      const label = document.createElement('b');
      label.textContent = quality.label;

      const size = document.createElement('span');
      size.className = 'ytdl-size';
      size.textContent = quality.size;

      const state = document.createElement('span');
      state.className = 'ytdl-state';
      state.textContent = UNCERTAIN.has(quality.key) ? '確認中' : '利用可';
      if (!UNCERTAIN.has(quality.key)) state.classList.add('ok');

      row.append(label, size, state);
      row.addEventListener('click', () => {
        close();
        save(videoId, quality.key, title);
      });
      dialog.append(row);

      if (UNCERTAIN.has(quality.key)) {
        isAvailable(videoId, quality.key, settings.format).then((available) => {
          state.textContent = available ? '利用可' : 'この動画には無し';
          state.classList.add(available ? 'ok' : 'missing');
          row.disabled = !available;
        });
      }
    }

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'ytdl-close';
    closeButton.textContent = '閉じる';
    closeButton.addEventListener('click', () => close());
    dialog.append(closeButton);

    backdrop.append(dialog);
    document.body.append(backdrop);

    function close() {
      backdrop.remove();
      document.removeEventListener('keydown', onKeydown, true);
    }

    function onKeydown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
      }
    }

    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) close();
    });
    document.addEventListener('keydown', onKeydown, true);
  }

  // ------------------------------------------------------------ サムネイル上のボタン

  const badge = document.createElement('button');
  badge.type = 'button';
  badge.className = 'ytdl-badge';
  badge.hidden = true;
  badge.textContent = '↓';
  badge.title = 'サムネイルを保存（Shift + クリックで解像度を選択）';

  let target = null;   // { videoId, title }
  let hideTimer = null;

  /** サムネイル画像を含む動画リンクだけを拾う。タイトル文字のリンクは無視する。 */
  function thumbnailLinkFrom(element) {
    if (!(element instanceof Element)) return null;
    const link = element.closest(LINK_SELECTOR);
    if (!link || !extractVideoId(link.href)) return null;
    if (!link.querySelector('img, yt-image, ytd-thumbnail')) return null;
    return link;
  }

  function titleFor(link) {
    const card = link.closest(CARD_SELECTOR) || link.parentElement;
    for (const selector of TITLE_SELECTORS) {
      const found = card?.querySelector(selector);
      const text = found?.getAttribute('title') || found?.textContent;
      if (text && text.trim()) return text.trim();
    }
    return link.getAttribute('aria-label')?.trim() || '';
  }

  function showBadgeOn(link) {
    const rect = link.getBoundingClientRect();
    if (rect.width < 80 || rect.height < 45) return;  // 小さすぎるものには出さない

    target = { videoId: extractVideoId(link.href), title: titleFor(link) };
    badge.style.left = `${Math.round(rect.right - 36)}px`;
    badge.style.top = `${Math.round(rect.top + 6)}px`;
    badge.hidden = false;
  }

  function scheduleHide() {
    clearTimeout(hideTimer);
    // ボタンへマウスを移す猶予を持たせる。
    hideTimer = setTimeout(() => { badge.hidden = true; }, 250);
  }

  document.addEventListener('mouseover', (event) => {
    const link = thumbnailLinkFrom(event.target);
    if (!link) return;
    clearTimeout(hideTimer);
    showBadgeOn(link);
  }, true);

  document.addEventListener('mouseout', (event) => {
    if (!thumbnailLinkFrom(event.target)) return;
    scheduleHide();
  }, true);

  badge.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  badge.addEventListener('mouseleave', scheduleHide);

  badge.addEventListener('click', (event) => {
    // YouTube 側にクリックを渡すと動画ページへ遷移してしまう。
    event.preventDefault();
    event.stopPropagation();
    if (!target) return;

    const { videoId, title } = target;
    badge.hidden = true;
    if (event.shiftKey) openPicker(videoId, title);
    else saveBest(videoId, title);
  });

  // スクロールすると位置がずれるので、いったん隠す。
  window.addEventListener('scroll', () => { badge.hidden = true; }, { passive: true });

  // ------------------------------------------------------------ 視聴ページ用

  function currentVideo() {
    const videoId = extractVideoId(location.href);
    if (!videoId) return null;

    // 視聴ページのタイトル。取れなければタブのタイトルで代用する。
    const heading = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, h1.title yt-formatted-string');
    const title = heading?.textContent?.trim() || cleanVideoTitle(document.title);
    return { videoId, title };
  }

  function isTyping(element) {
    if (!(element instanceof Element)) return false;
    return element.matches('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
  }

  document.addEventListener('keydown', (event) => {
    if (!event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key.toLowerCase() !== 't') return;
    if (isTyping(event.target)) return;

    const video = currentVideo();
    if (!video) {
      toast('動画ページで押してください', 'error');
      return;
    }
    event.preventDefault();
    saveBest(video.videoId, video.title);
  });

  // ------------------------------------------------------------ メニュー

  function registerMenu() {
    if (typeof GM_registerMenuCommand !== 'function') return;

    GM_registerMenuCommand('このページの動画のサムネイルを保存', () => {
      const video = currentVideo();
      if (video) saveBest(video.videoId, video.title);
      else toast('動画ページで実行してください', 'error');
    });

    GM_registerMenuCommand('解像度を選んで保存', () => {
      const video = currentVideo();
      if (video) openPicker(video.videoId, video.title);
      else toast('動画ページで実行してください', 'error');
    });

    GM_registerMenuCommand(`保存形式を切り替え（現在: ${settings.format.toUpperCase()}）`, () => {
      settings.format = settings.format === 'jpg' ? 'webp' : 'jpg';
      store.set('format', settings.format);
      toast(`保存形式を ${settings.format.toUpperCase()} にしました（メニュー表示は再読み込み後に更新されます）`);
    });
  }

  // ------------------------------------------------------------ 起動

  injectStyle();
  document.body.append(badge);
  registerMenu();
})();

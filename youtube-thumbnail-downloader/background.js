import {
  QUALITIES,
  extractVideoId,
  thumbnailUrl,
  cleanVideoTitle,
  isPlaceholder,
} from './common.js';
import { downloadThumbnail } from './download.js';

const MENU_ID = 'save-youtube-thumbnail';
const MENU_TITLE = 'サムネイルを保存（最高画質）';

const YOUTUBE_PATTERNS = [
  '*://*.youtube.com/*',
  '*://youtu.be/*',
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    // 一覧・検索結果ページで動画リンクを右クリックしたとき。
    chrome.contextMenus.create({
      id: `${MENU_ID}-link`,
      title: MENU_TITLE,
      contexts: ['link'],
      targetUrlPatterns: YOUTUBE_PATTERNS,
    });

    // 視聴ページ上で何もない場所やプレーヤーを右クリックしたとき。
    chrome.contextMenus.create({
      id: `${MENU_ID}-page`,
      title: MENU_TITLE,
      contexts: ['page', 'video'],
      documentUrlPatterns: YOUTUBE_PATTERNS,
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!String(info.menuItemId).startsWith(MENU_ID)) return;

  // リンクを右クリックしたならそのリンク先、そうでなければ今開いているページ。
  const videoId = extractVideoId(info.linkUrl) || extractVideoId(info.pageUrl || tab?.url);
  if (!videoId) {
    flashBadge('!', '#d8a13a');
    return;
  }

  // リンク先の動画のタイトルは分からないので、そのときはファイル名を ID だけにする。
  const title = info.linkUrl ? '' : cleanVideoTitle(tab?.title);
  saveBestThumbnail(videoId, title);
});

/** 存在する中で一番大きい解像度を選んでダウンロードする。 */
async function saveBestThumbnail(videoId, title) {
  const { format = 'jpg', saveAs = false } = await chrome.storage.local.get({
    format: 'jpg',
    saveAs: false,
  });

  for (const quality of QUALITIES) {
    const url = thumbnailUrl(videoId, quality.key, format);
    const width = await probeWidth(url);
    if (width === null || isPlaceholder(quality.key, width)) continue;

    try {
      await downloadThumbnail({ videoId, quality: quality.key, format, title, saveAs });
      flashBadge('OK', '#4ccf72');
    } catch {
      flashBadge('!', '#d8a13a');
    }
    return;
  }

  flashBadge('!', '#d8a13a');
}

/**
 * 画像を取得できたら実際の幅を返す。
 * サービスワーカーには Image が無いので、blob を ImageBitmap にして測る。
 */
async function probeWidth(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const bitmap = await createImageBitmap(await response.blob());
    const { width } = bitmap;
    bitmap.close();
    return width;
  } catch {
    return null;
  }
}

/** ポップアップを開かずに実行したときの結果を、アイコンのバッジで短く知らせる。 */
function flashBadge(text, color) {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text });
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 2000);
}

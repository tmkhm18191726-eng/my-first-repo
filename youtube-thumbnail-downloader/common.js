// ポップアップとサービスワーカーで共有するロジック。

// YouTube が公開しているサムネイルの解像度バリエーション。
// maxres / sd は動画によっては存在せず、その場合は 120x90 のグレー画像が返る。
export const QUALITIES = [
  { key: 'maxresdefault', label: 'Max', size: '1280 × 720', note: '無い動画もあります' },
  { key: 'sddefault', label: 'SD', size: '640 × 480', note: '無い動画もあります' },
  { key: 'hqdefault', label: 'HQ', size: '480 × 360', note: '必ず存在します' },
  { key: 'mqdefault', label: 'MQ', size: '320 × 180', note: '' },
  { key: 'default', label: 'S', size: '120 × 90', note: '' },
];

export const DEFAULT_QUALITY = 'maxresdefault';

// 動画 ID は必ず 11 文字の [A-Za-z0-9_-]。
const ID = '[A-Za-z0-9_-]{11}';

const URL_PATTERNS = [
  new RegExp(`[?&]v=(${ID})`),
  new RegExp(`youtu\\.be/(${ID})`),
  new RegExp(`/shorts/(${ID})`),
  new RegExp(`/embed/(${ID})`),
  new RegExp(`/live/(${ID})`),
  new RegExp(`/v/(${ID})`),
  new RegExp(`i\\.ytimg\\.com/vi(?:_webp)?/(${ID})/`),
];

/**
 * URL・共有リンク・生の ID のいずれからでも動画 ID を取り出す。
 * 見つからなければ null。
 */
export function extractVideoId(input) {
  if (!input) return null;
  const text = String(input).trim();

  for (const pattern of URL_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  // 「ID だけ貼り付けた」ケース。前後に余計な文字が無いときのみ採用する。
  if (new RegExp(`^${ID}$`).test(text)) return text;

  return null;
}

/** サムネイルの直リンクを組み立てる。format は 'jpg' か 'webp'。 */
export function thumbnailUrl(videoId, quality, format = 'jpg') {
  return format === 'webp'
    ? `https://i.ytimg.com/vi_webp/${videoId}/${quality}.webp`
    : `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * 存在しない解像度をリクエストすると、YouTube は 404 を返すか
 * 120x90 のグレー画像を返す。読み込めた画像の幅からそれを見分ける。
 */
export function isPlaceholder(quality, width) {
  return quality !== 'default' && width <= 120;
}

/** タブのタイトルから YouTube が付ける装飾を取り除く。 */
export function cleanVideoTitle(tabTitle) {
  if (!tabTitle) return '';
  return tabTitle
    .replace(/^\(\d+\)\s*/, '')       // 未読通知の「(3) 」
    .replace(/\s*-\s*YouTube$/, '')   // 末尾の「 - YouTube」
    .trim();
}

/** Windows / macOS のどちらでも通るファイル名に整える。 */
export function sanitizeFilename(name) {
  // 制御文字はすべて半角スペースより小さいので、比較だけで落とせる。
  const withoutControls = Array.from(String(name))
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

/** 保存時のファイル名。タイトルが取れないときは ID だけで組み立てる。 */
export function buildFilename({ videoId, quality, format, title }) {
  const ext = format === 'webp' ? 'webp' : 'jpg';
  const base = sanitizeFilename(title || '');
  const prefix = base ? `${base}_` : '';
  return `${prefix}${videoId}_${quality}.${ext}`;
}

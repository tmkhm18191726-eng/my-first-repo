import { buildFilename, thumbnailUrl } from './common.js';

/**
 * サムネイルを保存し、実際に使われたファイル名を返す。
 *
 * ファイルシステムのロケールによっては、Chrome が日本語を含むファイル名を
 * "Invalid filename" として弾くことがある。そのときは動画 ID だけの
 * ASCII のファイル名で一度だけやり直す。
 */
export async function downloadThumbnail({ videoId, quality, format, title, saveAs }) {
  const url = thumbnailUrl(videoId, quality, format);
  const preferred = buildFilename({ videoId, quality, format, title });

  try {
    await chrome.downloads.download({ url, filename: preferred, saveAs, conflictAction: 'uniquify' });
    return preferred;
  } catch (error) {
    const fallback = buildFilename({ videoId, quality, format, title: '' });
    if (fallback === preferred) throw error;

    await chrome.downloads.download({ url, filename: fallback, saveAs, conflictAction: 'uniquify' });
    return fallback;
  }
}

/**
 * YouTube Analytics API が返す enum 値を、日本語のラベルに変換するための対応表。
 * 未知の値が来たら、そのまま元の文字列を返します（API 側に値が増えても落ちない）。
 */

const TRAFFIC_SOURCE_LABELS = {
	ADVERTISING: '広告',
	ANNOTATION: 'アノテーション',
	CAMPAIGN_CARD: 'キャンペーンカード',
	END_SCREEN: '終了画面',
	EXT_URL: '外部サイト',
	HASHTAGS: 'ハッシュタグ',
	IMMERSIVE: '没入型ビュー',
	LIVE_REDIRECT: 'ライブのリダイレクト',
	NOTIFICATION: '通知',
	NO_LINK_EMBEDDED: '埋め込みプレーヤー',
	NO_LINK_OTHER: 'その他（リンクなし）',
	PLAYLIST: '再生リスト',
	PRODUCT_PAGE: '商品ページ',
	PROMOTED: '有料プロモーション',
	RELATED_VIDEO: '関連動画',
	SHORTS: 'ショートフィード',
	SOUND_PAGE: 'サウンドページ',
	SUBSCRIBER: '登録チャンネル / フィード',
	YT_CHANNEL: 'チャンネルページ',
	YT_OTHER_PAGE: 'その他のYouTube機能',
	YT_PLAYLIST_PAGE: '再生リストページ',
	YT_SEARCH: 'YouTube検索'
};

const DEVICE_LABELS = {
	DESKTOP: 'パソコン',
	GAME_CONSOLE: 'ゲーム機',
	MOBILE: 'スマートフォン',
	TABLET: 'タブレット',
	TV: 'テレビ',
	UNKNOWN_PLATFORM: '不明'
};

const GENDER_LABELS = {
	female: '女性',
	male: '男性',
	user_specified: 'その他 / 未回答',
	gender_other: 'その他 / 未回答'
};

const regionNames = new Intl.DisplayNames(['ja'], { type: 'region' });

export const trafficSourceLabel = (value) => TRAFFIC_SOURCE_LABELS[value] ?? value;

export const deviceLabel = (value) => DEVICE_LABELS[value] ?? value;

export const genderLabel = (value) => GENDER_LABELS[value] ?? value;

/** ageGroup は "age25-34" のような形で返ってくるので "25-34歳" にする */
export const ageGroupLabel = (value) => {
	const range = String(value).replace(/^age/, '');
	return range.endsWith('-') || range.endsWith('+') ? `${range.replace('-', '')}歳以上` : `${range}歳`;
};

/** ISO 3166-1 alpha-2 の国コードを日本語の国名にする */
export const countryLabel = (code) => {
	if (!code || code === 'ZZ') return '不明';
	try {
		return regionNames.of(code) ?? code;
	} catch {
		return code;
	}
};

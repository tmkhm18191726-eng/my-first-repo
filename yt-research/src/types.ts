export type SortKey = 'views' | 'viewsPerDay' | 'newest' | 'subscribers'

export type SearchOrder = 'viewCount' | 'date' | 'relevance'

export interface SearchFilters {
  /** タイトル・説明文に含まれるキーワード */
  keyword: string
  /** true ならタイトルにキーワードを含む動画だけに絞る */
  titleOnly: boolean
  /** 動画公開日が N 日以内。null で指定なし */
  videoWithinDays: number | null
  /** チャンネル開設が N 日以内。null で指定なし */
  channelWithinDays: number | null
  /** 再生数の下限。null で指定なし */
  minViews: number | null
  /** チャンネル登録者数の下限。null で指定なし */
  minSubscribers: number | null
  /** チャンネル登録者数の上限。null で指定なし */
  maxSubscribers: number | null
  /** YouTube API 側の並び順 */
  order: SearchOrder
  /** 取得ページ数（1ページ = 最大50件、1ページごとに約100クォータ） */
  pages: number
  /** 日本語圏の動画に絞る */
  japaneseOnly: boolean
}

export const DEFAULT_FILTERS: SearchFilters = {
  keyword: '',
  titleOnly: true,
  videoWithinDays: null,
  channelWithinDays: 365,
  minViews: 1000,
  minSubscribers: null,
  maxSubscribers: null,
  order: 'viewCount',
  pages: 1,
  japaneseOnly: true,
}

export interface VideoHit {
  videoId: string
  title: string
  thumbnail: string
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  /** 公開からの日数（最低1日として計算） */
  videoAgeDays: number
  /** 1日あたりの再生数 */
  viewsPerDay: number
  channelId: string
  channelTitle: string
  channelPublishedAt: string
  channelAgeDays: number
  subscriberCount: number
  /** 登録者数が非公開のチャンネル */
  subscriberHidden: boolean
  channelVideoCount: number
}

export interface ChannelHit {
  channelId: string
  channelTitle: string
  channelPublishedAt: string
  channelAgeDays: number
  subscriberCount: number
  subscriberHidden: boolean
  channelVideoCount: number
  /** 検索条件に合致した動画 */
  videos: VideoHit[]
  /** 合致した動画の合計再生数 */
  totalViews: number
  /** 合致した動画で最大の再生数 */
  topViews: number
}

export interface SearchStats {
  /** API から取得した動画数 */
  scanned: number
  /** 絞り込み後に残った動画数 */
  matched: number
  /** 絞り込み後のチャンネル数 */
  channels: number
  /** この検索で消費した推定クォータ */
  quotaUsed: number
}

export interface SearchResult {
  filters: SearchFilters
  videos: VideoHit[]
  channels: ChannelHit[]
  stats: SearchStats
  searchedAt: string
}

export interface HistoryEntry {
  id: string
  filters: SearchFilters
  stats: SearchStats
  searchedAt: string
  /** 保存時点の上位ヒット（件数はストレージ節約のため上限あり） */
  videos: VideoHit[]
}

export const VIDEO_PERIOD_OPTIONS: { label: string; value: number | null }[] = [
  { label: '指定なし', value: null },
  { label: '24時間以内', value: 1 },
  { label: '7日以内', value: 7 },
  { label: '30日以内', value: 30 },
  { label: '90日以内', value: 90 },
  { label: '1年以内', value: 365 },
]

export const CHANNEL_PERIOD_OPTIONS: { label: string; value: number | null }[] = [
  { label: '指定なし', value: null },
  { label: '30日以内', value: 30 },
  { label: '90日以内', value: 90 },
  { label: '180日以内', value: 180 },
  { label: '365日以内', value: 365 },
  { label: '2年以内', value: 730 },
]

export const VIEW_OPTIONS: { label: string; value: number | null }[] = [
  { label: '指定なし', value: null },
  { label: '1,000回以上', value: 1000 },
  { label: '5,000回以上', value: 5000 },
  { label: '1万回以上', value: 10000 },
  { label: '5万回以上', value: 50000 },
  { label: '10万回以上', value: 100000 },
]

export const SUBSCRIBER_OPTIONS: { label: string; value: number | null }[] = [
  { label: '指定なし', value: null },
  { label: '100人', value: 100 },
  { label: '1,000人', value: 1000 },
  { label: '1万人', value: 10000 },
  { label: '10万人', value: 100000 },
  { label: '100万人', value: 1000000 },
]

export const ORDER_LABELS: Record<SearchOrder, string> = {
  viewCount: '再生数が多い順に取得',
  date: '新しい順に取得',
  relevance: '関連度順に取得',
}

export const SORT_LABELS: Record<SortKey, string> = {
  views: '再生数',
  viewsPerDay: '1日あたり再生数',
  newest: '公開が新しい',
  subscribers: '登録者数',
}

import type { ChannelHit, SearchFilters, SearchResult, VideoHit } from '../types'

const API_BASE = 'https://www.googleapis.com/youtube/v3'

/** search.list は 1 回 100 クォータ、videos/channels.list は 1 クォータ */
const SEARCH_COST = 100
const LIST_COST = 1

export class YouTubeApiError extends Error {
  readonly status: number
  readonly reason: string

  constructor(message: string, status: number, reason: string) {
    super(message)
    this.name = 'YouTubeApiError'
    this.status = status
    this.reason = reason
  }
}

interface ErrorPayload {
  error?: {
    message?: string
    errors?: { reason?: string }[]
  }
}

function describeError(status: number, reason: string, apiMessage: string): string {
  if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
    return '本日の API クォータを使い切りました。太平洋時間の0時（日本時間の16〜17時ごろ）にリセットされるので、それまで待つか、取得ページ数を減らして試してください。'
  }
  if (reason === 'keyInvalid' || reason === 'badRequest') {
    return 'API キーが正しくないようです。設定画面のキーを確認してください。'
  }
  if (reason === 'ipRefererBlocked' || reason === 'forbidden') {
    return 'API キーの制限でブロックされました。Google Cloud のキー設定で、このサイトの URL を許可してください。'
  }
  if (status === 400) {
    return `検索条件が API に受け付けられませんでした（${apiMessage}）`
  }
  return `YouTube API でエラーが発生しました（${status}: ${apiMessage}）`
}

async function callApi<T>(
  path: string,
  params: Record<string, string>,
  apiKey: string,
  signal?: AbortSignal,
): Promise<T> {
  const url = new URL(`${API_BASE}/${path}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString(), { signal })
  if (!res.ok) {
    let payload: ErrorPayload = {}
    try {
      payload = (await res.json()) as ErrorPayload
    } catch {
      // JSON でないエラー本文は無視してステータスだけで判断する
    }
    const reason = payload.error?.errors?.[0]?.reason ?? ''
    const apiMessage = payload.error?.message ?? res.statusText
    throw new YouTubeApiError(describeError(res.status, reason, apiMessage), res.status, reason)
  }
  return (await res.json()) as T
}

interface SearchListResponse {
  nextPageToken?: string
  pageInfo?: { totalResults?: number }
  items?: { id?: { videoId?: string } }[]
}

interface VideoListResponse {
  items?: {
    id?: string
    snippet?: {
      title?: string
      publishedAt?: string
      channelId?: string
      channelTitle?: string
      thumbnails?: Record<string, { url?: string }>
    }
    statistics?: {
      viewCount?: string
      likeCount?: string
      commentCount?: string
    }
  }[]
}

interface ChannelItem {
  id?: string
  snippet?: { title?: string; publishedAt?: string }
  statistics?: {
    subscriberCount?: string
    hiddenSubscriberCount?: boolean
    videoCount?: string
  }
}

interface ChannelListResponse {
  items?: ChannelItem[]
}

function toNumber(value: string | undefined): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

function daysSince(iso: string, now: number): number {
  const time = new Date(iso).getTime()
  if (!Number.isFinite(time)) return 0
  return Math.max(1, Math.floor((now - time) / 86_400_000))
}

function isoDaysAgo(days: number, now: number): string {
  return new Date(now - days * 86_400_000).toISOString()
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFKC')
}

/** タイトルにキーワード（スペース区切りで AND）が含まれるか */
function titleMatches(title: string, keyword: string): boolean {
  const terms = keyword
    .split(/[\s　]+/)
    .map((term) => normalize(term))
    .filter(Boolean)
  if (terms.length === 0) return true
  const target = normalize(title)
  return terms.every((term) => target.includes(term))
}

/** 検索条件から消費クォータの目安を出す */
export function estimateQuota(pages: number): number {
  return pages * SEARCH_COST + pages * 2 * LIST_COST
}

export interface SearchProgress {
  phase: 'search' | 'videos' | 'channels' | 'done'
  page: number
  totalPages: number
}

export async function searchVideos(
  filters: SearchFilters,
  apiKey: string,
  options: { signal?: AbortSignal; onProgress?: (progress: SearchProgress) => void } = {},
): Promise<SearchResult> {
  const { signal, onProgress } = options
  const now = Date.now()
  let quotaUsed = 0

  // 1. search.list をページ送りしながら動画 ID を集める
  const videoIds: string[] = []
  let pageToken: string | undefined
  for (let page = 0; page < filters.pages; page++) {
    onProgress?.({ phase: 'search', page: page + 1, totalPages: filters.pages })

    const params: Record<string, string> = {
      part: 'id',
      type: 'video',
      maxResults: '50',
      q: filters.keyword,
      order: filters.order,
    }
    if (filters.videoWithinDays !== null) {
      params.publishedAfter = isoDaysAgo(filters.videoWithinDays, now)
    }
    if (filters.japaneseOnly) {
      params.regionCode = 'JP'
      params.relevanceLanguage = 'ja'
    }
    if (pageToken) params.pageToken = pageToken

    const res = await callApi<SearchListResponse>('search', params, apiKey, signal)
    quotaUsed += SEARCH_COST

    for (const item of res.items ?? []) {
      const id = item.id?.videoId
      if (id) videoIds.push(id)
    }
    if (!res.nextPageToken) break
    pageToken = res.nextPageToken
  }

  if (videoIds.length === 0) {
    return {
      filters,
      videos: [],
      channels: [],
      stats: { scanned: 0, matched: 0, channels: 0, quotaUsed },
      searchedAt: new Date(now).toISOString(),
    }
  }

  // 2. videos.list で再生数などの統計を取る
  const videoItems: NonNullable<VideoListResponse['items']> = []
  const idChunks = chunk(videoIds, 50)
  for (const [index, ids] of idChunks.entries()) {
    onProgress?.({ phase: 'videos', page: index + 1, totalPages: idChunks.length })
    const res = await callApi<VideoListResponse>(
      'videos',
      { part: 'snippet,statistics', id: ids.join(',') },
      apiKey,
      signal,
    )
    quotaUsed += LIST_COST
    videoItems.push(...(res.items ?? []))
  }

  // 3. channels.list で登録者数と開設日を取る
  const channelIds = [
    ...new Set(
      videoItems
        .map((item) => item.snippet?.channelId)
        .filter((id): id is string => typeof id === 'string'),
    ),
  ]
  const channelMap = new Map<string, ChannelItem>()
  const channelChunks = chunk(channelIds, 50)
  for (const [index, ids] of channelChunks.entries()) {
    onProgress?.({ phase: 'channels', page: index + 1, totalPages: channelChunks.length })
    const res = await callApi<ChannelListResponse>(
      'channels',
      { part: 'snippet,statistics', id: ids.join(',') },
      apiKey,
      signal,
    )
    quotaUsed += LIST_COST
    for (const item of res.items ?? []) {
      if (item.id) channelMap.set(item.id, item)
    }
  }

  // 4. 条件で絞り込む
  const videos: VideoHit[] = []
  for (const item of videoItems) {
    const videoId = item.id
    const snippet = item.snippet
    const channelId = snippet?.channelId
    if (!videoId || !snippet || !channelId) continue

    const channel = channelMap.get(channelId)
    const channelPublishedAt = channel?.snippet?.publishedAt ?? ''
    const channelAgeDays = channelPublishedAt ? daysSince(channelPublishedAt, now) : 0
    const subscriberHidden = channel?.statistics?.hiddenSubscriberCount === true
    const subscriberCount = toNumber(channel?.statistics?.subscriberCount)
    const viewCount = toNumber(item.statistics?.viewCount)
    const title = snippet.title ?? ''
    const publishedAt = snippet.publishedAt ?? ''
    const videoAgeDays = publishedAt ? daysSince(publishedAt, now) : 1

    if (filters.titleOnly && !titleMatches(title, filters.keyword)) continue
    if (filters.minViews !== null && viewCount < filters.minViews) continue
    if (filters.channelWithinDays !== null) {
      if (!channelPublishedAt || channelAgeDays > filters.channelWithinDays) continue
    }
    // 登録者数が非公開のチャンネルは、登録者数で絞り込むときは除外する
    if (filters.minSubscribers !== null) {
      if (subscriberHidden || subscriberCount < filters.minSubscribers) continue
    }
    if (filters.maxSubscribers !== null) {
      if (subscriberHidden || subscriberCount > filters.maxSubscribers) continue
    }

    videos.push({
      videoId,
      title,
      thumbnail:
        snippet.thumbnails?.medium?.url ??
        snippet.thumbnails?.high?.url ??
        snippet.thumbnails?.default?.url ??
        '',
      publishedAt,
      viewCount,
      likeCount: toNumber(item.statistics?.likeCount),
      commentCount: toNumber(item.statistics?.commentCount),
      videoAgeDays,
      viewsPerDay: Math.round(viewCount / videoAgeDays),
      channelId,
      channelTitle: snippet.channelTitle ?? channel?.snippet?.title ?? '',
      channelPublishedAt,
      channelAgeDays,
      subscriberCount,
      subscriberHidden,
      channelVideoCount: toNumber(channel?.statistics?.videoCount),
    })
  }

  const channels = groupByChannel(videos)
  onProgress?.({ phase: 'done', page: filters.pages, totalPages: filters.pages })

  return {
    filters,
    videos,
    channels,
    stats: {
      scanned: videoItems.length,
      matched: videos.length,
      channels: channels.length,
      quotaUsed,
    },
    searchedAt: new Date(now).toISOString(),
  }
}

export function groupByChannel(videos: VideoHit[]): ChannelHit[] {
  const map = new Map<string, ChannelHit>()
  for (const video of videos) {
    const existing = map.get(video.channelId)
    if (existing) {
      existing.videos.push(video)
      existing.totalViews += video.viewCount
      existing.topViews = Math.max(existing.topViews, video.viewCount)
      continue
    }
    map.set(video.channelId, {
      channelId: video.channelId,
      channelTitle: video.channelTitle,
      channelPublishedAt: video.channelPublishedAt,
      channelAgeDays: video.channelAgeDays,
      subscriberCount: video.subscriberCount,
      subscriberHidden: video.subscriberHidden,
      channelVideoCount: video.channelVideoCount,
      videos: [video],
      totalViews: video.viewCount,
      topViews: video.viewCount,
    })
  }
  for (const channel of map.values()) {
    channel.videos.sort((a, b) => b.viewCount - a.viewCount)
  }
  return [...map.values()]
}

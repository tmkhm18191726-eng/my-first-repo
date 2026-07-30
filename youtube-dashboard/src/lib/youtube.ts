import type { ChannelEntry, ChannelSnapshot, LiveState, VideoSummary } from '../types'

const API_BASE = 'https://www.googleapis.com/youtube/v3'

export class YouTubeApiError extends Error {}

async function apiGet(path: string, params: Record<string, string>, apiKey: string) {
  const url = new URL(`${API_BASE}/${path}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  url.searchParams.set('key', apiKey)

  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const reason = body?.error?.errors?.[0]?.reason
    if (res.status === 403 && reason === 'quotaExceeded') {
      throw new YouTubeApiError('APIの利用上限(クォータ)に達しました。しばらく待ってから試してください。')
    }
    if (res.status === 400 || res.status === 403) {
      throw new YouTubeApiError('APIキーが正しくない、または権限がありません。設定を確認してください。')
    }
    throw new YouTubeApiError(`YouTube APIエラー (status ${res.status})`)
  }
  return res.json()
}

const CHANNEL_ID_RE = /UC[0-9A-Za-z_-]{22}/
const HANDLE_RE = /@([\w.-]+)/

function toChannelEntry(item: {
  id: string
  snippet: { title: string; thumbnails?: { default?: { url?: string }; medium?: { url?: string } } }
}): Omit<ChannelEntry, 'group'> {
  return {
    id: item.id,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? '',
  }
}

export async function resolveChannel(
  apiKey: string,
  rawInput: string,
): Promise<Omit<ChannelEntry, 'group'>> {
  const input = rawInput.trim()
  if (!input) throw new YouTubeApiError('チャンネルのURL・ハンドル・IDを入力してください。')

  const idMatch = input.match(CHANNEL_ID_RE)
  if (idMatch) {
    const data = await apiGet('channels', { part: 'snippet', id: idMatch[0] }, apiKey)
    if (data.items?.[0]) return toChannelEntry(data.items[0])
  }

  const handleMatch = input.match(HANDLE_RE) ?? (input.startsWith('@') ? [input, input.slice(1)] : null)
  if (handleMatch) {
    const data = await apiGet('channels', { part: 'snippet', forHandle: `@${handleMatch[1]}` }, apiKey)
    if (data.items?.[0]) return toChannelEntry(data.items[0])
  }

  const usernameData = await apiGet('channels', { part: 'snippet', forUsername: input }, apiKey).catch(
    () => null,
  )
  if (usernameData?.items?.[0]) return toChannelEntry(usernameData.items[0])

  const searchData = await apiGet(
    'search',
    { part: 'snippet', type: 'channel', maxResults: '1', q: input },
    apiKey,
  )
  const found = searchData.items?.[0]
  if (!found) throw new YouTubeApiError('チャンネルが見つかりませんでした。')
  return toChannelEntry({ id: found.id.channelId, snippet: found.snippet })
}

export async function fetchChannelSnapshot(
  apiKey: string,
  channel: ChannelEntry,
): Promise<ChannelSnapshot> {
  const channelData = await apiGet(
    'channels',
    { part: 'statistics,contentDetails', id: channel.id },
    apiKey,
  )
  const item = channelData.items?.[0]
  if (!item) throw new YouTubeApiError('チャンネル情報を取得できませんでした。')

  const statistics = item.statistics
  const uploadsPlaylistId: string | undefined = item.contentDetails?.relatedPlaylists?.uploads

  let videos: VideoSummary[] = []
  if (uploadsPlaylistId) {
    const playlistData = await apiGet(
      'playlistItems',
      { part: 'contentDetails', playlistId: uploadsPlaylistId, maxResults: '10' },
      apiKey,
    )
    const videoIds: string[] = (playlistData.items ?? [])
      .map((entry: { contentDetails?: { videoId?: string } }) => entry.contentDetails?.videoId)
      .filter((id: string | undefined): id is string => Boolean(id))

    if (videoIds.length > 0) {
      const videosData = await apiGet(
        'videos',
        { part: 'snippet,statistics', id: videoIds.join(',') },
        apiKey,
      )
      videos = (videosData.items ?? []).map(
        (v: {
          id: string
          snippet: {
            title: string
            publishedAt: string
            liveBroadcastContent: string
            thumbnails?: { medium?: { url?: string }; default?: { url?: string } }
          }
          statistics: { viewCount?: string; commentCount?: string; likeCount?: string }
        }): VideoSummary => ({
          id: v.id,
          title: v.snippet.title,
          thumbnail: v.snippet.thumbnails?.medium?.url ?? v.snippet.thumbnails?.default?.url ?? '',
          publishedAt: v.snippet.publishedAt,
          viewCount: Number(v.statistics.viewCount ?? 0),
          commentCount: v.statistics.commentCount !== undefined ? Number(v.statistics.commentCount) : null,
          likeCount: v.statistics.likeCount !== undefined ? Number(v.statistics.likeCount) : null,
          liveBroadcastContent: (v.snippet.liveBroadcastContent as LiveState) ?? 'none',
        }),
      )
    }
  }

  return {
    channel,
    stats: {
      subscriberCount: Number(statistics.subscriberCount ?? 0),
      hiddenSubscriberCount: Boolean(statistics.hiddenSubscriberCount),
      viewCount: Number(statistics.viewCount ?? 0),
      videoCount: Number(statistics.videoCount ?? 0),
    },
    videos,
    isLive: videos.some((v) => v.liveBroadcastContent === 'live'),
    fetchedAt: Date.now(),
  }
}

export type ChannelGroup = 'mine' | 'benchmark'

export interface ChannelEntry {
  id: string
  title: string
  thumbnail: string
  group: ChannelGroup
}

export interface ChannelStats {
  subscriberCount: number
  hiddenSubscriberCount: boolean
  viewCount: number
  videoCount: number
}

export type LiveState = 'live' | 'upcoming' | 'none'

export interface VideoSummary {
  id: string
  title: string
  thumbnail: string
  publishedAt: string
  viewCount: number
  commentCount: number | null
  likeCount: number | null
  liveBroadcastContent: LiveState
}

export interface ChannelSnapshot {
  channel: ChannelEntry
  stats: ChannelStats
  videos: VideoSummary[]
  isLive: boolean
  fetchedAt: number
}

import { useMemo, useState } from 'react'
import { SORT_LABELS, type SearchResult, type SortKey } from '../types'
import { formatNumber } from '../lib/format'
import { VideoCard } from './VideoCard'
import { ChannelCard } from './ChannelCard'

type ViewMode = 'channel' | 'video'

interface Props {
  result: SearchResult
}

function sortVideos(result: SearchResult, key: SortKey) {
  const videos = [...result.videos]
  videos.sort((a, b) => {
    if (key === 'views') return b.viewCount - a.viewCount
    if (key === 'viewsPerDay') return b.viewsPerDay - a.viewsPerDay
    if (key === 'subscribers') return b.subscriberCount - a.subscriberCount
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })
  return videos
}

function sortChannels(result: SearchResult, key: SortKey) {
  const channels = [...result.channels]
  channels.sort((a, b) => {
    if (key === 'views') return b.topViews - a.topViews
    if (key === 'viewsPerDay') {
      const bestOf = (videos: typeof a.videos) =>
        videos.reduce((max, video) => Math.max(max, video.viewsPerDay), 0)
      return bestOf(b.videos) - bestOf(a.videos)
    }
    if (key === 'subscribers') return b.subscriberCount - a.subscriberCount
    // 開設が新しいチャンネルほど経過日数が小さい
    return a.channelAgeDays - b.channelAgeDays
  })
  return channels
}

export function ResultList({ result }: Props) {
  const [mode, setMode] = useState<ViewMode>('channel')
  const [sort, setSort] = useState<SortKey>('viewsPerDay')

  const videos = useMemo(() => sortVideos(result, sort), [result, sort])
  const channels = useMemo(() => sortChannels(result, sort), [result, sort])

  if (result.videos.length === 0) {
    return (
      <div className="empty">
        <p className="empty-title">条件に合う動画は見つかりませんでした</p>
        <p className="hint">
          API からは {formatNumber(result.stats.scanned)}{' '}
          本の動画を取得しましたが、絞り込みで全て外れました。「チャンネル開設」や「再生数」の条件をゆるめると見つかりやすくなります。
        </p>
      </div>
    )
  }

  return (
    <section className="results">
      <div className="results-head">
        <p className="results-summary">
          <strong>{formatNumber(result.stats.channels)}</strong> チャンネル /{' '}
          <strong>{formatNumber(result.stats.matched)}</strong> 動画がヒット
          <span className="results-sub">
            （取得 {formatNumber(result.stats.scanned)} 本・クォータ約{' '}
            {formatNumber(result.stats.quotaUsed)}）
          </span>
        </p>

        <div className="results-controls">
          <div className="segmented">
            <button
              type="button"
              className={mode === 'channel' ? 'segment active' : 'segment'}
              onClick={() => setMode('channel')}
            >
              チャンネル
            </button>
            <button
              type="button"
              className={mode === 'video' ? 'segment active' : 'segment'}
              onClick={() => setMode('video')}
            >
              動画
            </button>
          </div>

          <select
            className="select compact"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            aria-label="並び替え"
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}順
              </option>
            ))}
          </select>
        </div>
      </div>

      {mode === 'channel' ? (
        <div className="card-list">
          {channels.map((channel) => (
            <ChannelCard key={channel.channelId} channel={channel} />
          ))}
        </div>
      ) : (
        <div className="card-list">
          {videos.map((video) => (
            <VideoCard key={video.videoId} video={video} />
          ))}
        </div>
      )}
    </section>
  )
}

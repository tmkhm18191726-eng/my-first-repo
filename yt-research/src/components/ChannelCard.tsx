import { useState } from 'react'
import { channelUrl, formatAge, formatCompact, formatDate, formatNumber } from '../lib/format'
import type { ChannelHit } from '../types'
import { VideoCard } from './VideoCard'

interface Props {
  channel: ChannelHit
}

export function ChannelCard({ channel }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <article className="channel-card">
      <div className="channel-head">
        <div className="channel-head-main">
          <a
            className="channel-title"
            href={channelUrl(channel.channelId)}
            target="_blank"
            rel="noreferrer noopener"
          >
            {channel.channelTitle}
          </a>
          <div className="metrics">
            <span className="metric strong">
              登録{' '}
              {channel.subscriberHidden ? '非公開' : `${formatCompact(channel.subscriberCount)}人`}
            </span>
            <span className="metric">
              開設 {formatDate(channel.channelPublishedAt)}（{formatAge(channel.channelAgeDays)}）
            </span>
            <span className="metric">投稿 {formatNumber(channel.channelVideoCount)}本</span>
          </div>
          <div className="metrics">
            <span className="metric">ヒット {channel.videos.length}本</span>
            <span className="metric">最高再生 {formatCompact(channel.topViews)}回</span>
            <span className="metric">合計 {formatCompact(channel.totalViews)}回</span>
          </div>
        </div>
        <button type="button" className="button ghost small" onClick={() => setOpen(!open)}>
          {open ? '動画を隠す' : `動画を見る (${channel.videos.length})`}
        </button>
      </div>

      {open && (
        <div className="channel-videos">
          {channel.videos.map((video) => (
            <VideoCard key={video.videoId} video={video} compact />
          ))}
        </div>
      )}
    </article>
  )
}

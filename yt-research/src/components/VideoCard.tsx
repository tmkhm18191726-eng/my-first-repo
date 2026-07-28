import { channelUrl, formatAge, formatCompact, formatDate, formatNumber, videoUrl } from '../lib/format'
import type { VideoHit } from '../types'

interface Props {
  video: VideoHit
  /** チャンネル一覧の中では、チャンネル情報の重複表示を省く */
  compact?: boolean
}

export function VideoCard({ video, compact = false }: Props) {
  return (
    <article className={compact ? 'video-card compact' : 'video-card'}>
      <a
        className="thumb"
        href={videoUrl(video.videoId)}
        target="_blank"
        rel="noreferrer noopener"
      >
        {video.thumbnail ? (
          <img src={video.thumbnail} alt="" loading="lazy" />
        ) : (
          <div className="thumb-fallback">no image</div>
        )}
        <span className="thumb-badge">{formatCompact(video.viewCount)}回</span>
      </a>

      <div className="video-body">
        <a
          className="video-title"
          href={videoUrl(video.videoId)}
          target="_blank"
          rel="noreferrer noopener"
        >
          {video.title}
        </a>

        <div className="metrics">
          <span className="metric strong">1日 {formatCompact(video.viewsPerDay)}回</span>
          <span className="metric">再生 {formatNumber(video.viewCount)}</span>
          <span className="metric">公開 {formatAge(video.videoAgeDays)}</span>
          {video.likeCount > 0 && (
            <span className="metric">高評価 {formatCompact(video.likeCount)}</span>
          )}
        </div>

        {!compact && (
          <div className="channel-line">
            <a
              className="channel-name"
              href={channelUrl(video.channelId)}
              target="_blank"
              rel="noreferrer noopener"
            >
              {video.channelTitle}
            </a>
            <span className="metric">
              登録 {video.subscriberHidden ? '非公開' : formatCompact(video.subscriberCount) + '人'}
            </span>
            <span className="metric">
              開設 {formatDate(video.channelPublishedAt)}（{formatAge(video.channelAgeDays)}）
            </span>
          </div>
        )}
      </div>
    </article>
  )
}

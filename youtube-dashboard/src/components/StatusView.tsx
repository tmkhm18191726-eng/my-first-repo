import type { ChannelSnapshot } from '../types'
import { formatCountJa, formatRelativeJa } from '../lib/format'

interface Props {
  snapshot: ChannelSnapshot | null
  loading: boolean
  error: string | null
  onRefresh: () => void
}

export function StatusView({ snapshot, loading, error, onRefresh }: Props) {
  if (error && !snapshot) {
    return (
      <div className="status-view">
        <p className="status-error">{error}</p>
        <button type="button" className="retry-button" onClick={onRefresh}>
          再試行
        </button>
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div className="status-view">
        <p className="status-loading">{loading ? '読み込み中...' : 'チャンネルを選択してください'}</p>
      </div>
    )
  }

  const { channel, stats, videos, isLive } = snapshot

  return (
    <div className="status-view">
      <div className="channel-header">
        {channel.thumbnail ? (
          <img src={channel.thumbnail} alt="" className="channel-avatar" />
        ) : (
          <span className="channel-avatar chip-avatar-fallback" aria-hidden="true">
            📺
          </span>
        )}
        <div className="channel-header-text">
          <h1>{channel.title}</h1>
          {isLive && <span className="live-badge">🔴 ライブ配信中</span>}
        </div>
        <button
          type="button"
          className={`refresh-button${loading ? ' spinning' : ''}`}
          onClick={onRefresh}
          disabled={loading}
          aria-label="更新"
        >
          ⟳
        </button>
      </div>

      {error && <p className="status-error inline">{error}</p>}

      <div className="stats-grid">
        <StatCard
          label="登録者数"
          value={stats.hiddenSubscriberCount ? '非公開' : formatCountJa(stats.subscriberCount)}
        />
        <StatCard label="総再生数" value={formatCountJa(stats.viewCount)} />
        <StatCard label="動画数" value={formatCountJa(stats.videoCount)} />
      </div>

      <h2 className="section-title">最新の動画</h2>
      <ul className="video-list">
        {videos.map((video) => (
          <li key={video.id} className="video-item">
            {video.thumbnail && <img src={video.thumbnail} alt="" className="video-thumb" />}
            <div className="video-info">
              <p className="video-title">
                {video.liveBroadcastContent === 'live' && <span className="video-live">LIVE </span>}
                {video.liveBroadcastContent === 'upcoming' && <span className="video-upcoming">配信予定 </span>}
                {video.title}
              </p>
              <p className="video-meta">
                {formatRelativeJa(video.publishedAt)} ・ 👁 {formatCountJa(video.viewCount)}
                {video.commentCount !== null && <> ・ 💬 {formatCountJa(video.commentCount)}</>}
              </p>
            </div>
          </li>
        ))}
        {videos.length === 0 && <li className="video-empty">動画が見つかりませんでした。</li>}
      </ul>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

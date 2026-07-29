import type { ChannelEntry } from '../types'
import { useChannelSnapshot } from '../hooks/useChannelSnapshot'
import { formatCountJa, formatRelativeJa } from '../lib/format'

interface Props {
  apiKey: string
  channel: ChannelEntry
}

export function ChannelStatusCard({ apiKey, channel }: Props) {
  const { snapshot, loading, error, refresh } = useChannelSnapshot(apiKey, channel)

  return (
    <div className="channel-card">
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
          {snapshot?.isLive && <span className="live-badge">🔴 ライブ配信中</span>}
        </div>
        <button
          type="button"
          className={`refresh-button${loading ? ' spinning' : ''}`}
          onClick={refresh}
          disabled={loading}
          aria-label="更新"
        >
          ⟳
        </button>
      </div>

      {error && <p className="status-error inline">{error}</p>}

      {!snapshot && !error && <p className="status-loading small">読み込み中...</p>}

      {snapshot && (
        <>
          <div className="stats-grid">
            <StatCard
              label="登録者数"
              value={snapshot.stats.hiddenSubscriberCount ? '非公開' : formatCountJa(snapshot.stats.subscriberCount)}
            />
            <StatCard label="総再生数" value={formatCountJa(snapshot.stats.viewCount)} />
            <StatCard label="動画数" value={formatCountJa(snapshot.stats.videoCount)} />
          </div>

          <ul className="video-list">
            {snapshot.videos.slice(0, 3).map((video) => (
              <li key={video.id} className="video-item">
                {video.thumbnail && <img src={video.thumbnail} alt="" className="video-thumb" />}
                <div className="video-info">
                  <p className="video-title">
                    {video.liveBroadcastContent === 'live' && <span className="video-live">LIVE </span>}
                    {video.liveBroadcastContent === 'upcoming' && (
                      <span className="video-upcoming">配信予定 </span>
                    )}
                    {video.title}
                  </p>
                  <p className="video-meta">
                    {formatRelativeJa(video.publishedAt)} ・ 👁 {formatCountJa(video.viewCount)}
                    {video.commentCount !== null && <> ・ 💬 {formatCountJa(video.commentCount)}</>}
                  </p>
                </div>
              </li>
            ))}
            {snapshot.videos.length === 0 && <li className="video-empty">動画が見つかりませんでした。</li>}
          </ul>
        </>
      )}
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

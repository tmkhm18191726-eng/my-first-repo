import type { ChannelEntry } from '../types'

interface Props {
  channels: ChannelEntry[]
  selectedId: string | null
  liveIds: Set<string>
  onSelect: (id: string) => void
}

export function ChannelSwitcher({ channels, selectedId, liveIds, onSelect }: Props) {
  const mine = channels.filter((c) => c.group === 'mine')
  const benchmark = channels.filter((c) => c.group === 'benchmark')

  return (
    <div className="switcher">
      {mine.length > 0 && (
        <ChannelRow label="自分のチャンネル" channels={mine} selectedId={selectedId} liveIds={liveIds} onSelect={onSelect} />
      )}
      {benchmark.length > 0 && (
        <ChannelRow label="ベンチマーク" channels={benchmark} selectedId={selectedId} liveIds={liveIds} onSelect={onSelect} />
      )}
    </div>
  )
}

function ChannelRow({
  label,
  channels,
  selectedId,
  liveIds,
  onSelect,
}: {
  label: string
  channels: ChannelEntry[]
  selectedId: string | null
  liveIds: Set<string>
  onSelect: (id: string) => void
}) {
  return (
    <div className="switcher-group">
      <span className="switcher-label">{label}</span>
      <div className="switcher-row">
        {channels.map((channel) => (
          <button
            key={channel.id}
            type="button"
            className={`chip${channel.id === selectedId ? ' chip-active' : ''}`}
            onClick={() => onSelect(channel.id)}
          >
            {channel.thumbnail ? (
              <img src={channel.thumbnail} alt="" className="chip-avatar" />
            ) : (
              <span className="chip-avatar chip-avatar-fallback" aria-hidden="true">
                📺
              </span>
            )}
            <span className="chip-title">{channel.title}</span>
            {liveIds.has(channel.id) && <span className="chip-live">LIVE</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

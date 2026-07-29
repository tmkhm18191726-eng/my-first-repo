import type { ChannelEntry } from '../types'
import { ChannelStatusCard } from './ChannelStatusCard'

interface Props {
  apiKey: string
  channels: ChannelEntry[]
  googleAccessToken: string | null
}

export function ChannelListView({ apiKey, channels, googleAccessToken }: Props) {
  const mine = channels.filter((c) => c.group === 'mine')
  const benchmark = channels.filter((c) => c.group === 'benchmark')

  return (
    <div className="list-view">
      {mine.length > 0 && (
        <section>
          <h2 className="list-group-title">自分のチャンネル</h2>
          {mine.map((channel) => (
            <ChannelStatusCard
              key={channel.id}
              apiKey={apiKey}
              channel={channel}
              googleAccessToken={googleAccessToken}
            />
          ))}
        </section>
      )}
      {benchmark.length > 0 && (
        <section>
          <h2 className="list-group-title">ベンチマーク</h2>
          {benchmark.map((channel) => (
            <ChannelStatusCard
              key={channel.id}
              apiKey={apiKey}
              channel={channel}
              googleAccessToken={googleAccessToken}
            />
          ))}
        </section>
      )}
    </div>
  )
}

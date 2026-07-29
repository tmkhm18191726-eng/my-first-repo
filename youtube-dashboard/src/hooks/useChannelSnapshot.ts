import { useCallback, useEffect, useState } from 'react'
import { fetchChannelSnapshot } from '../lib/youtube'
import type { ChannelEntry, ChannelSnapshot } from '../types'

const CACHE_TTL_MS = 2 * 60 * 1000
const cache = new Map<string, ChannelSnapshot>()

export function useChannelSnapshot(apiKey: string, channel: ChannelEntry | null) {
  const [snapshot, setSnapshot] = useState<ChannelSnapshot | null>(
    channel ? (cache.get(channel.id) ?? null) : null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (force: boolean) => {
      if (!apiKey || !channel) return
      const cached = cache.get(channel.id)
      if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        setSnapshot(cached)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const result = await fetchChannelSnapshot(apiKey, channel)
        cache.set(channel.id, result)
        setSnapshot(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : '取得に失敗しました。')
      } finally {
        setLoading(false)
      }
    },
    [apiKey, channel],
  )

  useEffect(() => {
    setSnapshot(channel ? (cache.get(channel.id) ?? null) : null)
    setError(null)
    void load(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, channel?.id])

  return { snapshot, loading, error, refresh: () => load(true) }
}

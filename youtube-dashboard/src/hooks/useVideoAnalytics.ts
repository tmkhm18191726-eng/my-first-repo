import { useEffect, useState } from 'react'
import { fetchRecentVideoAnalytics, type VideoAnalytics } from '../lib/youtubeAnalytics'

export function useVideoAnalytics(
  accessToken: string | null,
  channelId: string,
  videoIds: string[],
  enabled: boolean,
) {
  const [data, setData] = useState<Record<string, VideoAnalytics>>({})
  const [error, setError] = useState<string | null>(null)
  const videoIdsKey = videoIds.join(',')

  useEffect(() => {
    if (!enabled || !accessToken || videoIds.length === 0) {
      setData({})
      return
    }
    let cancelled = false
    setError(null)
    fetchRecentVideoAnalytics(accessToken, channelId, videoIds)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '取得に失敗しました。')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, channelId, videoIdsKey, enabled])

  return { data, error }
}

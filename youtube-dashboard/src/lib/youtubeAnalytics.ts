export interface VideoAnalytics {
  views: number
  impressions: number | null
  ctr: number | null
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function last7DayRange(): { startDate: string; endDate: string } {
  const end = new Date()
  end.setDate(end.getDate() - 2) // analytics data has a reporting lag of ~1-2 days
  const start = new Date(end)
  start.setDate(start.getDate() - 6)
  return { startDate: isoDate(start), endDate: isoDate(end) }
}

export async function fetchRecentVideoAnalytics(
  accessToken: string,
  channelId: string,
  videoIds: string[],
): Promise<Record<string, VideoAnalytics>> {
  if (videoIds.length === 0) return {}
  const { startDate, endDate } = last7DayRange()
  const url = new URL('https://youtubeanalytics.googleapis.com/v2/reports')
  url.searchParams.set('ids', `channel==${channelId}`)
  url.searchParams.set('startDate', startDate)
  url.searchParams.set('endDate', endDate)
  url.searchParams.set('metrics', 'views,impressions,impressionsClickThroughRate')
  url.searchParams.set('dimensions', 'video')
  url.searchParams.set('filters', `video==${videoIds.join(',')}`)

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) return {}
    throw new Error(`YouTube Analytics APIエラー (status ${res.status})`)
  }
  const data = await res.json()
  const columnHeaders: { name: string }[] = data.columnHeaders ?? []
  const videoIndex = columnHeaders.findIndex((c) => c.name === 'video')
  const viewsIndex = columnHeaders.findIndex((c) => c.name === 'views')
  const impressionsIndex = columnHeaders.findIndex((c) => c.name === 'impressions')
  const ctrIndex = columnHeaders.findIndex((c) => c.name === 'impressionsClickThroughRate')

  const result: Record<string, VideoAnalytics> = {}
  for (const row of data.rows ?? []) {
    const videoId = row[videoIndex]
    result[videoId] = {
      views: Number(row[viewsIndex] ?? 0),
      impressions: impressionsIndex >= 0 ? Number(row[impressionsIndex]) : null,
      ctr: ctrIndex >= 0 ? Number(row[ctrIndex]) : null,
    }
  }
  return result
}

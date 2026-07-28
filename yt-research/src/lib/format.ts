const NUMBER_FORMATTER = new Intl.NumberFormat('ja-JP')
const DATE_FORMATTER = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
})

export function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value)
}

/** 12,345 -> 1.2万 のように日本語で読みやすく丸める */
export function formatCompact(value: number): string {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1).replace(/\.0$/, '')}億`
  if (value >= 10_000) return `${(value / 10_000).toFixed(1).replace(/\.0$/, '')}万`
  return NUMBER_FORMATTER.format(value)
}

export function formatDate(iso: string): string {
  if (!iso) return '不明'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '不明'
  return DATE_FORMATTER.format(date)
}

/** 経過日数を「3日前」「2ヶ月前」のように表す */
export function formatAge(days: number): string {
  if (days <= 1) return '1日以内'
  if (days < 31) return `${days}日前`
  if (days < 365) return `${Math.floor(days / 30)}ヶ月前`
  const years = Math.floor(days / 365)
  const months = Math.floor((days % 365) / 30)
  return months > 0 ? `${years}年${months}ヶ月前` : `${years}年前`
}

export function videoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

export function channelUrl(channelId: string): string {
  return `https://www.youtube.com/channel/${channelId}`
}

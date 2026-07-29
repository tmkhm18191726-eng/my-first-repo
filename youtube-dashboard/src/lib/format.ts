export function formatCountJa(value: number | null): string {
  if (value === null) return '—'
  if (value >= 1e8) return `${trimZero(value / 1e8)}億`
  if (value >= 1e4) return `${trimZero(value / 1e4)}万`
  return value.toLocaleString('ja-JP')
}

function trimZero(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export function formatRelativeJa(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}分前`
  if (diffMs < day) return `${Math.floor(diffMs / hour)}時間前`
  if (diffMs < 30 * day) return `${Math.floor(diffMs / day)}日前`
  const date = new Date(isoDate)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

import type { SearchFilters } from '../types'
import { formatCompact } from './format'

/** 検索条件を1行のラベルにまとめる */
export function describeFilters(filters: SearchFilters): string {
  const parts: string[] = []
  if (filters.channelWithinDays !== null) parts.push(`開設${filters.channelWithinDays}日以内`)
  if (filters.videoWithinDays !== null) parts.push(`公開${filters.videoWithinDays}日以内`)
  if (filters.minViews !== null) parts.push(`${formatCompact(filters.minViews)}回以上`)
  if (filters.minSubscribers !== null) {
    parts.push(`登録${formatCompact(filters.minSubscribers)}人以上`)
  }
  if (filters.maxSubscribers !== null) {
    parts.push(`登録${formatCompact(filters.maxSubscribers)}人以下`)
  }
  return parts.length > 0 ? parts.join(' / ') : '条件なし'
}

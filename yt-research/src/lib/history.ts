import type { HistoryEntry, SearchFilters, SearchResult } from '../types'
import { quotaDayKey } from './quota'

const STORAGE_KEY = 'yt-research:history'
/** 履歴に残す検索の件数 */
const MAX_ENTRIES = 30
/** 1件の履歴に保存する動画の件数（localStorage を膨らませないため） */
const MAX_VIDEOS_PER_ENTRY = 50

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : []
  } catch {
    return []
  }
}

function save(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // 容量オーバーなどで保存できなくても検索自体は続けられるようにする
  }
}

export function appendHistory(result: SearchResult): HistoryEntry[] {
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    filters: result.filters,
    stats: result.stats,
    searchedAt: result.searchedAt,
    videos: result.videos.slice(0, MAX_VIDEOS_PER_ENTRY),
  }
  const entries = [entry, ...loadHistory()].slice(0, MAX_ENTRIES)
  save(entries)
  return entries
}

/** 並び順に左右されずに検索条件を比べるためのキー */
function filtersKey(filters: SearchFilters): string {
  return JSON.stringify(
    Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, value]),
  )
}

/**
 * 同じクォータ日のうちに同じ条件で検索した履歴を探す。
 * 見つかればその結果を再利用でき、API を呼ばずに済む。
 */
export function findCachedEntry(filters: SearchFilters): HistoryEntry | null {
  const today = quotaDayKey()
  const key = filtersKey(filters)
  return (
    loadHistory().find(
      (entry) =>
        quotaDayKey(new Date(entry.searchedAt).getTime()) === today &&
        filtersKey(entry.filters) === key,
    ) ?? null
  )
}

export function removeHistory(id: string): HistoryEntry[] {
  const entries = loadHistory().filter((entry) => entry.id !== id)
  save(entries)
  return entries
}

export function clearHistory(): HistoryEntry[] {
  save([])
  return []
}

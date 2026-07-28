import type { HistoryEntry, SearchResult } from '../types'

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

export function removeHistory(id: string): HistoryEntry[] {
  const entries = loadHistory().filter((entry) => entry.id !== id)
  save(entries)
  return entries
}

export function clearHistory(): HistoryEntry[] {
  save([])
  return []
}

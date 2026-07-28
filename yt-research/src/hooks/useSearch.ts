import { useCallback, useEffect, useRef, useState } from 'react'
import { groupByChannel, searchVideos, type SearchProgress } from '../lib/youtube'
import { appendHistory } from '../lib/history'
import type { HistoryEntry, SearchFilters, SearchResult } from '../types'

const PHASE_LABELS: Record<SearchProgress['phase'], string> = {
  search: '動画を検索中',
  videos: '再生数を取得中',
  channels: 'チャンネル情報を取得中',
  done: '仕上げ中',
}

export function useSearch(apiKey: string, onHistoryChange: (entries: HistoryEntry[]) => void) {
  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const run = useCallback(
    async (filters: SearchFilters) => {
      if (!apiKey) {
        setError('先に YouTube Data API のキーを設定してください。')
        return
      }
      if (!filters.keyword.trim()) {
        setError('検索するキーワードを入力してください。')
        return
      }

      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      setLoading(true)
      setError(null)
      setProgress('動画を検索中')

      try {
        const next = await searchVideos({ ...filters, keyword: filters.keyword.trim() }, apiKey, {
          signal: controller.signal,
          onProgress: (value) => {
            const label = PHASE_LABELS[value.phase]
            setProgress(
              value.totalPages > 1 ? `${label}（${value.page}/${value.totalPages}）` : label,
            )
          },
        })
        if (controller.signal.aborted) return
        setResult(next)
        onHistoryChange(appendHistory(next))
      } catch (err) {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
          return
        }
        setError(err instanceof Error ? err.message : '検索に失敗しました。')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
          setProgress(null)
        }
      }
    },
    [apiKey, onHistoryChange],
  )

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
    setLoading(false)
    setProgress(null)
  }, [])

  const showHistoryEntry = useCallback((entry: HistoryEntry) => {
    setError(null)
    setResult({
      filters: entry.filters,
      videos: entry.videos,
      // 履歴は動画だけ保存しているので、表示時にチャンネル単位へまとめ直す
      channels: groupByChannel(entry.videos),
      stats: entry.stats,
      searchedAt: entry.searchedAt,
    })
  }, [])

  return { result, loading, progress, error, run, cancel, showHistoryEntry }
}

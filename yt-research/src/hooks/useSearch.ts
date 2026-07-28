import { useCallback, useEffect, useRef, useState } from 'react'
import { estimateQuota, groupByChannel, searchVideos, type SearchProgress } from '../lib/youtube'
import { appendHistory, findCachedEntry } from '../lib/history'
import { addQuotaUsage, DAILY_QUOTA, loadQuotaUsage } from '../lib/quota'
import type { HistoryEntry, SearchFilters, SearchResult } from '../types'

const PHASE_LABELS: Record<SearchProgress['phase'], string> = {
  search: '動画を検索中',
  videos: '再生数を取得中',
  channels: 'チャンネル情報を取得中',
  done: '仕上げ中',
}

function toResult(entry: HistoryEntry): SearchResult {
  return {
    filters: entry.filters,
    videos: entry.videos,
    // 履歴は動画だけ保存しているので、表示時にチャンネル単位へまとめ直す
    channels: groupByChannel(entry.videos),
    stats: entry.stats,
    searchedAt: entry.searchedAt,
  }
}

export function useSearch(apiKey: string, onHistoryChange: (entries: HistoryEntry[]) => void) {
  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [quotaUsed, setQuotaUsed] = useState(() => loadQuotaUsage().used)
  /** 履歴から再利用したことを伝えるメッセージ */
  const [reusedAt, setReusedAt] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const run = useCallback(
    async (filters: SearchFilters, options: { force?: boolean } = {}) => {
      if (!apiKey) {
        setError('先に YouTube Data API のキーを設定してください。')
        return
      }
      const keyword = filters.keyword.trim()
      if (!keyword) {
        setError('検索するキーワードを入力してください。')
        return
      }

      const normalized: SearchFilters = { ...filters, keyword }

      // 同じ日に同じ条件で検索済みなら、API を呼ばずに履歴の結果を出す
      if (!options.force) {
        const cached = findCachedEntry(normalized)
        if (cached) {
          setError(null)
          setResult(toResult(cached))
          setReusedAt(cached.searchedAt)
          return
        }
      }

      const remaining = DAILY_QUOTA - loadQuotaUsage().used
      const cost = estimateQuota(normalized.pages)
      if (remaining < cost) {
        setError(
          `この検索にはクォータが約 ${cost} 必要ですが、本日の残りは ${Math.max(0, remaining)} です。取得ページ数を減らすか、リセットを待ってください。`,
        )
        return
      }

      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      setLoading(true)
      setError(null)
      setReusedAt(null)
      setProgress('動画を検索中')

      try {
        const next = await searchVideos(normalized, apiKey, {
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
        setQuotaUsed(addQuotaUsage(next.stats.quotaUsed).used)
        onHistoryChange(appendHistory(next))
      } catch (err) {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
          return
        }
        // 失敗しても呼んだ分のクォータは戻らないので、概算を足しておく
        setQuotaUsed(addQuotaUsage(cost).used)
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
    setReusedAt(entry.searchedAt)
    setResult(toResult(entry))
  }, [])

  const syncQuota = useCallback((used: number) => setQuotaUsed(used), [])

  return {
    result,
    loading,
    progress,
    error,
    quotaUsed,
    reusedAt,
    run,
    cancel,
    showHistoryEntry,
    syncQuota,
  }
}

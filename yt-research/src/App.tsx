import { useCallback, useEffect, useState } from 'react'
import { SearchForm } from './components/SearchForm'
import { ResultList } from './components/ResultList'
import { ApiKeyPanel } from './components/ApiKeyPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { QuotaMeter } from './components/QuotaMeter'
import { describeFilters } from './lib/filters'
import { estimateQuota } from './lib/youtube'
import { hasStoredApiKey, useApiKey } from './hooks/useApiKey'
import { useSearch } from './hooks/useSearch'
import { clearHistory, loadHistory, removeHistory } from './lib/history'
import { DEFAULT_FILTERS, type HistoryEntry, type SearchFilters } from './types'
import './App.css'

type Tab = 'search' | 'history' | 'settings'

const REUSED_FORMATTER = new Intl.DateTimeFormat('ja-JP', {
  hour: '2-digit',
  minute: '2-digit',
})

const TAB_LABELS: Record<Tab, string> = {
  search: 'リサーチ',
  history: '履歴',
  settings: '設定',
}

function App() {
  const { apiKey, setApiKey } = useApiKey()
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [tab, setTab] = useState<Tab>(() => (hasStoredApiKey() ? 'search' : 'settings'))

  useEffect(() => setHistory(loadHistory()), [])

  const handleHistoryChange = useCallback((entries: HistoryEntry[]) => setHistory(entries), [])
  const {
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
  } = useSearch(apiKey, handleHistoryChange)

  const handleShowHistory = (entry: HistoryEntry) => {
    showHistoryEntry(entry)
    setFilters(entry.filters)
    setTab('search')
  }

  const handleReuseFilters = (next: SearchFilters) => {
    setFilters(next)
    setTab('search')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">YouTube リサーチ</h1>
        <p className="app-tagline">伸びている新しいチャンネルを、条件から一気に見つける</p>
        <nav className="tabs">
          {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
            <button
              key={key}
              type="button"
              className={tab === key ? 'tab active' : 'tab'}
              onClick={() => setTab(key)}
            >
              {TAB_LABELS[key]}
              {key === 'history' && history.length > 0 && (
                <span className="tab-count">{history.length}</span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {tab === 'search' && (
          <>
            {!apiKey && (
              <div className="banner">
                <p>まず API キーを設定すると検索できます。</p>
                <button
                  type="button"
                  className="button primary small"
                  onClick={() => setTab('settings')}
                >
                  設定を開く
                </button>
              </div>
            )}

            {apiKey && (
              <QuotaMeter
                used={quotaUsed}
                cost={estimateQuota(filters.pages)}
                onReset={syncQuota}
              />
            )}

            <SearchForm
              filters={filters}
              loading={loading}
              onChange={setFilters}
              onSubmit={() => run(filters)}
              onCancel={cancel}
            />

            {error && <p className="error">{error}</p>}
            {loading && <p className="notice">{progress ?? '検索中...'}</p>}

            {result && !loading && (
              <>
                <p className="applied-filters">
                  「{result.filters.keyword}」 · {describeFilters(result.filters)}
                </p>
                {reusedAt && (
                  <div className="banner subtle">
                    <p>
                      {REUSED_FORMATTER.format(new Date(reusedAt))}
                      の検索結果を表示しています（クォータ消費なし）
                    </p>
                    <button
                      type="button"
                      className="button ghost small"
                      onClick={() => run(result.filters, { force: true })}
                    >
                      API から取り直す
                    </button>
                  </div>
                )}
                <ResultList result={result} />
              </>
            )}

            {!result && !loading && !error && (
              <div className="empty">
                <p className="empty-title">まだ検索していません</p>
                <p className="hint">
                  例えば「BGM」×「チャンネル開設365日以内」×「再生数1,000回以上」で検索すると、
                  最近始まったのに伸びているチャンネルが見つかります。真似できる型を探すのに使ってください。
                </p>
              </div>
            )}
          </>
        )}

        {tab === 'history' && (
          <HistoryPanel
            entries={history}
            onShow={handleShowHistory}
            onReuse={handleReuseFilters}
            onRemove={(id) => setHistory(removeHistory(id))}
            onClear={() => setHistory(clearHistory())}
          />
        )}

        {tab === 'settings' && <ApiKeyPanel apiKey={apiKey} onSave={setApiKey} />}
      </main>
    </div>
  )
}

export default App

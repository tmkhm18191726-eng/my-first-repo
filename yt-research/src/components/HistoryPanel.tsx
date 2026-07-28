import { formatNumber } from '../lib/format'
import { describeFilters } from '../lib/filters'
import type { HistoryEntry, SearchFilters } from '../types'

interface Props {
  entries: HistoryEntry[]
  onShow: (entry: HistoryEntry) => void
  onReuse: (filters: SearchFilters) => void
  onRemove: (id: string) => void
  onClear: () => void
}

const TIME_FORMATTER = new Intl.DateTimeFormat('ja-JP', {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function HistoryPanel({ entries, onShow, onReuse, onRemove, onClear }: Props) {
  if (entries.length === 0) {
    return (
      <section className="panel">
        <h2 className="panel-title">検索履歴</h2>
        <p className="hint">
          検索するとここに履歴が残ります。過去の検索結果はそのまま見返せるので、クォータを使わずに比較できます。
        </p>
      </section>
    )
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">検索履歴</h2>
        <button type="button" className="button ghost small" onClick={onClear}>
          すべて削除
        </button>
      </div>

      <ul className="history-list">
        {entries.map((entry) => (
          <li key={entry.id} className="history-item">
            <div className="history-main">
              <p className="history-keyword">{entry.filters.keyword}</p>
              <p className="history-meta">{describeFilters(entry.filters)}</p>
              <p className="history-meta">
                {formatNumber(entry.stats.channels)}ch / {formatNumber(entry.stats.matched)}本 ·{' '}
                {TIME_FORMATTER.format(new Date(entry.searchedAt))}
              </p>
            </div>
            <div className="history-actions">
              <button type="button" className="button ghost small" onClick={() => onShow(entry)}>
                結果を見る
              </button>
              <button
                type="button"
                className="button ghost small"
                onClick={() => onReuse(entry.filters)}
              >
                条件を再利用
              </button>
              <button
                type="button"
                className="button ghost small danger"
                onClick={() => onRemove(entry.id)}
              >
                削除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

import { useId } from 'react'
import {
  CHANNEL_PERIOD_OPTIONS,
  DEFAULT_FILTERS,
  ORDER_LABELS,
  SUBSCRIBER_OPTIONS,
  VIDEO_PERIOD_OPTIONS,
  VIEW_OPTIONS,
  type SearchFilters,
  type SearchOrder,
} from '../types'
import { estimateQuota } from '../lib/youtube'

interface Props {
  filters: SearchFilters
  loading: boolean
  onChange: (filters: SearchFilters) => void
  onSubmit: () => void
  onCancel: () => void
}

/** 「指定なし」を空文字で表す select の値変換 */
function toValue(value: number | null): string {
  return value === null ? '' : String(value)
}

function fromValue(value: string): number | null {
  return value === '' ? null : Number(value)
}

export function SearchForm({ filters, loading, onChange, onSubmit, onCancel }: Props) {
  const keywordId = useId()
  const patch = (partial: Partial<SearchFilters>) => onChange({ ...filters, ...partial })

  return (
    <form
      className="search-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div className="field">
        <label className="field-label" htmlFor={keywordId}>
          タイトルキーワード
        </label>
        <input
          id={keywordId}
          className="text-input"
          type="search"
          placeholder="例: BGM　作業用"
          value={filters.keyword}
          onChange={(event) => patch({ keyword: event.target.value })}
          autoComplete="off"
          enterKeyHint="search"
        />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={filters.titleOnly}
            onChange={(event) => patch({ titleOnly: event.target.checked })}
          />
          <span>タイトルに含む動画だけに絞る（スペース区切りで AND 検索）</span>
        </label>
      </div>

      <div className="field-grid">
        <div className="field">
          <span className="field-label">チャンネル開設</span>
          <select
            className="select"
            value={toValue(filters.channelWithinDays)}
            onChange={(event) => patch({ channelWithinDays: fromValue(event.target.value) })}
          >
            {CHANNEL_PERIOD_OPTIONS.map((option) => (
              <option key={option.label} value={toValue(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <span className="field-label">動画公開日</span>
          <select
            className="select"
            value={toValue(filters.videoWithinDays)}
            onChange={(event) => patch({ videoWithinDays: fromValue(event.target.value) })}
          >
            {VIDEO_PERIOD_OPTIONS.map((option) => (
              <option key={option.label} value={toValue(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <span className="field-label">再生数</span>
          <select
            className="select"
            value={toValue(filters.minViews)}
            onChange={(event) => patch({ minViews: fromValue(event.target.value) })}
          >
            {VIEW_OPTIONS.map((option) => (
              <option key={option.label} value={toValue(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field wide">
          <span className="field-label">登録者数</span>
          <div className="range-row">
            <select
              className="select"
              value={toValue(filters.minSubscribers)}
              onChange={(event) => patch({ minSubscribers: fromValue(event.target.value) })}
            >
              {SUBSCRIBER_OPTIONS.map((option) => (
                <option key={option.label} value={toValue(option.value)}>
                  {option.value === null ? '下限なし' : `${option.label}以上`}
                </option>
              ))}
            </select>
            <span className="range-tilde">〜</span>
            <select
              className="select"
              value={toValue(filters.maxSubscribers)}
              onChange={(event) => patch({ maxSubscribers: fromValue(event.target.value) })}
            >
              {SUBSCRIBER_OPTIONS.map((option) => (
                <option key={option.label} value={toValue(option.value)}>
                  {option.value === null ? '上限なし' : `${option.label}以下`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <details className="advanced">
        <summary>詳細設定（取得方法・クォータ）</summary>
        <div className="field-grid">
          <div className="field">
            <span className="field-label">取得の並び順</span>
            <select
              className="select"
              value={filters.order}
              onChange={(event) => patch({ order: event.target.value as SearchOrder })}
            >
              {Object.entries(ORDER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <span className="field-label">取得ページ数（1ページ50件）</span>
            <select
              className="select"
              value={String(filters.pages)}
              onChange={(event) => patch({ pages: Number(event.target.value) })}
            >
              {[1, 2, 3, 4, 5].map((page) => (
                <option key={page} value={page}>
                  {page}ページ（最大{page * 50}件・約{estimateQuota(page)}クォータ）
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={filters.japaneseOnly}
            onChange={(event) => patch({ japaneseOnly: event.target.checked })}
          />
          <span>日本語・日本向けの動画に絞る</span>
        </label>
        <p className="hint">
          1日に使える無料クォータは 10,000 です。1回の検索で約
          {estimateQuota(filters.pages)} 使うので、この設定なら1日
          {Math.floor(10000 / estimateQuota(filters.pages))} 回ほど検索できます。
        </p>
      </details>

      <div className="form-actions">
        {loading ? (
          <button type="button" className="button ghost" onClick={onCancel}>
            中止する
          </button>
        ) : (
          <button
            type="button"
            className="button ghost"
            onClick={() => onChange({ ...DEFAULT_FILTERS, keyword: filters.keyword })}
          >
            条件をリセット
          </button>
        )}
        <button type="submit" className="button primary" disabled={loading}>
          {loading ? '検索中...' : 'この条件で検索'}
        </button>
      </div>
    </form>
  )
}

import { useEffect, useState } from 'react'
import { DAILY_QUOTA, describeReset, resetQuotaUsage } from '../lib/quota'
import { formatNumber } from '../lib/format'
import { estimateQuota } from '../lib/youtube'

interface Props {
  used: number
  /** 現在の条件で1回検索したときのコスト */
  cost: number
  onReset: (used: number) => void
}

export function QuotaMeter({ used, cost, onReset }: Props) {
  const [resetLabel, setResetLabel] = useState(() => describeReset())

  // 残り時間の表示を1分ごとに更新する
  useEffect(() => {
    const timer = setInterval(() => setResetLabel(describeReset()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const remaining = Math.max(0, DAILY_QUOTA - used)
  const ratio = Math.min(1, used / DAILY_QUOTA)
  const searchesLeft = Math.floor(remaining / Math.max(cost, estimateQuota(1)))
  const level = ratio >= 0.9 ? 'danger' : ratio >= 0.6 ? 'warn' : 'ok'

  return (
    <section className="quota">
      <div className="quota-head">
        <span className="quota-label">本日の無料クォータ</span>
        <span className="quota-value">
          {formatNumber(used)} / {formatNumber(DAILY_QUOTA)}
        </span>
      </div>

      <div className="quota-bar">
        <div className={`quota-fill ${level}`} style={{ width: `${ratio * 100}%` }} />
      </div>

      <div className="quota-foot">
        <span>
          この条件であと <strong>{formatNumber(searchesLeft)}</strong> 回検索できます
        </span>
        <span className="quota-reset">{resetLabel}</span>
      </div>

      {used > 0 && (
        <button
          type="button"
          className="button ghost small quota-reset-button"
          onClick={() => onReset(resetQuotaUsage().used)}
        >
          カウンターをリセット
        </button>
      )}
    </section>
  )
}

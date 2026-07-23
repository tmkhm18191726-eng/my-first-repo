import { getAdviceLines } from '../lib/advice'
import type { Forecast } from '../types'

interface Props {
  forecast: Forecast
}

export function AdviceTip({ forecast }: Props) {
  const lines = getAdviceLines(forecast)

  return (
    <div className="advice-tip">
      <span className="advice-tip-icon">💗</span>
      <div className="advice-tip-text">
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
      <span className="advice-tip-chevron">›</span>
    </div>
  )
}

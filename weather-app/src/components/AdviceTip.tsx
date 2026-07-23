import { getAdvice } from '../lib/advice'
import type { Forecast } from '../types'

interface Props {
  forecast: Forecast
}

export function AdviceTip({ forecast }: Props) {
  const { icon, lines } = getAdvice(forecast)

  return (
    <div className="advice-tip">
      <span className="advice-tip-icon">{icon}</span>
      <div className="advice-tip-text">
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  )
}

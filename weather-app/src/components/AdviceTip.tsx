import { getAdvice } from '../lib/advice'
import type { Forecast } from '../types'
import { HeartIcon, UmbrellaIcon } from './CuteIcons'

interface Props {
  forecast: Forecast
}

export function AdviceTip({ forecast }: Props) {
  const { lines } = getAdvice(forecast)
  const rainy = forecast.daily[0]?.precipitationProbability >= 50

  return (
    <div className="advice-tip">
      <span className="advice-tip-icon">
        {rainy ? <UmbrellaIcon size={44} /> : <HeartIcon size={38} />}
      </span>
      <div className="advice-tip-text">
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  )
}

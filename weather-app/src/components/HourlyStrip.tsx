import type { HourlyPoint } from '../types'
import { WeatherIcon } from './WeatherIcon'

interface Props {
  hourly: HourlyPoint[]
}

export function HourlyStrip({ hourly }: Props) {
  return (
    <div className="hourly-strip">
      {hourly.slice(0, 5).map((point) => (
        <div className="hourly-card" key={point.time}>
          <span className="hourly-label">{point.hourLabel}</span>
          <WeatherIcon category={point.category} size={24} />
          <span className="hourly-temp">{point.temperature}°</span>
          <span className="hourly-precip">{point.precipitationProbability}%</span>
        </div>
      ))}
    </div>
  )
}

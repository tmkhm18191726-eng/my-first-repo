import type { DailyPoint } from '../types'
import { WeatherIcon } from './WeatherIcon'
import { UmbrellaIcon } from './CuteIcons'

interface Props {
  tomorrow: DailyPoint
}

export function TodayTomorrowCard({ tomorrow }: Props) {
  return (
    <div className="tt-card tomorrow-only">
      <div className="tt-row">
        <span className="tt-label">明日</span>
        <WeatherIcon category={tomorrow.category} size={24} />
        <span className="tt-temps">
          <span className="tt-max">{tomorrow.maxTemp}°</span>/
          <span className="tt-min">{tomorrow.minTemp}°</span>
        </span>
        <span className="tt-precip"><UmbrellaIcon size={13} />{tomorrow.precipitationProbability}%</span>
      </div>
    </div>
  )
}

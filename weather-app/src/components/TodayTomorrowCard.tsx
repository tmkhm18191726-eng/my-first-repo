import type { DailyPoint } from '../types'
import { WeatherIcon } from './WeatherIcon'
import { UmbrellaIcon } from './CuteIcons'

interface Props {
  today: DailyPoint
  tomorrow: DailyPoint
}

export function TodayTomorrowCard({ today, tomorrow }: Props) {
  return (
    <div className="tt-card">
      <div className="tt-row">
        <span className="tt-label">今日</span>
        <WeatherIcon category={today.category} size={22} />
        <span className="tt-temps">
          <span className="tt-max">{today.maxTemp}°</span>/
          <span className="tt-min">{today.minTemp}°</span>
        </span>
        <span className="tt-precip"><UmbrellaIcon size={13} />{today.precipitationProbability}%</span>
      </div>
      <div className="tt-divider" />
      <div className="tt-row">
        <span className="tt-label">明日</span>
        <WeatherIcon category={tomorrow.category} size={22} />
        <span className="tt-temps">
          <span className="tt-max">{tomorrow.maxTemp}°</span>/
          <span className="tt-min">{tomorrow.minTemp}°</span>
        </span>
        <span className="tt-precip"><UmbrellaIcon size={13} />{tomorrow.precipitationProbability}%</span>
      </div>
    </div>
  )
}

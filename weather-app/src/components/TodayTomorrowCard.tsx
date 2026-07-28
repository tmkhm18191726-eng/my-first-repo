import type { DailyPoint } from '../types'
import { WeatherIcon } from './WeatherIcon'
import { UmbrellaIcon } from './CuteIcons'

interface Props {
  today: DailyPoint
  tomorrow: DailyPoint
}

function WeatherSummaryRow({
  label,
  point,
}: {
  label: string
  point: DailyPoint
}) {
  return (
    <div className="tt-row">
      <span className="tt-label">{label}</span>
      <WeatherIcon category={point.category} size={22} />
      <span className="tt-temps">
        <span className="tt-max">{point.maxTemp}°</span>/
        <span className="tt-min">{point.minTemp}°</span>
      </span>
      <span className="tt-precip">
        <UmbrellaIcon size={13} />
        {point.precipitationProbability}%
      </span>
    </div>
  )
}

export function TodayTomorrowCard({ today, tomorrow }: Props) {
  return (
    <div className="tt-card today-tomorrow-card">
      <WeatherSummaryRow label="今日" point={today} />
      <div className="tt-divider" />
      <WeatherSummaryRow label="明日" point={tomorrow} />
    </div>
  )
}

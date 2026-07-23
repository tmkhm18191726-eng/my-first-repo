import { computeTodayPoints } from '../lib/todayPoints'
import type { DailyPoint } from '../types'

interface Props {
  today: DailyPoint
}

export function TodayPoints({ today }: Props) {
  const points = computeTodayPoints(today)

  return (
    <div className="today-points">
      {points.map((point) => (
        <div className="today-point-card" key={point.label}>
          <span className="today-point-icon">{point.icon}</span>
          <span className="today-point-label">{point.label}</span>
          <span className="today-point-text">{point.text}</span>
        </div>
      ))}
    </div>
  )
}

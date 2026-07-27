import { computeTodayPoints } from '../lib/todayPoints'
import type { DailyPoint } from '../types'
import { ClothesIcon, LaundryIcon, UmbrellaIcon } from './CuteIcons'

interface Props {
  today: DailyPoint
}

export function TodayPoints({ today }: Props) {
  const points = computeTodayPoints(today)

  return (
    <div className="today-points">
      {points.map((point) => (
        <div className="today-point-card" key={point.label}>
          <span className="today-point-icon">
            {point.label === '傘' && <UmbrellaIcon size={34} />}
            {point.label === '服装' && <ClothesIcon size={32} />}
            {point.label === '洗濯' && <LaundryIcon size={32} />}
          </span>
          <span className="today-point-text">{point.text}</span>
          <span className="today-point-reason">{point.reason}</span>
        </div>
      ))}
    </div>
  )
}

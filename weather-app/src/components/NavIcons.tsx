interface IconProps {
  active?: boolean
}

const STROKE_ACTIVE = '#ff6f91'
const STROKE_INACTIVE = '#c9b3bc'

export function WeatherTabIcon({ active }: IconProps) {
  const c = active ? STROKE_ACTIVE : STROKE_INACTIVE
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="5" stroke={c} strokeWidth="1.8" />
      <g stroke={c} strokeWidth="1.8" strokeLinecap="round">
        <line x1="12" y1="1.5" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22.5" />
        <line x1="1.5" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22.5" y2="12" />
        <line x1="4.4" y1="4.4" x2="6.1" y2="6.1" />
        <line x1="17.9" y1="17.9" x2="19.6" y2="19.6" />
        <line x1="19.6" y1="4.4" x2="17.9" y2="6.1" />
        <line x1="6.1" y1="17.9" x2="4.4" y2="19.6" />
      </g>
    </svg>
  )
}

const MONTH_LABELS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
]

export function ForecastTabIcon({ active }: IconProps) {
  const now = new Date()
  return (
    <span className={`calendar-icon${active ? ' active' : ''}`}>
      <span className="calendar-icon-month">{MONTH_LABELS[now.getMonth()]}</span>
      <span className="calendar-icon-day">{now.getDate()}</span>
    </span>
  )
}

export function PhotosTabIcon({ active }: IconProps) {
  const c = active ? STROKE_ACTIVE : STROKE_INACTIVE
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="3" stroke={c} strokeWidth="1.8" />
      <circle cx="8.5" cy="10" r="1.8" stroke={c} strokeWidth="1.8" />
      <path
        d="M4 17l5-5.2 4 3.6 3.5-4 4.5 5.6"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

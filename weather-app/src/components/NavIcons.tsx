interface IconProps {
  active?: boolean
}

const STROKE_ACTIVE = '#ff6f91'
const STROKE_INACTIVE = '#c9b3bc'

export function WeatherTabIcon({ active }: IconProps) {
  const c = active ? STROKE_ACTIVE : STROKE_INACTIVE
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <g fill={c}>
        <circle cx="12" cy="12" r="5.5" />
        <path d="M12 0l1.8 4.2h-3.6z" />
        <path d="M12 24l1.8-4.2h-3.6z" />
        <path d="M0 12l4.2-1.8v3.6z" />
        <path d="M24 12l-4.2-1.8v3.6z" />
        <path d="M3.5 3.5l4.4 1.1-1.1 4.4z" />
        <path d="M20.5 20.5l-4.4-1.1 1.1-4.4z" />
        <path d="M20.5 3.5l-1.1 4.4-4.4-1.1z" />
        <path d="M3.5 20.5l1.1-4.4 4.4 1.1z" />
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
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="3.5" fill={c} opacity="0.18" />
      <rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="3.5"
        fill="none"
        stroke={c}
        strokeWidth="1.8"
      />
      <circle cx="8.2" cy="9.5" r="1.9" fill={c} />
      <path d="M3.2 18.5l5.3-5.6 4 3.6 3.6-4.2 4.7 6.2z" fill={c} />
    </svg>
  )
}

export function AreaTabIcon({ active }: IconProps) {
  const c = active ? STROKE_ACTIVE : STROKE_INACTIVE
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6l5-3 8 3 5-3v15l-5 3-8-3-5 3z" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 3v15M16 6v15" fill="none" stroke={c} strokeWidth="1.5" />
    </svg>
  )
}

export function RadarTabIcon({ active }: IconProps) {
  const c = active ? STROKE_ACTIVE : STROKE_INACTIVE
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 19a7 7 0 1 1 7-7" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 15a3 3 0 1 1 3-3M12 12l7-5" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.8" fill={c} />
    </svg>
  )
}

export function SettingsTabIcon({ active }: IconProps) {
  const c = active ? STROKE_ACTIVE : STROKE_INACTIVE
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.7 3h4.6l.7 2.2 2 .8 2.1-1 2.3 4-1.7 1.5.3 2.2 1.8 1.4-2.3 4-2.2-.7-1.8 1.4-.4 2.2h-4.6l-.7-2.2-2-.8-2.1 1-2.3-4 1.7-1.5-.3-2.2-1.8-1.4 2.3-4 2.2.7 1.8-1.4z" fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" fill="none" stroke={c} strokeWidth="1.7" />
    </svg>
  )
}

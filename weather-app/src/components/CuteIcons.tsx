interface IconProps {
  size?: number
}

export function UmbrellaIcon({ size = 28 }: IconProps) {
  return (
    <svg className="cute-icon" width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="傘">
      <defs>
        <linearGradient id="umbrella-canopy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#93d6f5" />
          <stop offset="1" stopColor="#68aee5" />
        </linearGradient>
      </defs>
      <path d="M6 23C7.5 12 15 6 24 6s16.5 6 18 17c-5-4-8-4-12 0-4-4-8-4-12 0-4-4-7-4-12 0Z" fill="url(#umbrella-canopy)" />
      <path d="M24 7v28c0 6 8 7 9 1" fill="none" stroke="#5b7793" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 7c-5 5-6 10-6 16M24 7c5 5 6 10 6 16" fill="none" stroke="#d8f0fb" strokeWidth="1.4" />
      <circle cx="12" cy="33" r="2" fill="#bce5fa" />
      <circle cx="39" cy="31" r="1.6" fill="#bce5fa" />
    </svg>
  )
}

export function ClothesIcon({ size = 28 }: IconProps) {
  return <span className="illustration-emoji" style={{ fontSize: size }} aria-label="服装">🧥</span>
}

export function LaundryIcon({ size = 28 }: IconProps) {
  return <span className="illustration-emoji" style={{ fontSize: size }} aria-label="洗濯">🧺</span>
}

export function HeartIcon({ size = 28 }: IconProps) {
  return <span className="illustration-emoji" style={{ fontSize: size }} aria-label="ハート">💗</span>
}

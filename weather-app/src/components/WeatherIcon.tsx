import type { WeatherCategory } from '../types'

interface Props {
  category: WeatherCategory
  size?: number
}

export function WeatherIcon({ category, size = 40 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      {category === 'sunny' && (
        <g>
          <g stroke="#ffb347" strokeWidth="2.5" strokeLinecap="round">
            <line x1="20" y1="2" x2="20" y2="7" />
            <line x1="20" y1="33" x2="20" y2="38" />
            <line x1="2" y1="20" x2="7" y2="20" />
            <line x1="33" y1="20" x2="38" y2="20" />
            <line x1="7.5" y1="7.5" x2="11" y2="11" />
            <line x1="29" y1="29" x2="32.5" y2="32.5" />
            <line x1="32.5" y1="7.5" x2="29" y2="11" />
            <line x1="11" y1="29" x2="7.5" y2="32.5" />
          </g>
          <circle cx="20" cy="20" r="10" fill="#ffcb52" />
          <circle cx="17" cy="17" r="3" fill="#ffe08a" opacity="0.7" />
        </g>
      )}

      {category === 'cloudy' && (
        <g>
          <circle cx="14" cy="14" r="7" fill="#ffcb52" opacity="0.9" />
          <path
            d="M10 28c-3.3 0-6-2.7-6-6 0-3 2.2-5.5 5.1-5.9C10 12.5 13.2 10 17 10c4.4 0 8 3.4 8.3 7.7 2.9.5 5.1 3 5.1 6 0 3.3-2.7 6-6 6H10z"
            fill="#d7e2ec"
          />
          <path
            d="M10 28c-3.3 0-6-2.7-6-6 0-3 2.2-5.5 5.1-5.9C10 12.5 13.2 10 17 10c4.4 0 8 3.4 8.3 7.7 2.9.5 5.1 3 5.1 6 0 3.3-2.7 6-6 6H10z"
            fill="url(#cloud-shade)"
            opacity="0.35"
          />
          <defs>
            <linearGradient id="cloud-shade" x1="0" y1="10" x2="0" y2="28">
              <stop offset="0" stopColor="#fff" />
              <stop offset="1" stopColor="#aebfcf" />
            </linearGradient>
          </defs>
        </g>
      )}

      {category === 'rainy' && (
        <g>
          <path
            d="M11 24c-3.3 0-6-2.7-6-6 0-3 2.2-5.5 5.1-5.9C10.7 8.5 14 6 18 6c4.7 0 8.6 3.6 8.9 8.2 3 .4 5.3 3 5.3 6.1 0 3.3-2.7 6-6 6H11z"
            fill="#a9c2de"
          />
          <g stroke="#5b8fc9" strokeWidth="2.4" strokeLinecap="round">
            <line x1="13" y1="30" x2="11" y2="35" />
            <line x1="20" y1="30" x2="18" y2="35" />
            <line x1="27" y1="30" x2="25" y2="35" />
          </g>
        </g>
      )}

      {category === 'snowy' && (
        <g>
          <path
            d="M11 22c-3.3 0-6-2.7-6-6 0-3 2.2-5.5 5.1-5.9C10.7 6.5 14 4 18 4c4.7 0 8.6 3.6 8.9 8.2 3 .4 5.3 3 5.3 6.1 0 3.3-2.7 6-6 6H11z"
            fill="#dceaf7"
          />
          <g stroke="#8fb8dd" strokeWidth="2" strokeLinecap="round">
            <line x1="13" y1="28" x2="13" y2="36" />
            <line x1="10" y1="30" x2="16" y2="34" />
            <line x1="16" y1="30" x2="10" y2="34" />
            <line x1="26" y1="28" x2="26" y2="36" />
            <line x1="23" y1="30" x2="29" y2="34" />
            <line x1="29" y1="30" x2="23" y2="34" />
          </g>
        </g>
      )}
    </svg>
  )
}

import type { WeatherCategory } from '../types'

interface Props {
  category: WeatherCategory
  size?: number
}

export function WeatherIcon({ category, size = 40 }: Props) {
  const rainy = category === 'rainy'
  const snowy = category === 'snowy'
  const cloudy = category === 'cloudy'

  return (
    <svg
      className="weather-icon"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={rainy ? '雨' : snowy ? '雪' : cloudy ? 'くもり' : '晴れ'}
    >
      <defs>
        <linearGradient id={`cloud-${category}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={rainy ? '#a9bed8' : snowy ? '#eef5fc' : '#fffdf8'} />
          <stop offset="1" stopColor={rainy ? '#7693b6' : snowy ? '#cbddec' : '#e9e4ea'} />
        </linearGradient>
        <linearGradient id={`sun-${category}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe697" />
          <stop offset="1" stopColor="#ffb96e" />
        </linearGradient>
      </defs>

      {category === 'sunny' && (
        <>
          <g stroke="#f5b25f" strokeWidth="2.5" strokeLinecap="round">
            <path d="M20 5v6M20 37v6M3 24h6M31 24h6M8 12l4 4M28 32l4 4M32 12l-4 4M12 32l-4 4" />
          </g>
          <circle cx="20" cy="24" r="11" fill={`url(#sun-${category})`} />
        </>
      )}

      {!rainy && !snowy && (
        <path
          d="M18 49h27c8 0 13-4.7 13-11 0-6-4.4-10.4-10.8-10.9C45.5 19.9 39.8 15 32.5 15c-8.3 0-14.5 6.1-15.1 14.1C10.8 29.5 6 33.6 6 39.4 6 45.1 10.7 49 18 49Z"
          fill={`url(#cloud-${category})`}
          stroke="rgba(118,109,126,.12)"
        />
      )}

      {(rainy || snowy) && (
        <path
          d="M14 39h34c7 0 11-4.3 11-10 0-5.4-4-9.5-9.8-9.9C47.5 12.5 42.3 8 35.6 8c-7.5 0-13.2 5.5-13.8 12.8C15.8 21.2 11 25 11 30.2 11 35.4 15.1 39 21 39Z"
          fill={`url(#cloud-${category})`}
          stroke="rgba(77,92,116,.15)"
        />
      )}

      <g fill="#5c5360">
        <circle cx={rainy || snowy ? 30 : 30} cy={rainy || snowy ? 27 : 37} r="1.7" />
        <circle cx={rainy || snowy ? 41 : 41} cy={rainy || snowy ? 27 : 37} r="1.7" />
      </g>
      <path
        d={rainy || snowy ? 'M33 31q3 3 6 0' : 'M33 41q3 3 6 0'}
        fill="none"
        stroke="#5c5360"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx={rainy || snowy ? 26 : 26} cy={rainy || snowy ? 31 : 41} r="2.1" fill="#f4a7b5" opacity=".65" />
      <circle cx={rainy || snowy ? 45 : 45} cy={rainy || snowy ? 31 : 41} r="2.1" fill="#f4a7b5" opacity=".65" />

      {rainy && (
        <g fill="#76bce8">
          <path d="M19 45c0-2 3-5 3-5s3 3 3 5a3 3 0 1 1-6 0Z" />
          <path d="M33 51c0-2 3-5 3-5s3 3 3 5a3 3 0 1 1-6 0Z" />
          <path d="M47 45c0-2 3-5 3-5s3 3 3 5a3 3 0 1 1-6 0Z" />
        </g>
      )}

      {snowy && (
        <g fill="#8bc4e8" fontSize="14" fontWeight="700">
          <text x="17" y="53">✦</text>
          <text x="36" y="58">✦</text>
          <text x="49" y="48">·</text>
        </g>
      )}
    </svg>
  )
}

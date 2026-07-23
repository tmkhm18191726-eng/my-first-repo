import type { WeatherCategory } from '../types'

interface Props {
  category: WeatherCategory
  size?: number
}

const CATEGORY_EMOJI: Record<WeatherCategory, string> = {
  sunny: '☀️',
  cloudy: '⛅',
  rainy: '☔️',
  snowy: '🌨️',
}

export function WeatherIcon({ category, size = 40 }: Props) {
  return (
    <span style={{ fontSize: size, lineHeight: 1 }} aria-hidden="true">
      {CATEGORY_EMOJI[category]}
    </span>
  )
}

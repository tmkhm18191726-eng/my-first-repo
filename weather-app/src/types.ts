export type WeatherCategory = 'sunny' | 'cloudy' | 'rainy' | 'snowy'

export interface CurrentWeather {
  temperature: number
  weatherCode: number
  category: WeatherCategory
  isDay: boolean
}

export interface LocationInfo {
  latitude: number
  longitude: number
  label: string
}

export const CATEGORY_LABELS: Record<WeatherCategory, string> = {
  sunny: '晴れ',
  cloudy: '曇り',
  rainy: '雨',
  snowy: '雪',
}

export const CATEGORY_ORDER: WeatherCategory[] = ['sunny', 'cloudy', 'rainy', 'snowy']

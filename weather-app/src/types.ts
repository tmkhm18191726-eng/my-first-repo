export type WeatherCategory = 'sunny' | 'cloudy' | 'rainy' | 'snowy'

export interface CurrentWeather {
  temperature: number
  weatherCode: number
  category: WeatherCategory
  isDay: boolean
  precipitationProbability: number
}

export interface HourlyPoint {
  time: string
  hourLabel: string
  temperature: number
  category: WeatherCategory
  precipitationProbability: number
}

export interface DailyPoint {
  date: string
  weekdayLabel: string
  maxTemp: number
  minTemp: number
  category: WeatherCategory
  precipitationProbability: number
}

export interface Forecast {
  current: CurrentWeather
  hourly: HourlyPoint[]
  daily: DailyPoint[]
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

export const CATEGORY_GRADIENT: Record<WeatherCategory, string> = {
  sunny: 'linear-gradient(160deg, #ffd97a 0%, #ff9a6c 100%)',
  cloudy: 'linear-gradient(160deg, #cfd9e6 0%, #8fa3bf 100%)',
  rainy: 'linear-gradient(160deg, #6b8cae 0%, #3c5878 100%)',
  snowy: 'linear-gradient(160deg, #e8f1fb 0%, #a9c2de 100%)',
}

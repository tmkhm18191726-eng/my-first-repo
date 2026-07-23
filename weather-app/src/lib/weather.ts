import type { DailyPoint, Forecast, HourlyPoint, WeatherCategory } from '../types'

// WMO weather interpretation codes -> https://open-meteo.com/en/docs
function codeToCategory(code: number): WeatherCategory {
  if (code === 0 || code === 1) return 'sunny'
  if (code === 2 || code === 3 || code === 45 || code === 48) return 'cloudy'
  if (code >= 71 && code <= 77) return 'snowy'
  if (code === 85 || code === 86) return 'snowy'
  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    (code >= 95 && code <= 99)
  ) {
    return 'rainy'
  }
  return 'cloudy'
}

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: '快晴',
  1: 'ほぼ晴れ',
  2: '部分的に曇り',
  3: '曇り',
  45: '霧',
  48: '霧氷',
  51: '小雨（霧雨）',
  53: '霧雨',
  55: '強い霧雨',
  56: '着氷性の霧雨',
  57: '強い着氷性の霧雨',
  61: '弱い雨',
  63: '雨',
  65: '強い雨',
  66: '着氷性の雨',
  67: '強い着氷性の雨',
  71: '弱い雪',
  73: '雪',
  75: '強い雪',
  77: '雪あられ',
  80: 'にわか雨',
  81: '強いにわか雨',
  82: '激しいにわか雨',
  85: '弱い雪あられ',
  86: '強い雪あられ',
  95: '雷雨',
  96: '雹を伴う雷雨',
  99: '激しい雹を伴う雷雨',
}

export function describeWeatherCode(code: number): string {
  return WEATHER_DESCRIPTIONS[code] ?? '不明'
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('この端末では位置情報が利用できません'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 5 * 60 * 1000,
    })
  })
}

const HOUR_FORMATTER = new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', hour12: false })
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('ja-JP', { weekday: 'short' })

export async function fetchForecast(latitude: number, longitude: number): Promise<Forecast> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', latitude.toString())
  url.searchParams.set('longitude', longitude.toString())
  url.searchParams.set('current_weather', 'true')
  url.searchParams.set('hourly', 'temperature_2m,weathercode,precipitation_probability')
  url.searchParams.set(
    'daily',
    'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
  )
  url.searchParams.set('forecast_days', '7')
  url.searchParams.set('timezone', 'auto')

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error('天気情報の取得に失敗しました')
  }
  const data = await res.json()
  const current = data.current_weather
  if (!current) {
    throw new Error('天気情報の形式が不正です')
  }

  const hourlyTimes: string[] = data.hourly?.time ?? []
  const hourlyTemps: number[] = data.hourly?.temperature_2m ?? []
  const hourlyCodes: number[] = data.hourly?.weathercode ?? []
  const hourlyPrecip: number[] = data.hourly?.precipitation_probability ?? []

  let currentHourIndex = hourlyTimes.findIndex((t) => t === current.time)
  if (currentHourIndex === -1) {
    currentHourIndex = hourlyTimes.findIndex((t) => new Date(t) >= new Date(current.time))
  }
  if (currentHourIndex === -1) currentHourIndex = 0

  const hourly: HourlyPoint[] = []
  for (let i = 0; i < 7; i++) {
    const idx = currentHourIndex + i * 4
    if (idx >= hourlyTimes.length) break
    const time = hourlyTimes[idx]
    hourly.push({
      time,
      hourLabel: `${HOUR_FORMATTER.format(new Date(time))}時`,
      temperature: Math.round(hourlyTemps[idx]),
      category: codeToCategory(hourlyCodes[idx]),
      precipitationProbability: hourlyPrecip[idx] ?? 0,
    })
  }

  const dailyDates: string[] = data.daily?.time ?? []
  const dailyCodes: number[] = data.daily?.weathercode ?? []
  const dailyMax: number[] = data.daily?.temperature_2m_max ?? []
  const dailyMin: number[] = data.daily?.temperature_2m_min ?? []
  const dailyPrecip: number[] = data.daily?.precipitation_probability_max ?? []

  const daily: DailyPoint[] = dailyDates.map((date, idx) => ({
    date,
    weekdayLabel: idx === 0 ? '今日' : WEEKDAY_FORMATTER.format(new Date(date)),
    maxTemp: Math.round(dailyMax[idx]),
    minTemp: Math.round(dailyMin[idx]),
    category: codeToCategory(dailyCodes[idx]),
    precipitationProbability: dailyPrecip[idx] ?? 0,
  }))

  return {
    current: {
      temperature: Math.round(current.temperature),
      weatherCode: current.weathercode,
      category: codeToCategory(current.weathercode),
      isDay: current.is_day === 1,
      precipitationProbability: hourlyPrecip[currentHourIndex] ?? 0,
    },
    hourly,
    daily,
  }
}

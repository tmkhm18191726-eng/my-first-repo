import { CATEGORY_LABELS, type CurrentWeather, type WeatherCategory } from '../types'
import { describeWeatherCode } from '../lib/weather'

const CATEGORY_EMOJI: Record<WeatherCategory, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '☔️',
  snowy: '❄️',
}

const CATEGORY_GRADIENT: Record<WeatherCategory, string> = {
  sunny: 'linear-gradient(160deg, #ffd97a 0%, #ff9a6c 100%)',
  cloudy: 'linear-gradient(160deg, #cfd9e6 0%, #8fa3bf 100%)',
  rainy: 'linear-gradient(160deg, #6b8cae 0%, #3c5878 100%)',
  snowy: 'linear-gradient(160deg, #e8f1fb 0%, #a9c2de 100%)',
}

interface Props {
  weather: CurrentWeather | null
  loading: boolean
  error: string | null
  photoUrl: string | undefined
  onRetry: () => void
  onOpenSettings: () => void
}

export function WeatherView({ weather, loading, error, photoUrl, onRetry, onOpenSettings }: Props) {
  const category = weather?.category ?? 'sunny'
  const background = photoUrl
    ? `url(${photoUrl})`
    : CATEGORY_GRADIENT[category]

  const today = new Intl.DateTimeFormat('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date())

  return (
    <div
      className="weather-view"
      style={{
        backgroundImage: photoUrl
          ? `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%), ${background}`
          : background,
      }}
    >
      <button className="settings-btn" onClick={onOpenSettings} aria-label="写真を設定">
        ⚙️
      </button>

      <div className="weather-content">
        <p className="date">{today}</p>

        {loading && <p className="status">現在地の天気を取得中...</p>}

        {error && (
          <div className="status error">
            <p>{error}</p>
            <button onClick={onRetry}>もう一度試す</button>
          </div>
        )}

        {weather && !loading && !error && (
          <>
            <p className="emoji">{CATEGORY_EMOJI[weather.category]}</p>
            <p className="temperature">{weather.temperature}°</p>
            <p className="description">{describeWeatherCode(weather.weatherCode)}</p>
            {!photoUrl && (
              <p className="hint">
                ⚙️ から「{CATEGORY_LABELS[weather.category]}」の写真を登録できます
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

import { CATEGORY_GRADIENT, type Forecast } from '../types'
import { describeWeatherCode } from '../lib/weather'
import { getSpeechLines } from '../lib/messages'
import { SpeechBubble } from './SpeechBubble'
import { WeatherIcon } from './WeatherIcon'

interface Props {
  forecast: Forecast | null
  loading: boolean
  error: string | null
  photoUrl: string | undefined
  name: string
  onRetry: () => void
}

export function WeatherView({ forecast, loading, error, photoUrl, name, onRetry }: Props) {
  const weather = forecast?.current ?? null
  const today = forecast?.daily[0]
  const category = weather?.category ?? 'sunny'
  const background = photoUrl ? `url(${photoUrl})` : CATEGORY_GRADIENT[category]

  const dateLabel = new Intl.DateTimeFormat('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date())

  return (
    <div
      className="weather-view"
      style={{
        backgroundImage: photoUrl
          ? `linear-gradient(180deg, rgba(20,10,20,0.45) 0%, rgba(20,10,20,0) 32%, rgba(20,10,20,0) 60%, rgba(20,10,20,0.6) 100%), ${background}`
          : background,
      }}
    >
      {loading && (
        <div className="weather-header">
          <p className="status">現在地の天気を取得中...</p>
        </div>
      )}

      {error && (
        <div className="weather-header">
          <div className="status error">
            <p>{error}</p>
            <button onClick={onRetry}>もう一度試す</button>
          </div>
        </div>
      )}

      {weather && today && !loading && !error && (
        <div className="weather-header">
          <p className="date">{dateLabel}</p>
          <div className="weather-headline">
            <span className="weather-icon-badge">
              <WeatherIcon category={weather.category} size={40} />
            </span>
            <span className="temperature">{weather.temperature}°</span>
          </div>
          <p className="description">{describeWeatherCode(weather.weatherCode)}</p>
          <div className="temp-pills">
            <span className="pill pill-max">↑ {today.maxTemp}°</span>
            <span className="pill pill-min">↓ {today.minTemp}°</span>
          </div>
        </div>
      )}

      {forecast && !loading && !error && (
        <div className="weather-footer">
          {photoUrl ? (
            <SpeechBubble lines={getSpeechLines(forecast, name)} />
          ) : (
            <p className="hint">「写真」タブから思い出の写真を登録すると、ここに表示されるよ</p>
          )}
        </div>
      )}
    </div>
  )
}

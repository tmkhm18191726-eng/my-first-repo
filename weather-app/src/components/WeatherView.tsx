import { CATEGORY_EMOJI, CATEGORY_GRADIENT, CATEGORY_LABELS, type Forecast } from '../types'
import { describeWeatherCode } from '../lib/weather'
import { getSpeechMessage } from '../lib/messages'
import { SpeechBubble } from './SpeechBubble'
import { TodayPoints } from './TodayPoints'
import { ForecastTabs } from './ForecastTabs'

interface Props {
  forecast: Forecast | null
  loading: boolean
  error: string | null
  photoUrl: string | undefined
  onRetry: () => void
  onOpenSettings: () => void
}

export function WeatherView({ forecast, loading, error, photoUrl, onRetry, onOpenSettings }: Props) {
  const weather = forecast?.current ?? null
  const category = weather?.category ?? 'sunny'
  const background = photoUrl ? `url(${photoUrl})` : CATEGORY_GRADIENT[category]

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

        {forecast && weather && !loading && !error && (
          <>
            {photoUrl && <SpeechBubble message={getSpeechMessage(forecast)} />}
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

      {forecast && !loading && !error && (
        <div className="forecast-panel">
          {forecast.daily[0] && <TodayPoints today={forecast.daily[0]} />}
          <ForecastTabs hourly={forecast.hourly} daily={forecast.daily} />
        </div>
      )}
    </div>
  )
}

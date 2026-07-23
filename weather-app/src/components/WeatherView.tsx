import { CATEGORY_GRADIENT, type Forecast } from '../types'
import { describeWeatherCode } from '../lib/weather'
import { getSpeechLines } from '../lib/messages'
import { SpeechBubble } from './SpeechBubble'
import { WeatherIcon } from './WeatherIcon'
import { TodayTomorrowCard } from './TodayTomorrowCard'
import { HourlyStrip } from './HourlyStrip'

interface Props {
  forecast: Forecast | null
  loading: boolean
  error: string | null
  photoUrl: string | undefined
  name: string
  onRetry: () => void
  onOpenForecast: () => void
}

export function WeatherView({
  forecast,
  loading,
  error,
  photoUrl,
  name,
  onRetry,
  onOpenForecast,
}: Props) {
  const weather = forecast?.current ?? null
  const today = forecast?.daily[0]
  const tomorrow = forecast?.daily[1]
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
        backgroundImage: `linear-gradient(180deg, rgba(255,251,245,0.78) 0%, rgba(255,251,245,0.4) 20%, rgba(255,251,245,0) 40%, rgba(20,10,20,0) 65%, rgba(20,10,20,0.4) 100%), ${background}`,
      }}
    >
      {loading && (
        <div className="weather-top-row">
          <p className="status">現在地の天気を取得中...</p>
        </div>
      )}

      {error && (
        <div className="weather-top-row">
          <div className="status error">
            <p>{error}</p>
            <button onClick={onRetry}>もう一度試す</button>
          </div>
        </div>
      )}

      {weather && today && !loading && !error && (
        <div className="weather-top-row">
          <div className="weather-top-left">
            <p className="date">{dateLabel}</p>
            <div className="weather-headline">
              <span className="temperature">{weather.temperature}°</span>
              <WeatherIcon category={weather.category} size={44} />
            </div>
            <p className="description">{describeWeatherCode(weather.weatherCode)}</p>
            <div className="temp-pills">
              <span className="pill pill-max">最高 {today.maxTemp}°</span>
              <span className="pill pill-min">最低 {today.minTemp}°</span>
            </div>
          </div>
          {tomorrow && <TodayTomorrowCard today={today} tomorrow={tomorrow} />}
        </div>
      )}

      <div className="weather-spacer" />

      {forecast && !loading && !error && (
        <div className="weather-bottom">
          {photoUrl ? (
            <SpeechBubble lines={getSpeechLines(forecast, name)} />
          ) : (
            <p className="hint">「写真」タブから思い出の写真を登録すると、ここに表示されるよ</p>
          )}
          <button className="detail-hint" onClick={onOpenForecast}>
            <span>⌃</span> タップで詳しい天気
          </button>
          <HourlyStrip hourly={forecast.hourly} />
        </div>
      )}
    </div>
  )
}

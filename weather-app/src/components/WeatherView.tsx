import { useRef, type PointerEvent } from 'react'
import type { Forecast } from '../types'
import { describeWeatherCode } from '../lib/weather'
import { getSpeechLines } from '../lib/messages'
import { SpeechBubble } from './SpeechBubble'
import { WeatherIcon } from './WeatherIcon'
import { TodayTomorrowCard } from './TodayTomorrowCard'
import { HourlyStrip } from './HourlyStrip'
import { UmbrellaIcon } from './CuteIcons'

interface Props {
  forecast: Forecast | null
  loading: boolean
  error: string | null
  photoUrl: string | undefined
  name: string
  locationLabel: string
  showHourly: boolean
  onRetry: () => void
  onOpenForecast: () => void
}

export function WeatherView({
  forecast,
  loading,
  error,
  photoUrl,
  name,
  locationLabel,
  showHourly,
  onRetry,
  onOpenForecast,
}: Props) {
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const weather = forecast?.current ?? null
  const today = forecast?.daily[0]
  const tomorrow = forecast?.daily[1]
  const defaultPhotoUrl = `${import.meta.env.BASE_URL}default-memory-child.png`
  const activePhotoUrl = photoUrl ?? defaultPhotoUrl
  const background = `url(${activePhotoUrl})`

  const dateLabel = new Intl.DateTimeFormat('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date())

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    touchStart.current = { x: event.clientX, y: event.clientY }
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!touchStart.current) return

    const distanceX = event.clientX - touchStart.current.x
    const distanceY = event.clientY - touchStart.current.y
    touchStart.current = null

    if (distanceY < -64 && Math.abs(distanceY) > Math.abs(distanceX) * 1.25) {
      onOpenForecast()
    }
  }

  return (
    <div
      className="weather-view has-photo"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(255,250,246,0.9) 0%, rgba(255,250,246,0.42) 24%, rgba(34,25,20,0.02) 52%, rgba(34,25,20,0.5) 100%), ${background}`,
      }}
    >
      <header className="brand-row">
        <div>
          <p className="brand-kicker">MEMORY WEATHER</p>
          <p className="brand-name">おもいで天気</p>
        </div>
        <span className="brand-heart" aria-hidden="true">♥</span>
      </header>

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
            <p className="location-label">
              <span aria-hidden="true">●</span> {locationLabel}
            </p>
            <p className="date">{dateLabel}</p>
            <div className="weather-headline">
              <span className="temperature">{weather.temperature}°</span>
              <WeatherIcon category={weather.category} size={44} />
            </div>
            <div className="today-condition-row">
              <p className="description">{describeWeatherCode(weather.weatherCode)}</p>
              <div className="temp-pills">
                <span className="pill pill-max">最高気温 {today.maxTemp}°</span>
                <span className="pill pill-min">最低気温 {today.minTemp}°</span>
                <span className="pill pill-rain">
                  <UmbrellaIcon size={15} /> 降水確率 {today.precipitationProbability}%
                </span>
              </div>
            </div>
          </div>
          <div className="weather-side">
            <div className="weather-actions" aria-label="クイック操作">
              <span aria-hidden="true">♢</span>
              <span className="heart" aria-hidden="true">♥</span>
            </div>
            {tomorrow && <TodayTomorrowCard tomorrow={tomorrow} />}
          </div>
        </div>
      )}

      <div className="weather-spacer" />

      {forecast && !loading && !error && (
        <div className="weather-bottom">
          <SpeechBubble lines={getSpeechLines(forecast, name)} photoUrl={activePhotoUrl} />
          <button className="detail-hint" onClick={onOpenForecast}>
            <span aria-hidden="true">⌃</span> 上にスライドで詳しい天気
          </button>
          {showHourly && <HourlyStrip hourly={forecast.hourly} />}
        </div>
      )}
    </div>
  )
}

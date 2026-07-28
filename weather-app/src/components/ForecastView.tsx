import { useRef, type PointerEvent, type TouchEvent } from 'react'
import type { Forecast } from '../types'
import { TodayPoints } from './TodayPoints'
import { ForecastTabs } from './ForecastTabs'
import { AdviceTip } from './AdviceTip'
import { WeatherIcon } from './WeatherIcon'
import { UmbrellaIcon } from './CuteIcons'

interface Props {
  forecast: Forecast
  locationLabel: string
  photoUrl?: string
  onBack: () => void
}

export function ForecastView({ forecast, locationLabel, photoUrl, onBack }: Props) {
  const gestureStart = useRef<{ x: number; y: number } | null>(null)
  const today = forecast.daily[0]
  const tomorrow = forecast.daily[1]
  const heroPhotoUrl = photoUrl ?? `${import.meta.env.BASE_URL}default-memory-placeholder.png`

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    gestureStart.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    finishGesture(event.clientX, event.clientY)
  }

  const finishGesture = (x: number, y: number) => {
    if (!gestureStart.current) return

    const distanceX = x - gestureStart.current.x
    const distanceY = y - gestureStart.current.y
    gestureStart.current = null

    if (distanceY > 64 && Math.abs(distanceY) > Math.abs(distanceX) * 1.25) {
      onBack()
    }
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    if (touch) gestureStart.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0]
    if (touch) finishGesture(touch.clientX, touch.clientY)
  }

  const cancelGesture = () => {
    gestureStart.current = null
  }

  return (
    <div
      className="forecast-view"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={cancelGesture}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={cancelGesture}
    >
      <button type="button" className="forecast-back-hint" onClick={onBack}>
        <span aria-hidden="true">⌄</span> 下にスライドでトップへ
      </button>
      <h1><span aria-hidden="true">●</span> {locationLabel}のいまの天気</h1>
      {today && (
        <div
          className="forecast-hero"
          style={{
            backgroundImage: `linear-gradient(100deg, rgba(255,250,246,.9) 0%, rgba(255,250,246,.67) 55%, rgba(244,237,232,.48) 100%), url(${heroPhotoUrl})`,
          }}
        >
          <div className="forecast-hero-now">
            <div>
              <span className="forecast-hero-temp">{forecast.current.temperature}°</span>
              <p>{forecast.current.category === 'rainy' ? '雨' : forecast.current.category === 'cloudy' ? 'くもり' : forecast.current.category === 'snowy' ? '雪' : '晴れ'}</p>
            </div>
            <WeatherIcon category={forecast.current.category} size={76} />
          </div>
          <div className="forecast-hero-pills">
            <span className="pill pill-max">最高 {today.maxTemp}°</span>
            <span className="pill pill-min">最低 {today.minTemp}°</span>
            <span className="pill forecast-rain"><UmbrellaIcon size={15} />{today.precipitationProbability}%</span>
          </div>
          {tomorrow && (
            <div className="tomorrow-mini">
              <div>
                <strong>明日</strong>
                <span>{tomorrow.maxTemp}° / {tomorrow.minTemp}°</span>
              </div>
              <WeatherIcon category={tomorrow.category} size={46} />
            </div>
          )}
        </div>
      )}
      <h2 className="section-title">今日のポイント</h2>
      <AdviceTip forecast={forecast} />
      {forecast.daily[0] && (
        <div className="forecast-section">
          <TodayPoints today={forecast.daily[0]} />
        </div>
      )}
      <h2 className="section-title">このあとの天気</h2>
      <ForecastTabs hourly={forecast.hourly} daily={forecast.daily} />
    </div>
  )
}

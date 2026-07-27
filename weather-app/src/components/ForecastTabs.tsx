import type { DailyPoint, HourlyPoint } from '../types'
import { WeatherIcon } from './WeatherIcon'

interface Props {
  hourly: HourlyPoint[]
  daily: DailyPoint[]
}

export function ForecastTabs({ hourly, daily }: Props) {
  return (
    <div className="forecast-lists">
      <div className="forecast-section-card">
        <div className="hourly-list">
          {hourly.map((point) => (
            <div className="hourly-card" key={point.time}>
              <span className="hourly-label">{point.hourLabel}</span>
              <WeatherIcon category={point.category} size={26} />
              <span className="hourly-temp">{point.temperature}°</span>
              <span className="hourly-precip">{point.precipitationProbability}%</span>
            </div>
          ))}
        </div>
      </div>
      <button className="radar-link" type="button">
        <span aria-hidden="true">☂</span> 雨雲レーダーを見る <strong aria-hidden="true">›</strong>
      </button>
      <h2 className="section-title">週間天気</h2>
      <div className="forecast-section-card">
        <div className="daily-list">
          {daily.map((point) => (
            <div className="daily-row" key={point.date}>
              <span className="daily-weekday">{point.weekdayLabel}</span>
              <WeatherIcon category={point.category} size={22} />
              <span className="daily-max">{point.maxTemp}°</span>
              <span className="daily-min">{point.minTemp}°</span>
              <span className="daily-precip">{point.precipitationProbability}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

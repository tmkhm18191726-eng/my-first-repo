import { useState } from 'react'
import type { DailyPoint, HourlyPoint } from '../types'
import { WeatherIcon } from './WeatherIcon'

interface Props {
  hourly: HourlyPoint[]
  daily: DailyPoint[]
}

export function ForecastTabs({ hourly, daily }: Props) {
  const [tab, setTab] = useState<'hourly' | 'daily'>('hourly')

  return (
    <div className="forecast-tabs">
      <div className="tab-switch">
        <button
          className={tab === 'hourly' ? 'active' : ''}
          onClick={() => setTab('hourly')}
        >
          時間天気
        </button>
        <button
          className={tab === 'daily' ? 'active' : ''}
          onClick={() => setTab('daily')}
        >
          週間天気
        </button>
      </div>

      {tab === 'hourly' && (
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
      )}

      {tab === 'daily' && (
        <div className="daily-list">
          {daily.map((point) => (
            <div className="daily-row" key={point.date}>
              <span className="daily-weekday">{point.weekdayLabel}</span>
              <WeatherIcon category={point.category} size={22} />
              <span className="daily-precip">{point.precipitationProbability}%</span>
              <span className="daily-max">{point.maxTemp}°</span>
              <span className="daily-min">{point.minTemp}°</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

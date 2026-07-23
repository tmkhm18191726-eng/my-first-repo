import type { Forecast } from '../types'
import { TodayPoints } from './TodayPoints'
import { ForecastTabs } from './ForecastTabs'
import { AdviceTip } from './AdviceTip'

interface Props {
  forecast: Forecast
}

export function ForecastView({ forecast }: Props) {
  return (
    <div className="forecast-view">
      <h1>週間予報</h1>
      <AdviceTip forecast={forecast} />
      {forecast.daily[0] && (
        <div className="forecast-section">
          <h2>今日のポイント</h2>
          <TodayPoints today={forecast.daily[0]} />
        </div>
      )}
      <ForecastTabs hourly={forecast.hourly} daily={forecast.daily} />
    </div>
  )
}

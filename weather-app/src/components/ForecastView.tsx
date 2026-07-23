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
      {forecast.daily[0] && <TodayPoints today={forecast.daily[0]} />}
      <ForecastTabs hourly={forecast.hourly} daily={forecast.daily} />
      <AdviceTip forecast={forecast} />
    </div>
  )
}

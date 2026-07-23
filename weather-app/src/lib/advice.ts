import type { Forecast } from '../types'

export function getAdviceLines(forecast: Forecast): string[] {
  const { hourly, daily } = forecast
  const today = daily[0]

  if (hourly.length >= 2) {
    const first = hourly[0].precipitationProbability
    const rest = hourly.slice(1)
    const laterMax = Math.max(...rest.map((h) => h.precipitationProbability))
    if (laterMax - first >= 30) {
      return ['この後、雨が降りやすくなります。', 'お出かけには傘をお忘れなく。']
    }
  }

  if (today.precipitationProbability >= 50) {
    return ['今日は雨の一日になりそうです。', '足元に気をつけてお過ごしください。']
  }

  if (today.maxTemp >= 30) {
    return ['気温が上がるので、こまめな水分補給を。', '無理せず過ごしてくださいね。']
  }

  if (today.maxTemp <= 10) {
    return ['冷え込む一日になりそうです。', '暖かくしてお過ごしください。']
  }

  return ['今日は一日を通して過ごしやすい天気です。', 'よい一日をお過ごしください。']
}

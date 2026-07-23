import type { Forecast } from '../types'

export interface Advice {
  icon: string
  lines: string[]
}

export function getAdvice(forecast: Forecast): Advice {
  const { hourly, daily } = forecast
  const today = daily[0]

  if (hourly.length >= 2) {
    const first = hourly[0].precipitationProbability
    const rest = hourly.slice(1)
    const laterMax = Math.max(...rest.map((h) => h.precipitationProbability))
    if (laterMax - first >= 30) {
      return {
        icon: '☔',
        lines: ['この後、雨が降りやすくなります。', 'お出かけには傘をお忘れなく。'],
      }
    }
  }

  if (today.precipitationProbability >= 50) {
    return {
      icon: '☔',
      lines: ['今日は雨の一日になりそうです。', '足元に気をつけてお過ごしください。'],
    }
  }

  if (today.maxTemp >= 30) {
    return {
      icon: '🌡️',
      lines: ['気温が上がるので、こまめな水分補給を。', '無理せず過ごしてくださいね。'],
    }
  }

  if (today.maxTemp <= 10) {
    return {
      icon: '🧣',
      lines: ['冷え込む一日になりそうです。', '暖かくしてお過ごしください。'],
    }
  }

  return {
    icon: '💗',
    lines: ['今日は一日を通して過ごしやすい天気です。', 'よい一日をお過ごしください。'],
  }
}

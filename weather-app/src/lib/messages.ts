import type { Forecast, WeatherCategory } from '../types'

const MESSAGES: Record<WeatherCategory, string[][]> = {
  sunny: [
    ['こんにちは、外は少し汗ばむかもね🌤️', 'いいペースでいこうね♪'],
    ['今日はいいお天気だよ', 'お散歩日和だね🐾'],
    ['日差しが強いから', '水分補給を忘れずにね💧'],
  ],
  cloudy: [
    ['今日は雲が多いけど', '過ごしやすい一日になりそう☁️'],
    ['のんびりするのに', 'ちょうどいい天気だよ'],
    ['急に晴れ間が出るかも', '油断しないでね'],
  ],
  rainy: [
    ['今日は傘があると安心だよ☔️', '足元に気をつけてね'],
    ['雨の日はおうちで', 'まったり過ごすのもいいかも'],
    ['ゆっくりいこうね', '無理はしないでね'],
  ],
  snowy: [
    ['雪が降るから', '暖かい格好で出かけてね❄️'],
    ['足元が滑りやすいから', '気をつけてね'],
    ['今日は寒いから', 'あったかくして過ごそうね'],
  ],
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function getSpeechLines(forecast: Forecast, name: string): string[] {
  const pool = MESSAGES[forecast.current.category]
  const lines = pool[dayOfYear(new Date()) % pool.length]
  if (!name) return lines
  return [`${name}、${lines[0]}`, ...lines.slice(1)]
}

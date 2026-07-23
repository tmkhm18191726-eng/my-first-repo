import type { Forecast, WeatherCategory } from '../types'

const MESSAGES: Record<WeatherCategory, string[]> = {
  sunny: [
    'こんにちは、外は少し汗ばむかもね',
    '今日はいいお天気だよ、お散歩日和！',
    '日差しが強いから水分補給を忘れずにね',
  ],
  cloudy: [
    '今日は雲が多いけど、過ごしやすい一日になりそう',
    'のんびりするのにちょうどいい天気だよ',
    '急に晴れ間が出るかもしれないから、油断しないでね',
  ],
  rainy: [
    '今日は傘があると安心だよ',
    '足元に気をつけて、ゆっくりいこうね',
    '雨の日はおうちでまったり過ごすのもいいかも',
  ],
  snowy: [
    '雪が降るから、暖かい格好で出かけてね',
    '足元が滑りやすいから気をつけてね',
    '今日は寒いから、あったかくして過ごそうね',
  ],
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function getSpeechMessage(forecast: Forecast): string {
  const pool = MESSAGES[forecast.current.category]
  const index = dayOfYear(new Date()) % pool.length
  return pool[index]
}

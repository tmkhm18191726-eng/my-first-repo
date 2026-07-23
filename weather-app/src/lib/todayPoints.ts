import type { DailyPoint } from '../types'

export interface TodayPoint {
  icon: string
  label: string
  text: string
  reason: string
}

export function computeTodayPoints(today: DailyPoint): TodayPoint[] {
  const umbrella: TodayPoint =
    today.precipitationProbability >= 50
      ? { icon: '☔️', label: '傘', text: '傘を持って出かけよう', reason: '雨が心配' }
      : today.precipitationProbability >= 20
        ? {
            icon: '🌂',
            label: '傘',
            text: '念のため折りたたみ傘があると安心',
            reason: '天気は変わりやすめ',
          }
        : { icon: '☀️', label: '傘', text: '傘なしでOK', reason: '雨の心配は少なめ' }

  const clothing: TodayPoint =
    today.maxTemp >= 28
      ? { icon: '👕', label: '服装', text: '半袖で過ごしやすい一日', reason: '快適な気温' }
      : today.maxTemp >= 20
        ? { icon: '🧥', label: '服装', text: '薄手の羽織りがあると安心', reason: '朝晩は涼しめ' }
        : today.maxTemp >= 10
          ? { icon: '🧶', label: '服装', text: '上着を持っていこう', reason: '肌寒い一日' }
          : { icon: '🧣', label: '服装', text: 'しっかり防寒がおすすめ', reason: '冷え込み注意' }

  const laundry: TodayPoint =
    today.precipitationProbability < 20
      ? { icon: '🧺', label: '洗濯', text: '洗濯日和！よく乾きそう', reason: '乾燥しやすい' }
      : today.precipitationProbability < 50
        ? {
            icon: '🧺',
            label: '洗濯',
            text: '乾きにくいかも、部屋干しも検討して',
            reason: '湿度やや高め',
          }
        : { icon: '🧺', label: '洗濯', text: '部屋干しがおすすめ', reason: '雨で乾きにくい' }

  return [umbrella, clothing, laundry]
}

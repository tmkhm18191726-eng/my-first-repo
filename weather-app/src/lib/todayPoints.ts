import type { DailyPoint } from '../types'

export interface TodayPoint {
  icon: string
  label: string
  text: string
}

export function computeTodayPoints(today: DailyPoint): TodayPoint[] {
  const umbrella: TodayPoint =
    today.precipitationProbability >= 50
      ? { icon: '☔️', label: '傘', text: '傘を持って出かけよう' }
      : today.precipitationProbability >= 20
        ? { icon: '🌂', label: '傘', text: '念のため折りたたみ傘があると安心' }
        : { icon: '☀️', label: '傘', text: '傘なしでOK' }

  const clothing: TodayPoint =
    today.maxTemp >= 28
      ? { icon: '👕', label: '服装', text: '半袖で過ごしやすい一日' }
      : today.maxTemp >= 20
        ? { icon: '🧥', label: '服装', text: '薄手の羽織りがあると安心' }
        : today.maxTemp >= 10
          ? { icon: '🧶', label: '服装', text: '上着を持っていこう' }
          : { icon: '🧣', label: '服装', text: 'しっかり防寒がおすすめ' }

  const laundry: TodayPoint =
    today.precipitationProbability < 20
      ? { icon: '🧺', label: '洗濯', text: '洗濯日和！よく乾きそう' }
      : today.precipitationProbability < 50
        ? { icon: '🧺', label: '洗濯', text: '乾きにくいかも、部屋干しも検討して' }
        : { icon: '🧺', label: '洗濯', text: '部屋干しがおすすめ' }

  return [umbrella, clothing, laundry]
}

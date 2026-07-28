/**
 * YouTube Data API の無料枠は1日 10,000 クォータ。
 * リセットは太平洋時間の 0 時なので、日付の区切りも太平洋時間で数える。
 */
export const DAILY_QUOTA = 10_000

const STORAGE_KEY = 'yt-research:quota'
const PT_ZONE = 'America/Los_Angeles'

const PT_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: PT_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const PT_TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: PT_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const RESET_TIME_FORMATTER = new Intl.DateTimeFormat('ja-JP', {
  hour: '2-digit',
  minute: '2-digit',
})

interface QuotaUsage {
  /** 太平洋時間の日付 (YYYY-MM-DD) */
  day: string
  used: number
}

/** その時刻が属する「クォータ上の1日」を表すキー */
export function quotaDayKey(now: number = Date.now()): string {
  return PT_DATE_FORMATTER.format(now)
}

export function loadQuotaUsage(now: number = Date.now()): QuotaUsage {
  const today = quotaDayKey(now)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as QuotaUsage
      // 日付が変わっていれば使用量は 0 に戻る
      if (parsed.day === today && Number.isFinite(parsed.used)) return parsed
    }
  } catch {
    // 読めないときは未使用として扱う
  }
  return { day: today, used: 0 }
}

export function addQuotaUsage(amount: number, now: number = Date.now()): QuotaUsage {
  const current = loadQuotaUsage(now)
  const next: QuotaUsage = { day: current.day, used: current.used + amount }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 保存できなくても検索自体は続けられるようにする
  }
  return next
}

export function resetQuotaUsage(now: number = Date.now()): QuotaUsage {
  const next: QuotaUsage = { day: quotaDayKey(now), used: 0 }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 保存できなくても表示上は 0 に戻る
  }
  return next
}

/** 次のリセット時刻（太平洋時間の 0 時）をこの端末のローカル時刻で返す */
export function nextResetAt(now: number = Date.now()): Date {
  const [hour, minute, second] = PT_TIME_FORMATTER.format(now).split(':').map(Number)
  const elapsed = (hour * 3600 + minute * 60 + second) * 1000
  return new Date(now + 86_400_000 - elapsed)
}

/** 「あと 7時間20分（16:00 にリセット）」のような表示用ラベル */
export function describeReset(now: number = Date.now()): string {
  const reset = nextResetAt(now)
  const remainMinutes = Math.max(0, Math.round((reset.getTime() - now) / 60_000))
  const hours = Math.floor(remainMinutes / 60)
  const minutes = remainMinutes % 60
  const remain = hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`
  return `あと ${remain}（${RESET_TIME_FORMATTER.format(reset)} にリセット）`
}

import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'omoide-weather:temperature-badge'

type BadgeNavigator = Navigator & {
  setAppBadge?: (contents?: number) => Promise<void>
  clearAppBadge?: () => Promise<void>
}

function getSavedSetting() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function useTemperatureBadge(temperature?: number) {
  const badgeNavigator = navigator as BadgeNavigator
  const supported = useMemo(
    () =>
      typeof badgeNavigator.setAppBadge === 'function' &&
      typeof Notification !== 'undefined',
    [badgeNavigator.setAppBadge],
  )
  const [enabled, setEnabled] = useState(getSavedSetting)
  const [message, setMessage] = useState(
    supported
      ? '現在はオフです'
      : 'ホーム画面に追加したアプリから設定してください',
  )

  const applyTemperature = useCallback(
    async (nextTemperature: number) => {
      if (!badgeNavigator.setAppBadge) return

      try {
        const rounded = Math.round(nextTemperature)
        if (rounded > 0) {
          await badgeNavigator.setAppBadge(rounded)
          setMessage(`現在気温 ${rounded}℃ を表示中です`)
        } else {
          await badgeNavigator.setAppBadge()
          setMessage('0℃以下のため、数字ではなく印で表示しています')
        }
      } catch {
        setMessage('気温バッジを更新できませんでした')
      }
    },
    [badgeNavigator],
  )

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled))
    } catch {
      // The setting still works for this session when storage is unavailable.
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || temperature === undefined || !supported) return

    if (Notification.permission === 'granted') {
      void applyTemperature(temperature)
    } else if (Notification.permission === 'denied') {
      setEnabled(false)
      setMessage('iPhoneの通知設定で許可すると使えます')
    }
  }, [applyTemperature, enabled, supported, temperature])

  const toggle = useCallback(async () => {
    if (enabled) {
      setEnabled(false)
      try {
        await badgeNavigator.clearAppBadge?.()
      } finally {
        setMessage('現在はオフです')
      }
      return
    }

    if (!supported) {
      setMessage('Safariではなく、ホーム画面に追加したアプリから設定してください')
      return
    }

    const permission =
      Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission()

    if (permission !== 'granted') {
      setMessage('通知を許可すると気温バッジを表示できます')
      return
    }

    setEnabled(true)
    if (temperature !== undefined) {
      await applyTemperature(temperature)
    } else {
      setMessage('天気を取得したら気温を表示します')
    }
  }, [applyTemperature, badgeNavigator, enabled, supported, temperature])

  return { enabled, message, supported, toggle }
}

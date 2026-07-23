import { useCallback, useEffect, useState } from 'react'
import { fetchCurrentWeather, getCurrentPosition } from '../lib/weather'
import type { CurrentWeather } from '../types'

interface WeatherState {
  weather: CurrentWeather | null
  loading: boolean
  error: string | null
}

export function useWeather() {
  const [state, setState] = useState<WeatherState>({
    weather: null,
    loading: true,
    error: null,
  })

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const position = await getCurrentPosition()
      const weather = await fetchCurrentWeather(
        position.coords.latitude,
        position.coords.longitude,
      )
      setState({ weather, loading: false, error: null })
    } catch (err) {
      const message =
        err instanceof GeolocationPositionError
          ? '位置情報の取得が許可されませんでした。ブラウザの設定を確認してください。'
          : err instanceof Error
            ? err.message
            : '天気情報の取得に失敗しました'
      setState({ weather: null, loading: false, error: message })
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { ...state, refresh }
}

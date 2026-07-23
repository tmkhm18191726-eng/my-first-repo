import { useCallback, useEffect, useState } from 'react'
import { fetchForecast, getCurrentPosition } from '../lib/weather'
import type { Forecast } from '../types'

interface WeatherState {
  forecast: Forecast | null
  loading: boolean
  error: string | null
}

export function useWeather() {
  const [state, setState] = useState<WeatherState>({
    forecast: null,
    loading: true,
    error: null,
  })

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const position = await getCurrentPosition()
      const forecast = await fetchForecast(position.coords.latitude, position.coords.longitude)
      setState({ forecast, loading: false, error: null })
    } catch (err) {
      const message =
        err instanceof GeolocationPositionError
          ? '位置情報の取得が許可されませんでした。ブラウザの設定を確認してください。'
          : err instanceof Error
            ? err.message
            : '天気情報の取得に失敗しました'
      setState({ forecast: null, loading: false, error: message })
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { ...state, refresh }
}

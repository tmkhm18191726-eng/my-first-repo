import { useCallback, useEffect, useState } from 'react'
import { fetchForecast, fetchLocationLabel, getCurrentPosition } from '../lib/weather'
import type { Forecast } from '../types'

interface WeatherState {
  forecast: Forecast | null
  loading: boolean
  error: string | null
  locationLabel: string
}

export function useWeather() {
  const [state, setState] = useState<WeatherState>({
    forecast: null,
    loading: true,
    error: null,
    locationLabel: '現在地',
  })

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const position = await getCurrentPosition()
      const { latitude, longitude } = position.coords
      const [forecast, locationLabel] = await Promise.all([
        fetchForecast(latitude, longitude),
        fetchLocationLabel(latitude, longitude).catch(() => '現在地'),
      ])
      setState({ forecast, loading: false, error: null, locationLabel })
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        try {
          const forecast = await fetchForecast(37.7608, 140.4747)
          setState({ forecast, loading: false, error: null, locationLabel: '福島市' })
          return
        } catch {
          // Fall through to the normal error message.
        }
      }
      const message =
        err instanceof GeolocationPositionError
          ? '位置情報の取得が許可されませんでした。ブラウザの設定を確認してください。'
          : err instanceof Error
            ? err.message
            : '天気情報の取得に失敗しました'
      setState((prev) => ({ ...prev, forecast: null, loading: false, error: message }))
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { ...state, refresh }
}

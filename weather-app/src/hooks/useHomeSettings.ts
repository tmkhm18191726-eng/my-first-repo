import { useEffect, useState } from 'react'

const STORAGE_KEY = 'omoide-weather:show-home-hourly'

export function useHomeSettings() {
  const [showHomeHourly, setShowHomeHourly] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved === null ? true : saved === 'true'
    } catch {
      return true
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(showHomeHourly))
    } catch {
      // The setting still works for this session when storage is unavailable.
    }
  }, [showHomeHourly])

  return { showHomeHourly, setShowHomeHourly }
}

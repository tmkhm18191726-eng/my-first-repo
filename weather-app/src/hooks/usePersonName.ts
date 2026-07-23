import { useCallback, useState } from 'react'

const STORAGE_KEY = 'mofu-weather-name'

export function usePersonName() {
  const [name, setNameState] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')

  const setName = useCallback((next: string) => {
    setNameState(next)
    if (next) {
      localStorage.setItem(STORAGE_KEY, next)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  return { name, setName }
}

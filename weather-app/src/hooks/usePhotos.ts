import { useCallback, useEffect, useState } from 'react'
import { deletePhoto, loadAllPhotos, savePhoto } from '../lib/photoStore'
import type { WeatherCategory } from '../types'

type PhotoUrls = Partial<Record<WeatherCategory, string>>

export function usePhotos() {
  const [urls, setUrls] = useState<PhotoUrls>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    loadAllPhotos()
      .then((blobs) => {
        if (cancelled) return
        const next: PhotoUrls = {}
        for (const key of Object.keys(blobs) as WeatherCategory[]) {
          const blob = blobs[key]
          if (blob) next[key] = URL.createObjectURL(blob)
        }
        setUrls(next)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const setPhoto = useCallback(async (category: WeatherCategory, file: File) => {
    await savePhoto(category, file)
    setUrls((prev) => {
      const old = prev[category]
      if (old) URL.revokeObjectURL(old)
      return { ...prev, [category]: URL.createObjectURL(file) }
    })
  }, [])

  const removePhoto = useCallback(async (category: WeatherCategory) => {
    await deletePhoto(category)
    setUrls((prev) => {
      const old = prev[category]
      if (old) URL.revokeObjectURL(old)
      const next = { ...prev }
      delete next[category]
      return next
    })
  }, [])

  return { urls, loading, setPhoto, removePhoto }
}

import type { WeatherCategory } from '../types'

const DB_NAME = 'mofu-weather-photos'
const STORE_NAME = 'photos'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function savePhoto(category: WeatherCategory, blob: Blob): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(blob, category)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function deletePhoto(category: WeatherCategory): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(category)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function loadAllPhotos(): Promise<Partial<Record<WeatherCategory, Blob>>> {
  const db = await openDb()
  const result = await new Promise<Partial<Record<WeatherCategory, Blob>>>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const out: Partial<Record<WeatherCategory, Blob>> = {}
    const req = store.openCursor()
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        out[cursor.key as WeatherCategory] = cursor.value as Blob
        cursor.continue()
      } else {
        resolve(out)
      }
    }
    req.onerror = () => reject(req.error)
  })
  db.close()
  return result
}

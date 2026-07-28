import { useCallback, useState } from 'react'

const STORAGE_KEY = 'yt-research:api-key'

function read(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

/** 初回表示のタブを決めるなど、レンダー前にキーの有無だけ知りたいとき用 */
export function hasStoredApiKey(): boolean {
  return read() !== ''
}

/**
 * API キーはこの端末の localStorage にだけ保存する。
 * リポジトリやビルド成果物にキーを埋め込まないための作り。
 */
export function useApiKey() {
  const [apiKey, setApiKeyState] = useState(read)

  const setApiKey = useCallback((value: string) => {
    const trimmed = value.trim()
    setApiKeyState(trimmed)
    try {
      if (trimmed) {
        localStorage.setItem(STORAGE_KEY, trimmed)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // プライベートモードなどで保存できない場合はメモリ上だけで使う
    }
  }, [])

  return { apiKey, setApiKey }
}

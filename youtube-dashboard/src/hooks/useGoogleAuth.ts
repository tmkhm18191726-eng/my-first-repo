import { useCallback, useState } from 'react'
import { requestAccessToken } from '../lib/googleAuth'

const TOKEN_STORAGE = 'yt-dashboard:googleAccessToken'

export function useGoogleAuth(clientId: string) {
  const [accessToken, setAccessToken] = useState<string | null>(
    () => sessionStorage.getItem(TOKEN_STORAGE),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async () => {
    if (!clientId) {
      setError('先にOAuthクライアントIDを入力してください。')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const token = await requestAccessToken(clientId)
      sessionStorage.setItem(TOKEN_STORAGE, token)
      setAccessToken(token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました。')
    } finally {
      setBusy(false)
    }
  }, [clientId])

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_STORAGE)
    setAccessToken(null)
  }, [])

  return { accessToken, login, logout, busy, error }
}

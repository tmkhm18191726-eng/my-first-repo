import { useCallback, useEffect, useState } from 'react'
import type { ChannelEntry } from '../types'

const API_KEY_STORAGE = 'yt-dashboard:apiKey'
const OAUTH_CLIENT_ID_STORAGE = 'yt-dashboard:oauthClientId'
const CHANNELS_STORAGE = 'yt-dashboard:channels'

function loadApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) ?? ''
}

function loadOauthClientId(): string {
  return localStorage.getItem(OAUTH_CLIENT_ID_STORAGE) ?? ''
}

function loadChannels(): ChannelEntry[] {
  try {
    const raw = localStorage.getItem(CHANNELS_STORAGE)
    return raw ? (JSON.parse(raw) as ChannelEntry[]) : []
  } catch {
    return []
  }
}

export function useSettings() {
  const [apiKey, setApiKeyState] = useState(loadApiKey)
  const [oauthClientId, setOauthClientIdState] = useState(loadOauthClientId)
  const [channels, setChannels] = useState<ChannelEntry[]>(loadChannels)

  useEffect(() => {
    localStorage.setItem(API_KEY_STORAGE, apiKey)
  }, [apiKey])

  useEffect(() => {
    localStorage.setItem(OAUTH_CLIENT_ID_STORAGE, oauthClientId)
  }, [oauthClientId])

  useEffect(() => {
    localStorage.setItem(CHANNELS_STORAGE, JSON.stringify(channels))
  }, [channels])

  const setApiKey = useCallback((value: string) => setApiKeyState(value.trim()), [])
  const setOauthClientId = useCallback((value: string) => setOauthClientIdState(value.trim()), [])

  const addChannel = useCallback((channel: ChannelEntry) => {
    setChannels((prev) => (prev.some((c) => c.id === channel.id) ? prev : [...prev, channel]))
  }, [])

  const removeChannel = useCallback((id: string) => {
    setChannels((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const moveChannel = useCallback((id: string, direction: -1 | 1) => {
    setChannels((prev) => {
      const index = prev.findIndex((c) => c.id === id)
      const target = index + direction
      if (index === -1 || target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [])

  return {
    apiKey,
    setApiKey,
    oauthClientId,
    setOauthClientId,
    channels,
    addChannel,
    removeChannel,
    moveChannel,
  }
}

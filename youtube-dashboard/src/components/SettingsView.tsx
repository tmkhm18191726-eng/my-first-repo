import { useState } from 'react'
import type { ChannelEntry, ChannelGroup } from '../types'
import { resolveChannel, YouTubeApiError } from '../lib/youtube'

interface Props {
  apiKey: string
  onApiKeyChange: (value: string) => void
  channels: ChannelEntry[]
  onAddChannel: (channel: ChannelEntry) => void
  onRemoveChannel: (id: string) => void
  onMoveChannel: (id: string, direction: -1 | 1) => void
}

export function SettingsView({
  apiKey,
  onApiKeyChange,
  channels,
  onAddChannel,
  onRemoveChannel,
  onMoveChannel,
}: Props) {
  const [input, setInput] = useState('')
  const [group, setGroup] = useState<ChannelGroup>('mine')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!apiKey) {
      setError('先にAPIキーを入力してください。')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const resolved = await resolveChannel(apiKey, input)
      onAddChannel({ ...resolved, group })
      setInput('')
    } catch (err) {
      setError(err instanceof YouTubeApiError ? err.message : '追加に失敗しました。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="settings-view">
      <section className="settings-card">
        <label className="settings-field-label" htmlFor="api-key">
          YouTube Data API v3 キー
        </label>
        <input
          id="api-key"
          type="password"
          className="settings-input"
          placeholder="AIza..."
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="settings-note">
          Google Cloud ConsoleでYouTube Data API v3を有効にして発行したAPIキーを入力してください。この端末のブラウザ内にのみ保存されます。
        </p>
      </section>

      <section className="settings-card">
        <h2 className="section-title">チャンネルを追加</h2>
        <input
          type="text"
          className="settings-input"
          placeholder="チャンネルURL・@ハンドル・チャンネルIDを入力"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="settings-group-toggle">
          <button
            type="button"
            className={`toggle-option${group === 'mine' ? ' active' : ''}`}
            onClick={() => setGroup('mine')}
          >
            自分のチャンネル
          </button>
          <button
            type="button"
            className={`toggle-option${group === 'benchmark' ? ' active' : ''}`}
            onClick={() => setGroup('benchmark')}
          >
            ベンチマーク
          </button>
        </div>
        <button
          type="button"
          className="add-button"
          onClick={() => void handleAdd()}
          disabled={busy || !input.trim()}
        >
          {busy ? '追加中...' : '追加する'}
        </button>
        {error && <p className="status-error inline">{error}</p>}
      </section>

      <section className="settings-card">
        <h2 className="section-title">登録済みチャンネル</h2>
        {channels.length === 0 && <p className="settings-note">まだチャンネルが登録されていません。</p>}
        <ul className="channel-manage-list">
          {channels.map((channel, index) => (
            <li key={channel.id} className="channel-manage-item">
              {channel.thumbnail ? (
                <img src={channel.thumbnail} alt="" className="chip-avatar" />
              ) : (
                <span className="chip-avatar chip-avatar-fallback" aria-hidden="true">
                  📺
                </span>
              )}
              <div className="channel-manage-text">
                <strong>{channel.title}</strong>
                <span>{channel.group === 'mine' ? '自分のチャンネル' : 'ベンチマーク'}</span>
              </div>
              <div className="channel-manage-actions">
                <button
                  type="button"
                  aria-label="上へ"
                  onClick={() => onMoveChannel(channel.id, -1)}
                  disabled={index === 0}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="下へ"
                  onClick={() => onMoveChannel(channel.id, 1)}
                  disabled={index === channels.length - 1}
                >
                  ↓
                </button>
                <button type="button" aria-label="削除" onClick={() => onRemoveChannel(channel.id)}>
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { ChannelSwitcher } from './components/ChannelSwitcher'
import { StatusView } from './components/StatusView'
import { SettingsView } from './components/SettingsView'
import { BottomNav, type TabKey } from './components/BottomNav'
import { useSettings } from './hooks/useSettings'
import { useChannelSnapshot, getCachedSnapshots } from './hooks/useChannelSnapshot'
import './App.css'

function App() {
  const { apiKey, setApiKey, channels, addChannel, removeChannel, moveChannel } = useSettings()
  const [tab, setTab] = useState<TabKey>(channels.length === 0 || !apiKey ? 'settings' : 'status')
  const [selectedId, setSelectedId] = useState<string | null>(channels[0]?.id ?? null)
  const [snapshotVersion, setSnapshotVersion] = useState(0)

  useEffect(() => {
    if (!selectedId && channels.length > 0) setSelectedId(channels[0].id)
    if (selectedId && !channels.some((c) => c.id === selectedId)) {
      setSelectedId(channels[0]?.id ?? null)
    }
  }, [channels, selectedId])

  const selectedChannel = channels.find((c) => c.id === selectedId) ?? null
  const { snapshot, loading, error, refresh } = useChannelSnapshot(apiKey, selectedChannel)

  useEffect(() => {
    setSnapshotVersion((v) => v + 1)
  }, [snapshot])

  const liveIds = useMemo(() => {
    // snapshotVersion forces recompute after each fetch without adding cache internals as a dep
    void snapshotVersion
    const ids = new Set<string>()
    for (const [id, snap] of getCachedSnapshots()) if (snap.isLive) ids.add(id)
    return ids
  }, [snapshotVersion])

  return (
    <div className="app">
      <div className="app-content">
        {tab === 'status' &&
          (channels.length === 0 ? (
            <div className="status-view">
              <p className="status-loading">「設定」からチャンネルを追加してください。</p>
            </div>
          ) : (
            <>
              <ChannelSwitcher
                channels={channels}
                selectedId={selectedId}
                liveIds={liveIds}
                onSelect={setSelectedId}
              />
              <StatusView snapshot={snapshot} loading={loading} error={error} onRefresh={refresh} />
            </>
          ))}
        {tab === 'settings' && (
          <SettingsView
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            channels={channels}
            onAddChannel={addChannel}
            onRemoveChannel={removeChannel}
            onMoveChannel={moveChannel}
          />
        )}
      </div>
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}

export default App

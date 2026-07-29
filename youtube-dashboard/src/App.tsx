import { useState } from 'react'
import { ChannelListView } from './components/ChannelListView'
import { SettingsView } from './components/SettingsView'
import { BottomNav, type TabKey } from './components/BottomNav'
import { useSettings } from './hooks/useSettings'
import './App.css'

function App() {
  const { apiKey, setApiKey, channels, addChannel, removeChannel, moveChannel } = useSettings()
  const [tab, setTab] = useState<TabKey>(channels.length === 0 || !apiKey ? 'settings' : 'list')

  return (
    <div className="app">
      <div className="app-content">
        {tab === 'list' &&
          (channels.length === 0 ? (
            <div className="status-view">
              <p className="status-loading">「設定」からチャンネルを追加してください。</p>
            </div>
          ) : (
            <ChannelListView apiKey={apiKey} channels={channels} />
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

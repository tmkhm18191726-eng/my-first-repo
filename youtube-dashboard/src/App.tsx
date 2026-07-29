import { useState } from 'react'
import { ChannelListView } from './components/ChannelListView'
import { SettingsView } from './components/SettingsView'
import { BottomNav, type TabKey } from './components/BottomNav'
import { useSettings } from './hooks/useSettings'
import { useGoogleAuth } from './hooks/useGoogleAuth'
import './App.css'

function App() {
  const {
    apiKey,
    setApiKey,
    oauthClientId,
    setOauthClientId,
    channels,
    addChannel,
    removeChannel,
    moveChannel,
  } = useSettings()
  const googleAuth = useGoogleAuth(oauthClientId)
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
            <ChannelListView
              apiKey={apiKey}
              channels={channels}
              googleAccessToken={googleAuth.accessToken}
            />
          ))}
        {tab === 'settings' && (
          <SettingsView
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            oauthClientId={oauthClientId}
            onOauthClientIdChange={setOauthClientId}
            googleAccessToken={googleAuth.accessToken}
            googleAuthBusy={googleAuth.busy}
            googleAuthError={googleAuth.error}
            onGoogleLogin={() => void googleAuth.login()}
            onGoogleLogout={googleAuth.logout}
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

import { useState } from 'react'
import { WeatherView } from './components/WeatherView'
import { PhotoManager } from './components/PhotoManager'
import { ForecastView } from './components/ForecastView'
import { BottomNav, type TabKey } from './components/BottomNav'
import { useWeather } from './hooks/useWeather'
import { usePhotos } from './hooks/usePhotos'
import { usePersonName } from './hooks/usePersonName'
import { useHomeSettings } from './hooks/useHomeSettings'
import './App.css'

function App() {
  const { forecast, loading, error, locationLabel, refresh } = useWeather()
  const { urls, setPhoto, removePhoto } = usePhotos()
  const { name, setName } = usePersonName()
  const { showHomeHourly, setShowHomeHourly } = useHomeSettings()
  const [tab, setTab] = useState<TabKey>('weather')

  const category = forecast?.current.category ?? 'sunny'

  return (
    <div className="app">
      <div className="app-content">
        {tab === 'weather' && (
          <WeatherView
            forecast={forecast}
            loading={loading}
            error={error}
            photoUrl={urls[category]}
            name={name}
            locationLabel={locationLabel}
            showHourly={showHomeHourly}
            onRetry={refresh}
            onOpenForecast={() => setTab('forecast')}
          />
        )}
        {tab === 'forecast' &&
          (forecast ? (
            <ForecastView
              forecast={forecast}
              locationLabel={locationLabel}
              photoUrl={urls[category]}
              onBack={() => setTab('weather')}
            />
          ) : (
            <div className="forecast-view">
              <p className="status">{error ?? '天気情報を取得中...'}</p>
            </div>
          ))}
        {tab === 'photos' && (
          <PhotoManager
            urls={urls}
            onSetPhoto={setPhoto}
            onRemovePhoto={removePhoto}
            name={name}
            onNameChange={setName}
          />
        )}
        {(tab === 'area' || tab === 'radar') && (
          <div className="placeholder-view">
            <span className="placeholder-icon" aria-hidden="true">
              {tab === 'area' ? '⌖' : '☂'}
            </span>
            <h1>{tab === 'area' ? 'エリア' : '雨雲レーダー'}</h1>
            <p>この機能は次のステップで追加します。</p>
          </div>
        )}
        {tab === 'settings' && (
          <div className="settings-view">
            <div className="settings-header">
              <span aria-hidden="true">⚙</span>
              <div>
                <h1>設定</h1>
                <p>天気画面の表示を自分好みに調整できます</p>
              </div>
            </div>
            <section className="settings-card">
              <div className="settings-copy">
                <strong>時間ごとの天気を表示</strong>
                <span>
                  オフにすると、思い出メッセージが画面下部へ移動します
                </span>
              </div>
              <button
                type="button"
                className={`settings-switch${showHomeHourly ? ' on' : ''}`}
                role="switch"
                aria-checked={showHomeHourly}
                aria-label="時間ごとの天気を表示"
                onClick={() => setShowHomeHourly(!showHomeHourly)}
              >
                <span />
              </button>
            </section>
            <p className="settings-note">この設定は、この端末の中だけに保存されます。</p>
          </div>
        )}
      </div>
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}

export default App

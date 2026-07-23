import { useState } from 'react'
import { WeatherView } from './components/WeatherView'
import { PhotoManager } from './components/PhotoManager'
import { ForecastView } from './components/ForecastView'
import { BottomNav, type TabKey } from './components/BottomNav'
import { useWeather } from './hooks/useWeather'
import { usePhotos } from './hooks/usePhotos'
import { usePersonName } from './hooks/usePersonName'
import './App.css'

function App() {
  const { forecast, loading, error, refresh } = useWeather()
  const { urls, setPhoto, removePhoto } = usePhotos()
  const { name, setName } = usePersonName()
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
            onRetry={refresh}
            onOpenForecast={() => setTab('forecast')}
          />
        )}
        {tab === 'forecast' &&
          (forecast ? (
            <ForecastView forecast={forecast} />
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
      </div>
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}

export default App

import { useState } from 'react'
import { WeatherView } from './components/WeatherView'
import { PhotoManager } from './components/PhotoManager'
import { useWeather } from './hooks/useWeather'
import { usePhotos } from './hooks/usePhotos'
import './App.css'

function App() {
  const { forecast, loading, error, refresh } = useWeather()
  const { urls, setPhoto, removePhoto } = usePhotos()
  const [showSettings, setShowSettings] = useState(false)

  const category = forecast?.current.category ?? 'sunny'

  return (
    <div className="app">
      <WeatherView
        forecast={forecast}
        loading={loading}
        error={error}
        photoUrl={urls[category]}
        onRetry={refresh}
        onOpenSettings={() => setShowSettings(true)}
      />
      {showSettings && (
        <PhotoManager
          urls={urls}
          onSetPhoto={setPhoto}
          onRemovePhoto={removePhoto}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default App

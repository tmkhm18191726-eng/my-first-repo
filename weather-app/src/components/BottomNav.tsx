import type { ReactNode } from 'react'
import { ForecastTabIcon, PhotosTabIcon, WeatherTabIcon } from './NavIcons'

export type TabKey = 'weather' | 'forecast' | 'photos'

interface Props {
  tab: TabKey
  onChange: (tab: TabKey) => void
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'weather', label: '天気' },
  { key: 'forecast', label: '予報' },
  { key: 'photos', label: '写真' },
]

const ICONS: Record<TabKey, (active: boolean) => ReactNode> = {
  weather: (active) => <WeatherTabIcon active={active} />,
  forecast: (active) => <ForecastTabIcon active={active} />,
  photos: (active) => <PhotosTabIcon active={active} />,
}

export function BottomNav({ tab, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => {
        const active = tab === t.key
        return (
          <button key={t.key} className={active ? 'active' : ''} onClick={() => onChange(t.key)}>
            <span className="bottom-nav-icon">{ICONS[t.key](active)}</span>
            <span className="bottom-nav-label">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

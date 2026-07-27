import type { ReactNode } from 'react'
import {
  AreaTabIcon,
  PhotosTabIcon,
  RadarTabIcon,
  SettingsTabIcon,
  WeatherTabIcon,
} from './NavIcons'

export type TabKey = 'weather' | 'forecast' | 'area' | 'radar' | 'photos' | 'settings'

interface Props {
  tab: TabKey
  onChange: (tab: TabKey) => void
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'weather', label: '天気' },
  { key: 'area', label: 'エリア' },
  { key: 'radar', label: 'レーダー' },
  { key: 'photos', label: '背景' },
  { key: 'settings', label: '設定' },
]

const ICONS: Record<TabKey, (active: boolean) => ReactNode> = {
  weather: (active) => <WeatherTabIcon active={active} />,
  forecast: (active) => <WeatherTabIcon active={active} />,
  area: (active) => <AreaTabIcon active={active} />,
  radar: (active) => <RadarTabIcon active={active} />,
  photos: (active) => <PhotosTabIcon active={active} />,
  settings: (active) => <SettingsTabIcon active={active} />,
}

export function BottomNav({ tab, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => {
        const active = tab === t.key || (tab === 'forecast' && t.key === 'weather')
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

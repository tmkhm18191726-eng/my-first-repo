export type TabKey = 'weather' | 'forecast' | 'photos'

interface Props {
  tab: TabKey
  onChange: (tab: TabKey) => void
}

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'weather', label: '天気', icon: '🐾' },
  { key: 'forecast', label: '予報', icon: '📅' },
  { key: 'photos', label: '写真', icon: '🖼️' },
]

export function BottomNav({ tab, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <button
          key={t.key}
          className={tab === t.key ? 'active' : ''}
          onClick={() => onChange(t.key)}
        >
          <span className="bottom-nav-icon">{t.icon}</span>
          <span className="bottom-nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}

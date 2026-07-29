export type TabKey = 'status' | 'settings'

interface Props {
  tab: TabKey
  onChange: (tab: TabKey) => void
}

export function BottomNav({ tab, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      <button
        type="button"
        className={`nav-item${tab === 'status' ? ' nav-item-active' : ''}`}
        onClick={() => onChange('status')}
      >
        <span aria-hidden="true">📊</span>
        <span>状況</span>
      </button>
      <button
        type="button"
        className={`nav-item${tab === 'settings' ? ' nav-item-active' : ''}`}
        onClick={() => onChange('settings')}
      >
        <span aria-hidden="true">⚙</span>
        <span>設定</span>
      </button>
    </nav>
  )
}

export type TabKey = 'list' | 'settings'

interface Props {
  tab: TabKey
  onChange: (tab: TabKey) => void
}

export function BottomNav({ tab, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      <button
        type="button"
        className={`nav-item${tab === 'list' ? ' nav-item-active' : ''}`}
        onClick={() => onChange('list')}
      >
        <span aria-hidden="true">📊</span>
        <span>一覧</span>
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

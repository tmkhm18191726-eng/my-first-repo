import { useRef } from 'react'
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS, CATEGORY_ORDER, type WeatherCategory } from '../types'
import { WeatherIcon } from './WeatherIcon'

interface Props {
  urls: Partial<Record<WeatherCategory, string>>
  onSetPhoto: (category: WeatherCategory, file: File) => void
  onRemovePhoto: (category: WeatherCategory) => void
  name: string
  onNameChange: (name: string) => void
}

export function PhotoManager({ urls, onSetPhoto, onRemovePhoto, name, onNameChange }: Props) {
  const inputRefs = useRef<Partial<Record<WeatherCategory, HTMLInputElement | null>>>({})

  return (
    <div className="photo-manager">
      <h1>思い出の写真を設定 💗</h1>

      <p className="lead">
        お子さんや大切な思い出の写真で、天気画面をやさしく彩れます。
      </p>

      <div className="name-field">
        <span className="name-field-avatar">👤</span>
        <div className="name-field-input">
          <label htmlFor="person-name">呼んでほしい名前</label>
          <input
            id="person-name"
            type="text"
            placeholder="例：かなちゃん"
            value={name}
            maxLength={20}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>
      </div>

      <ul className="category-list">
        {CATEGORY_ORDER.map((category) => {
          const url = urls[category]
          return (
            <li key={category} className="category-item">
              <div
                className="thumb-large"
                style={url ? { backgroundImage: `url(${url})` } : undefined}
              >
                {!url && <span>未設定</span>}
              </div>
              <div className="category-info">
                <div className="category-name-row">
                  <WeatherIcon category={category} size={20} />
                  <span className="category-name">{CATEGORY_LABELS[category]}</span>
                  <span className={`status-pill${url ? ' set' : ''}`}>
                    {url ? '設定済み' : '未設定'}
                  </span>
                </div>
                <p className="category-desc">{CATEGORY_DESCRIPTIONS[category]}</p>
                <div className="category-actions">
                  <button onClick={() => inputRefs.current[category]?.click()}>
                    {url ? '写真を変更' : '写真を追加'}
                  </button>
                  {url && (
                    <button className="danger" onClick={() => onRemovePhoto(category)}>
                      削除
                    </button>
                  )}
                </div>
                <input
                  ref={(el) => {
                    inputRefs.current[category] = el
                  }}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onSetPhoto(category, file)
                    e.target.value = ''
                  }}
                />
              </div>
            </li>
          )
        })}
      </ul>

      <p className="note">写真はこの端末の中だけに保存され、外部には送信されません。</p>
    </div>
  )
}

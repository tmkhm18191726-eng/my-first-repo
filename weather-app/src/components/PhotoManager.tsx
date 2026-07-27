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
  const defaultPhotoUrl = `${import.meta.env.BASE_URL}default-memory-child.png`

  return (
    <div className="photo-manager">
      <div className="photo-manager-heading">
        <h1>背景</h1>
        <button
          className="add-photo-button"
          type="button"
          aria-label="写真を追加"
          onClick={() => inputRefs.current.sunny?.click()}
        >
          ＋
        </button>
      </div>

      <p className="lead">
        お子さんの思い出写真で、天気画面をやさしく彩ります
      </p>

      <p className="privacy-banner">♥ 写真はこの端末の中だけに保存され、外部へ送信されません。</p>

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
          const previewUrl = url ?? defaultPhotoUrl
          return (
            <li key={category} className="category-item">
              <div
                className="thumb-large"
                style={{ backgroundImage: `url(${previewUrl})` }}
              >
              </div>
              <div className="category-info">
                <div className="category-name-row">
                  <WeatherIcon category={category} size={20} />
                  <span className="category-name">{CATEGORY_LABELS[category]}</span>
                  <span className={`status-pill${url ? ' set' : ''}`}>
                    {url ? '使用中' : '標準背景'}
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

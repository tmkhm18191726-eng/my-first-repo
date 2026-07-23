import { useRef } from 'react'
import { CATEGORY_LABELS, CATEGORY_ORDER, type WeatherCategory } from '../types'

interface Props {
  urls: Partial<Record<WeatherCategory, string>>
  onSetPhoto: (category: WeatherCategory, file: File) => void
  onRemovePhoto: (category: WeatherCategory) => void
  onClose: () => void
}

export function PhotoManager({ urls, onSetPhoto, onRemovePhoto, onClose }: Props) {
  const inputRefs = useRef<Partial<Record<WeatherCategory, HTMLInputElement | null>>>({})

  return (
    <div className="photo-manager">
      <header>
        <h1>思い出の写真を設定</h1>
        <button className="close-btn" onClick={onClose} aria-label="閉じる">
          ✕
        </button>
      </header>

      <p className="lead">
        天気ごとに、お子さんや大切な思い出の写真を登録しておくと、その日の天気に合わせて背景に表示されます。
      </p>

      <ul className="category-list">
        {CATEGORY_ORDER.map((category) => {
          const url = urls[category]
          return (
            <li key={category} className="category-item">
              <div
                className="thumb"
                style={url ? { backgroundImage: `url(${url})` } : undefined}
              >
                {!url && <span>未設定</span>}
              </div>
              <div className="category-info">
                <p className="category-name">{CATEGORY_LABELS[category]}</p>
                <div className="category-actions">
                  <button
                    onClick={() => inputRefs.current[category]?.click()}
                  >
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

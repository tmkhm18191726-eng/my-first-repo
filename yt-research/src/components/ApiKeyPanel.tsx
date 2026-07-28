import { useEffect, useId, useState } from 'react'

interface Props {
  apiKey: string
  onSave: (value: string) => void
}

export function ApiKeyPanel({ apiKey, onSave }: Props) {
  const inputId = useId()
  const [draft, setDraft] = useState(apiKey)
  const [saved, setSaved] = useState(false)

  useEffect(() => setDraft(apiKey), [apiKey])

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 2000)
    return () => clearTimeout(timer)
  }, [saved])

  return (
    <section className="panel">
      <h2 className="panel-title">YouTube Data API キー</h2>
      <p className="hint">
        キーはこの端末のブラウザ（localStorage）にだけ保存され、どこにも送信されません。
        検索リクエストは端末から直接 YouTube API に送られます。
      </p>

      <div className="field">
        <label className="field-label" htmlFor={inputId}>
          API キー
        </label>
        <input
          id={inputId}
          className="text-input"
          type="password"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="AIza..."
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="form-actions">
        {apiKey && (
          <button
            type="button"
            className="button ghost"
            onClick={() => {
              onSave('')
              setDraft('')
            }}
          >
            キーを削除
          </button>
        )}
        <button
          type="button"
          className="button primary"
          onClick={() => {
            onSave(draft)
            setSaved(true)
          }}
        >
          保存する
        </button>
      </div>
      {saved && <p className="notice">保存しました</p>}

      <details className="advanced">
        <summary>キーの取り方（初回のみ）</summary>
        <ol className="steps">
          <li>
            <a
              href="https://console.cloud.google.com/projectcreate"
              target="_blank"
              rel="noreferrer noopener"
            >
              Google Cloud Console
            </a>
            でプロジェクトを作る
          </li>
          <li>
            「APIとサービス」→「ライブラリ」から{' '}
            <a
              href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
              target="_blank"
              rel="noreferrer noopener"
            >
              YouTube Data API v3
            </a>{' '}
            を有効化する
          </li>
          <li>「認証情報」→「認証情報を作成」→「APIキー」でキーを発行する</li>
          <li>
            発行したキーを開き、「APIの制限」で YouTube Data API v3
            のみに、「アプリケーションの制限」でこのサイトの URL のみに絞っておく（推奨）
          </li>
          <li>上の入力欄に貼り付けて保存</li>
        </ol>
        <p className="hint">
          YouTube Data API v3 の利用は無料で、支払い情報の登録も必要ありません。
          1日 10,000 クォータの無料枠だけで動き、それを超えると課金ではなくエラーが返る仕組みです。
          検索1回でおよそ 100〜500 使います。
        </p>
      </details>
    </section>
  )
}

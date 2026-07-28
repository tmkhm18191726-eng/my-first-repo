"use client";

import type { CallErrorCode, CallPhase } from "@/lib/call/status";

const PHASES: { phase: CallPhase; errorCode?: CallErrorCode; label: string }[] = [
  { phase: "idle", label: "停止中" },
  { phase: "connecting", label: "準備中" },
  { phase: "waiting", label: "待機中" },
  { phase: "calling", label: "呼び出し中" },
  { phase: "negotiating", label: "接続中" },
  { phase: "in-call", label: "通話中" },
  { phase: "ended", label: "終了" },
  { phase: "error", errorCode: "mic-permission", label: "エラー：マイク不許可" },
  { phase: "error", errorCode: "peer-offline", label: "エラー：PCが待機していない" },
  { phase: "error", errorCode: "network", label: "エラー：ネット未接続" },
  { phase: "error", errorCode: "connect-failed", label: "エラー：接続失敗" },
  { phase: "error", errorCode: "auth", label: "エラー：認証切れ" },
];

type Props = {
  onSelect: (phase: CallPhase, errorCode?: CallErrorCode) => void;
};

/**
 * ステップ1-1 の表示確認用パネル。
 * 通信をまだ実装していない段階で、日本語の文言と見た目をひととおり確認するためのもの。
 * ステップ1-3（実際に音声がつながる回）で削除する。
 */
export function PhasePreview({ onSelect }: Props) {
  return (
    <details className="preview-panel">
      <summary>表示テスト（ステップ1-1のみ・後で削除します）</summary>
      <p className="note">
        ボタンを押すと、その状態のときの画面表示を確認できます。実際の通話はまだ行われません。
      </p>
      <div className="preview-buttons">
        {PHASES.map((item) => (
          <button
            key={`${item.phase}-${item.errorCode ?? ""}`}
            type="button"
            onClick={() => onSelect(item.phase, item.errorCode)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </details>
  );
}

import { statusText, type CallErrorCode, type CallPhase } from "@/lib/call/status";

type Props = {
  phase: CallPhase;
  errorCode?: CallErrorCode;
};

/**
 * 今の状態を日本語で伝える表示。
 * 色だけで判断させないよう、必ず文字（label）と説明（description）を一緒に出す。
 */
export function StatusBanner({ phase, errorCode }: Props) {
  const text = statusText(phase, errorCode);

  return (
    <div className="status" data-tone={text.tone} role="status" aria-live="polite">
      <p className="status-label">
        <span className="status-dot" aria-hidden="true" />
        {text.label}
      </p>
      <p className="status-description">{text.description}</p>
    </div>
  );
}

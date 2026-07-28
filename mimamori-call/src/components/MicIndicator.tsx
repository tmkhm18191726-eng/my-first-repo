type Props = {
  /** マイクが実際に音を拾っている状態か */
  live: boolean;
  /** 音の大きさ 0〜1。マイクが本当に生きているか目で確認できるようにする */
  level?: number;
};

/**
 * 「マイク使用中」であることを常に画面に出すための表示。
 * 隠し録音・隠し監視にならないよう、通話中はこの表示を必ず出したままにする。
 */
export function MicIndicator({ live, level = 0 }: Props) {
  const width = `${Math.round(Math.min(Math.max(level, 0), 1) * 100)}%`;

  return (
    <div className="mic-indicator" data-live={live} role="status" aria-live="polite">
      <span className="mic-indicator-text">
        {live ? "🔴 マイク使用中" : "マイクは切れています"}
      </span>
      <div
        className="mic-meter"
        role="meter"
        aria-label="マイクが拾っている音の大きさ"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(Math.max(level, 0), 1) * 100)}
      >
        <div className="mic-meter-fill" style={{ width }} />
      </div>
    </div>
  );
}

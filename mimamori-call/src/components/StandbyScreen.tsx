import { statusText, type CallErrorCode, type CallPhase } from "@/lib/call/status";
import { MicIndicator } from "./MicIndicator";

type Props = {
  phase: CallPhase;
  errorCode?: CallErrorCode;
  micLive: boolean;
  micLevel?: number;
  /** 親のスマホが接続しているか */
  parentOnline?: boolean;
  /** 通話終了ボタン。通話中だけ押せる */
  onHangUp?: () => void;
  /** 待機をやめてトップに戻る */
  onStopStandby?: () => void;
};

/**
 * 待機画面に出す特大の見出し。家族が離れた場所からでも読めることを優先する。
 * エラーのときは「エラー」ではなく、何が起きたかを見出しに出す。
 */
function headline(phase: CallPhase, errorLabel: string): string {
  switch (phase) {
    case "in-call":
      return "通話中";
    case "calling":
    case "negotiating":
      return "接続中…";
    case "ended":
      return "通話を終了しました";
    case "error":
      return errorLabel;
    case "connecting":
      return "準備中…";
    default:
      return "見守り通話待機中";
  }
}

/**
 * 自宅の Windows PC に出しっぱなしにする画面。
 * 「今マイクが入っているか」「今つながっているか」が部屋の反対側からでも分かることを狙う。
 */
export function StandbyScreen({
  phase,
  errorCode,
  micLive,
  micLevel = 0,
  parentOnline = false,
  onHangUp,
  onStopStandby,
}: Props) {
  const text = statusText(phase, errorCode);
  const title = headline(phase, text.label);

  return (
    <div className="standby" data-phase={phase === "error" ? "error" : phase}>
      <div className="standby-top">
        <MicIndicator live={micLive} level={micLevel} />
      </div>

      {/* 長い見出しは少し小さくして、画面からはみ出さないようにする */}
      <h1 className="standby-headline" data-long={title.length > 9}>
        {title}
      </h1>
      <p className="standby-sub">{text.description}</p>
      {phase === "waiting" ? (
        <p className="standby-sub">
          {parentOnline ? "スマートフォンが接続しています。" : "スマートフォンは接続していません。"}
        </p>
      ) : null}

      <div className="standby-footer">
        {phase === "in-call" && onHangUp ? (
          <button type="button" className="btn btn-danger" onClick={onHangUp}>
            通話を終了する
          </button>
        ) : null}
        {onStopStandby ? (
          <button type="button" className="btn btn-quiet" onClick={onStopStandby}>
            待機をやめる
          </button>
        ) : null}
      </div>
    </div>
  );
}

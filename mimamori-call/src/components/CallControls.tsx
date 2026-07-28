import type { CallPhase } from "@/lib/call/status";

type Props = {
  phase: CallPhase;
  onConnect: () => void;
  onHangUp: () => void;
};

/** 親のスマホ用の操作ボタン。押せるボタンが常に1つだけになるようにする。 */
export function CallControls({ phase, onConnect, onHangUp }: Props) {
  const calling = phase === "calling" || phase === "negotiating";
  const inCall = phase === "in-call";

  if (inCall || calling) {
    return (
      <button type="button" className="btn btn-danger" onClick={onHangUp}>
        {inCall ? "通話を終了する" : "呼び出しをやめる"}
      </button>
    );
  }

  return (
    <button type="button" className="btn btn-primary" onClick={onConnect}>
      接続する
    </button>
  );
}

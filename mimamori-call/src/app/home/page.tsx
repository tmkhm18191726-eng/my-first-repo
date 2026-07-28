"use client";

import Link from "next/link";
import { StandbyScreen } from "@/components/StandbyScreen";
import { StatusBanner } from "@/components/StatusBanner";
import { isMicLive } from "@/lib/call/status";
import { useCallSession } from "@/lib/call/useCallSession";

export default function HomePcPage() {
  const session = useCallSession("home");

  // 「待機開始」を押したあとは、ずっとこの全画面表示のまま
  if (session.phase !== "idle") {
    return (
      <StandbyScreen
        phase={session.phase}
        errorCode={session.errorCode}
        micLive={isMicLive(session.phase)}
        micLevel={session.micLevel}
        parentOnline={session.parentOnline}
        onHangUp={session.hangUp}
        onStopStandby={session.stop}
      />
    );
  }

  return (
    <main className="page">
      <h1 className="page-title">見守り通話（自宅のパソコン用）</h1>
      <p className="page-lead">
        「待機開始」を一度押すと、着信を待つ画面になります。会話は録音されません。
      </p>

      <div className="card">
        <StatusBanner phase={session.phase} errorCode={session.errorCode} />
      </div>

      <div className="card">
        <button type="button" className="btn btn-primary" onClick={session.start}>
          待機開始
        </button>
        <p className="note">
          ※ 現在はステップ1-2（相手を見つけるしくみを作る段階）です。親のスマホからの呼び出しは
          届きますが、まだ声は流れません。音声はステップ1-3 で追加します。
        </p>
      </div>

      <div className="card">
        <p className="section-title">このパソコンでやっておくこと</p>
        <ul className="note-list">
          <li>マイクの使用許可を聞かれたら「許可」を選んでください。</li>
          <li>スピーカーの音量を上げておいてください（着信時にチャイムが鳴ります）。</li>
          <li>待機中はこの画面を開いたままにしてください。閉じると着信できません。</li>
        </ul>
      </div>

      <Link className="note" href="/">
        ← 最初の画面にもどる
      </Link>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { PhasePreview } from "@/components/PhasePreview";
import { StandbyScreen } from "@/components/StandbyScreen";
import { StatusBanner } from "@/components/StatusBanner";
import { isMicLive, type CallErrorCode, type CallPhase } from "@/lib/call/status";

export default function HomePcPage() {
  const [standby, setStandby] = useState(false);
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [errorCode, setErrorCode] = useState<CallErrorCode | undefined>(undefined);

  // ステップ1-2 で、ここがつなぎ役サーバーへの接続処理に置き換わります。
  const handleStartStandby = () => {
    setErrorCode(undefined);
    setStandby(true);
    setPhase("waiting");
  };

  const handleStopStandby = () => {
    setStandby(false);
    setPhase("idle");
    setErrorCode(undefined);
  };

  const handleHangUp = () => {
    setPhase("waiting");
    setErrorCode(undefined);
  };

  if (standby) {
    return (
      <StandbyScreen
        phase={phase}
        errorCode={errorCode}
        micLive={isMicLive(phase)}
        onHangUp={handleHangUp}
        onStopStandby={handleStopStandby}
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
        <StatusBanner phase={phase} errorCode={errorCode} />
      </div>

      <div className="card">
        <button type="button" className="btn btn-primary" onClick={handleStartStandby}>
          待機開始
        </button>
        <p className="note">
          ※ 現在はステップ1-1（画面の見た目を作る段階）です。押すと待機画面の見た目を確認できますが、
          まだ実際には着信しません。
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

      <PhasePreview
        onSelect={(nextPhase, nextError) => {
          setStandby(true);
          setPhase(nextPhase);
          setErrorCode(nextError);
        }}
      />
    </main>
  );
}

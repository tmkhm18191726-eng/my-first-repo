"use client";

import Link from "next/link";
import { useState } from "react";
import { CallControls } from "@/components/CallControls";
import { MicIndicator } from "@/components/MicIndicator";
import { PhasePreview } from "@/components/PhasePreview";
import { StatusBanner } from "@/components/StatusBanner";
import { isMicLive, type CallErrorCode, type CallPhase } from "@/lib/call/status";

export default function ParentPage() {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [errorCode, setErrorCode] = useState<CallErrorCode | undefined>(undefined);

  // ステップ1-3 で、ここが実際の WebRTC の呼び出し処理に置き換わります。
  const handleConnect = () => {
    setErrorCode(undefined);
    setPhase("calling");
  };

  const handleHangUp = () => {
    setErrorCode(undefined);
    setPhase("ended");
  };

  return (
    <main className="page">
      <h1 className="page-title">見守り通話（親用）</h1>
      <p className="page-lead">自宅のパソコンに話しかけます。会話は録音されません。</p>

      <div className="card">
        <StatusBanner phase={phase} errorCode={errorCode} />
      </div>

      <div className="card">
        <MicIndicator live={isMicLive(phase)} />
        <div style={{ marginTop: 16 }}>
          <CallControls phase={phase} onConnect={handleConnect} onHangUp={handleHangUp} />
        </div>
        <p className="note">
          ※ 現在はステップ1-1（画面の見た目を作る段階）です。ボタンを押しても、まだ実際には
          音声はつながりません。
        </p>
      </div>

      <div className="card">
        <p className="section-title">使うときの手順</p>
        <ul className="note-list">
          <li>自宅のパソコンで「待機開始」が押されていることが必要です。</li>
          <li>初めて接続するときは、マイクの使用許可を聞かれるので「許可」を選んでください。</li>
          <li>話し終わったら必ず「通話を終了する」を押してください。</li>
        </ul>
      </div>

      <Link className="note" href="/">
        ← 最初の画面にもどる
      </Link>

      <PhasePreview
        onSelect={(nextPhase, nextError) => {
          setPhase(nextPhase);
          setErrorCode(nextError);
        }}
      />
    </main>
  );
}

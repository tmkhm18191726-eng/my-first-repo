"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CallControls } from "@/components/CallControls";
import { MicIndicator } from "@/components/MicIndicator";
import { PassphraseGate } from "@/components/PassphraseGate";
import { SoundTest } from "@/components/SoundTest";
import { StatusBanner } from "@/components/StatusBanner";
import { isMicLive } from "@/lib/call/status";
import { useCallSession } from "@/lib/call/useCallSession";
import type { HomePresence } from "@/lib/call/types";

const HOME_PRESENCE_TEXT: Record<HomePresence, string> = {
  waiting: "待機中（呼び出せます）",
  "in-call": "通話中",
  offline: "待機していません",
};

export default function ParentPage() {
  // 合言葉を確かめてから中身を動かす。
  // （確かめる前に通話のしくみを動かさないよう、中身は別の部品にしてある）
  return (
    <PassphraseGate>
      <ParentScreen />
    </PassphraseGate>
  );
}

function ParentScreen() {
  const session = useCallSession("parent");
  const { start } = session;

  // 画面を開いたらすぐ、自宅パソコンの状況を見にいく
  useEffect(() => {
    start();
  }, [start]);

  return (
    <main className="page">
      <h1 className="page-title">見守り通話（親用）</h1>
      <p className="page-lead">自宅のパソコンに話しかけます。会話は録音されません。</p>

      <div className="card">
        <StatusBanner phase={session.phase} errorCode={session.errorCode} />
      </div>

      <div className="card">
        <p className="section-title">自宅のパソコン</p>
        <p className="status-description">{HOME_PRESENCE_TEXT[session.homePresence]}</p>
      </div>

      {session.audioBlocked ? (
        <div className="card">
          <button type="button" className="btn btn-primary" onClick={session.unblockAudio}>
            タップして相手の声を出す
          </button>
          <p className="note">
            ※ iPhone が音の再生を止めています。上のボタンを押すと相手の声が聞こえます。
          </p>
        </div>
      ) : null}

      <div className="card">
        <MicIndicator live={isMicLive(session.phase)} level={session.micLevel} />
        <div style={{ marginTop: 16 }}>
          <CallControls
            phase={session.phase}
            onConnect={session.connect}
            onHangUp={session.hangUp}
          />
        </div>
        <p className="note">※ 「接続する」を押すとマイクを使います。会話は録音されません。</p>
      </div>

      <div className="card">
        <p className="section-title">音が聞こえないときは</p>
        <SoundTest />
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
    </main>
  );
}

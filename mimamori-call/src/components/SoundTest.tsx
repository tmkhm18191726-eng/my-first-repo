"use client";

import { useRef, useState } from "react";
import { ensureAudioContext, playChime } from "@/lib/call/media";

/**
 * 「このパソコンから音が出せるか」だけを確かめるボタン。
 *
 * 通話がつながっているのに音が聞こえないとき、原因が
 * 「パソコン側の音の設定」なのか「通話の中身」なのかを切り分けるために使う。
 */
export function SoundTest() {
  const contextRef = useRef<AudioContext | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const test = () => {
    try {
      const context = ensureAudioContext(contextRef.current);
      contextRef.current = context;
      playChime(context);

      // 少し待ってから状態を見る（resume が効くまで一瞬かかるため）
      window.setTimeout(() => {
        const state = context.state;
        if (state === "running") {
          setResult(
            "チャイムを鳴らしました。聞こえない場合は、Windows の音量と、" +
              "音の出力先（イヤホン／スピーカー）を確認してください。",
          );
        } else {
          setResult(
            `ブラウザが音を止めています（状態: ${state}）。` +
              "画面のどこかを一度クリックしてから、もう一度お試しください。",
          );
        }
      }, 300);
    } catch {
      setResult("音を鳴らせませんでした。ブラウザを再読み込みしてお試しください。");
    }
  };

  return (
    <>
      <button type="button" className="btn btn-quiet" onClick={test}>
        🔊 音が出るかテストする
      </button>
      {result ? <p className="note">{result}</p> : null}
      <p className="note">
        ※ イヤホンを後から挿した場合は、画面を再読み込み（F5）してからお試しください。
        挿す前に開いた画面は、古い出力先のまま音を出そうとすることがあります。
      </p>
    </>
  );
}

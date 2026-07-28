"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SignalingClient, type SignalingState } from "./signaling";
import type { CallErrorCode, CallPhase } from "./status";
import { AUDIO_ONLY, type CallRole, type HomePresence, type ServerMessage } from "./types";

/**
 * 通話の進行を1か所でまとめて管理する。
 * 親用の画面と自宅PC用の画面は、どちらもこれを使う。
 *
 * ステップ1-2 の時点では「相手を見つけて呼び出す」ところまで。
 * ステップ1-3 で、ここに実際の音声のやりとり（WebRTC）を足す。
 */

export type CallSession = {
  phase: CallPhase;
  errorCode?: CallErrorCode;
  /** 自宅のパソコンが今どうしているか */
  homePresence: HomePresence;
  /** 親のスマホがつながっているか（自宅PCの画面で使う） */
  parentOnline: boolean;
  /** つなぎ役サーバーとつながっているか */
  signalingState: SignalingState;
  /** マイクが拾っている音の大きさ 0〜1（ステップ1-3 から実際の値が入る） */
  micLevel: number;
  /** 待機や接続を始める */
  start: () => void;
  /** 親が自宅PCを呼び出す */
  connect: () => void;
  /** 通話を終える（待機は続ける） */
  hangUp: () => void;
  /** 待機そのものをやめる */
  stop: () => void;
};

/** 自宅PCで「通話を終了しました」を表示しておく時間（ミリ秒）。この後は待機表示に戻る。 */
const ENDED_DISPLAY_MS = 5000;

/** サーバーから届いたエラーを、画面に出す日本語の種類に変換する。 */
function toErrorCode(code: string): CallErrorCode {
  switch (code) {
    case "peer-offline":
      return "peer-offline";
    case "role-taken":
      return "role-taken";
    case "unauthorized":
      return "auth";
    default:
      return "unknown";
  }
}

export function useCallSession(role: CallRole): CallSession {
  const [active, setActive] = useState(false);
  const [signalingState, setSignalingState] = useState<SignalingState>("closed");
  const [homePresence, setHomePresence] = useState<HomePresence>("offline");
  const [parentOnline, setParentOnline] = useState(false);
  /** 相手の状況がまだ一度も届いていない間は、判断を保留する */
  const [presenceKnown, setPresenceKnown] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [calling, setCalling] = useState(false);
  const [ended, setEnded] = useState(false);
  const [errorCode, setErrorCode] = useState<CallErrorCode | undefined>(undefined);
  const [micLevel] = useState(0);

  const clientRef = useRef<SignalingClient | null>(null);
  /** 呼び出し中かどうかを、届いたメッセージの処理から参照するための控え */
  const callingRef = useRef(false);
  callingRef.current = calling;

  const handleMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.type) {
        case "presence":
          setHomePresence(message.home);
          setParentOnline(message.parentOnline);
          setPresenceKnown(true);
          // 親側：呼び出しに自宅PCが応答した
          if (role === "parent" && callingRef.current && message.home === "in-call") {
            setCalling(false);
            setInCall(true);
          }
          break;

        case "incoming":
          // 自宅PC側：親から呼び出しが来た。自動で応答する。
          // 気づかないうちに繋がらないよう、画面表示とチャイムで必ず知らせる。
          setEnded(false);
          setErrorCode(undefined);
          setInCall(true);
          break;

        case "bye":
          setInCall(false);
          setCalling(false);
          setEnded(true);
          break;

        case "error":
          setCalling(false);
          setInCall(false);
          setErrorCode(toErrorCode(message.code));
          break;

        // offer / answer / ice はステップ1-3 で使う
        default:
          break;
      }
    },
    [role],
  );

  // 接続の開始と後片付け
  useEffect(() => {
    if (!active) return;

    const client = new SignalingClient(role, {
      onState: setSignalingState,
      onMessage: handleMessage,
      onGiveUp: (reason) => {
        if (reason === "replaced") setErrorCode("role-taken");
      },
    });
    clientRef.current = client;
    client.connect();

    return () => {
      client.close();
      clientRef.current = null;
      setSignalingState("closed");
      setHomePresence("offline");
      setParentOnline(false);
      setPresenceKnown(false);
      setInCall(false);
      setCalling(false);
    };
  }, [active, role, handleMessage]);

  // 自宅PCでは「通話を終了しました」をしばらく見せてから、待機表示に戻す
  useEffect(() => {
    if (role !== "home" || !ended) return;
    const timer = setTimeout(() => setEnded(false), ENDED_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [ended, role]);

  const start = useCallback(() => {
    setErrorCode(undefined);
    setEnded(false);
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    if (inCall || calling) {
      clientRef.current?.send({ type: "bye", reason: "待機をやめました" });
    }
    setActive(false);
    setEnded(false);
    setErrorCode(undefined);
  }, [calling, inCall]);

  const connect = useCallback(() => {
    setErrorCode(undefined);
    setEnded(false);
    if (homePresence === "offline") {
      setErrorCode("peer-offline");
      return;
    }
    const sent = clientRef.current?.send({ type: "call", media: AUDIO_ONLY });
    if (!sent) {
      setErrorCode("network");
      return;
    }
    setCalling(true);
  }, [homePresence]);

  const hangUp = useCallback(() => {
    if (inCall || calling) {
      clientRef.current?.send({ type: "bye", reason: "通話を終了しました" });
    }
    setInCall(false);
    setCalling(false);
    setEnded(true);
  }, [calling, inCall]);

  const phase: CallPhase = useMemo(() => {
    if (errorCode) return "error";
    if (!active) return "idle";
    if (signalingState !== "open" || !presenceKnown) return "connecting";
    if (inCall) return "in-call";
    if (calling) return "calling";
    // 親側は、自宅PCが待機していないと呼び出せない。
    // 「通話を終了しました」より、こちらを先に知らせる。
    if (role === "parent" && homePresence === "offline") return "error";
    if (ended) return "ended";
    return "waiting";
  }, [active, calling, ended, errorCode, homePresence, inCall, presenceKnown, role, signalingState]);

  const resolvedErrorCode: CallErrorCode | undefined = useMemo(() => {
    if (errorCode) return errorCode;
    // 親側で自宅PCが待機していない場合
    if (phase === "error") return "peer-offline";
    return undefined;
  }, [errorCode, phase]);

  return {
    phase,
    errorCode: resolvedErrorCode,
    homePresence,
    parentOnline,
    signalingState,
    micLevel,
    start,
    connect,
    hangUp,
    stop,
  };
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  checkMicrophone,
  ensureAudioContext,
  getLocalMedia,
  MicError,
  playChime,
  startLevelMeter,
  stopStream,
} from "./media";
import { CallPeer } from "./peer";
import { SignalingClient, type SignalingState } from "./signaling";
import type { CallErrorCode, CallPhase } from "./status";
import { AUDIO_ONLY, type CallRole, type HomePresence, type ServerMessage } from "./types";

/**
 * 通話の進行を1か所でまとめて管理する。
 * 親用の画面と自宅PC用の画面は、どちらもこれを使う。
 *
 * 流れ：
 *   親が「接続する」→ マイクを借りる → 呼び出しを送る
 *   自宅PCが呼び出しを受け取る → チャイムを鳴らす → マイクを借りて接続情報を送る
 *   親が返事を返す → 音声がつながる
 *
 * 声は端末どうしを直接流れる。サーバーには渡らず、録音も保存もしない。
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
  /** マイクが拾っている音の大きさ 0〜1 */
  micLevel: number;
  /**
   * 相手の声を鳴らすのをブラウザが止めている状態。
   * iPhone で起きることがあるので、そのときは画面をタップしてもらう。
   */
  audioBlocked: boolean;
  /** 上の状態のときに、利用者のタップで音を鳴らし直す */
  unblockAudio: () => void;
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

/** 接続に手間取ったとき、あきらめてエラーを出すまでの時間（ミリ秒）。 */
const CONNECT_TIMEOUT_MS = 30000;

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
  const [connected, setConnected] = useState(false);
  /** 呼び出し中、または音声の通り道を作っている最中 */
  const [negotiating, setNegotiating] = useState(false);
  const [calling, setCalling] = useState(false);
  const [ended, setEnded] = useState(false);
  const [errorCode, setErrorCode] = useState<CallErrorCode | undefined>(undefined);
  const [micLevel, setMicLevel] = useState(0);
  const [audioBlocked, setAudioBlocked] = useState(false);

  const clientRef = useRef<SignalingClient | null>(null);
  const peerRef = useRef<CallPeer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const stopMeterRef = useRef<(() => void) | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** 相手の声を鳴らすための、画面には出ない音声プレーヤー。 */
  const remoteAudio = useCallback((): HTMLAudioElement => {
    if (!remoteAudioRef.current) {
      const el = document.createElement("audio");
      el.autoplay = true;
      // ブラウザ側で音量が絞られたままにならないよう、明示的に最大にする
      el.volume = 1;
      // iPhone で全画面プレーヤーに切り替わらないようにする
      el.setAttribute("playsinline", "");
      el.style.display = "none";
      document.body.appendChild(el);
      remoteAudioRef.current = el;
    }
    return remoteAudioRef.current;
  }, []);

  /** 通話に使っていたものを片づける。待機そのものは続く。 */
  const teardownCall = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    stopMeterRef.current?.();
    stopMeterRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    stopStream(localStreamRef.current);
    localStreamRef.current = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    setMicLevel(0);
    setConnected(false);
    setNegotiating(false);
    setCalling(false);
    setAudioBlocked(false);
  }, []);

  /** 音が出ないとき、利用者のタップで鳴らし直す。 */
  const unblockAudio = useCallback(() => {
    audioContextRef.current = ensureAudioContext(audioContextRef.current);
    void remoteAudioRef.current
      ?.play()
      .then(() => setAudioBlocked(false))
      .catch(() => setAudioBlocked(true));
  }, []);

  /** 接続に時間がかかりすぎたときのための見張り。 */
  const armTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      teardownCall();
      setErrorCode("connect-failed");
      clientRef.current?.send({ type: "bye", reason: "接続できませんでした" });
    }, CONNECT_TIMEOUT_MS);
  }, [teardownCall]);

  /** マイクを借りて、音量メーターを動かし、通話の相手役を用意する。 */
  const createPeer = useCallback(async (): Promise<CallPeer> => {
    const stream = await getLocalMedia(AUDIO_ONLY);
    localStreamRef.current = stream;

    const context = ensureAudioContext(audioContextRef.current);
    audioContextRef.current = context;
    stopMeterRef.current = startLevelMeter(context, stream, setMicLevel);

    const peer = new CallPeer(AUDIO_ONLY, {
      onIceCandidate: (candidate) => {
        clientRef.current?.send({ type: "ice", candidate });
      },
      onRemoteStream: (remote) => {
        const el = remoteAudio();
        el.srcObject = remote;
        void el
          .play()
          .then(() => setAudioBlocked(false))
          // iPhone がまれに自動再生を止めることがある。
          // そのときは画面に「タップして音を出す」を出す。
          .catch(() => setAudioBlocked(true));
      },
      onStateChange: (state) => {
        if (state === "connected") {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setNegotiating(false);
          setCalling(false);
          setConnected(true);
          setEnded(false);
        } else if (state === "failed") {
          teardownCall();
          setErrorCode("connect-failed");
        } else if (state === "closed") {
          setConnected(false);
        }
        // "disconnected" は電波が一瞬途切れただけで戻ることが多いので、
        // すぐには通話中の表示を消さない
      },
    });
    peer.addLocalStream(stream);
    peerRef.current = peer;
    return peer;
  }, [remoteAudio, teardownCall]);

  const handleMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.type) {
        case "presence":
          setHomePresence(message.home);
          setParentOnline(message.parentOnline);
          setPresenceKnown(true);
          break;

        case "incoming": {
          // 自宅PC側：親から呼び出しが来た。自動で応答する。
          // 気づかないうちに繋がらないよう、チャイムと全画面表示で必ず知らせる。
          setEnded(false);
          setErrorCode(undefined);
          setNegotiating(true);
          armTimeout();

          const context = ensureAudioContext(audioContextRef.current);
          audioContextRef.current = context;
          playChime(context);

          void (async () => {
            try {
              const peer = await createPeer();
              const sdp = await peer.createOffer();
              clientRef.current?.send({ type: "offer", sdp });
            } catch (error) {
              teardownCall();
              setErrorCode(error instanceof MicError ? error.code : "unknown");
              clientRef.current?.send({ type: "bye", reason: "応答できませんでした" });
            }
          })();
          return;
        }

        case "offer": {
          // 親側：自宅PCから接続情報が届いた。返事を返す。
          setNegotiating(true);
          armTimeout();
          void (async () => {
            try {
              const peer = peerRef.current ?? (await createPeer());
              const sdp = await peer.acceptOffer(message.sdp);
              clientRef.current?.send({ type: "answer", sdp });
            } catch (error) {
              teardownCall();
              setErrorCode(error instanceof MicError ? error.code : "unknown");
              clientRef.current?.send({ type: "bye", reason: "応答できませんでした" });
            }
          })();
          return;
        }

        case "answer":
          void peerRef.current?.acceptAnswer(message.sdp).catch(() => {
            teardownCall();
            setErrorCode("connect-failed");
          });
          return;

        case "ice":
          void peerRef.current?.addIceCandidate(message.candidate);
          return;

        case "bye":
          teardownCall();
          setEnded(true);
          return;

        case "error":
          teardownCall();
          setErrorCode(toErrorCode(message.code));
          return;

        default:
          return;
      }
    },
    [armTimeout, createPeer, teardownCall],
  );

  // つなぎ役サーバーへの接続の開始と後片付け
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
    };
  }, [active, role, handleMessage]);

  // 画面を閉じるときは、必ずマイクを手放す
  useEffect(() => {
    return () => {
      teardownCall();
      remoteAudioRef.current?.remove();
      remoteAudioRef.current = null;
      void audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
    };
  }, [teardownCall]);

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

    // ボタンを押したこの流れの中で、音を出す準備とマイクの許可を済ませておく。
    audioContextRef.current = ensureAudioContext(audioContextRef.current);

    if (role === "home") {
      // 着信時に許可を聞かれて出られない、という事態を防ぐための事前確認。
      // 確認できたらマイクはすぐ手放すので、待機中にマイクは入らない。
      void checkMicrophone().catch((error: unknown) => {
        setErrorCode(error instanceof MicError ? error.code : "unknown");
        // マイクが使えないなら着信しても応答できない。
        // 待機をやめて、親の画面に「待機していません」と出るようにする。
        setActive(false);
      });
    }
  }, [role]);

  const stop = useCallback(() => {
    if (connected || negotiating || calling) {
      clientRef.current?.send({ type: "bye", reason: "待機をやめました" });
    }
    teardownCall();
    setActive(false);
    setEnded(false);
    setErrorCode(undefined);
  }, [calling, connected, negotiating, teardownCall]);

  const connect = useCallback(() => {
    setErrorCode(undefined);
    setEnded(false);
    if (homePresence === "offline") {
      setErrorCode("peer-offline");
      return;
    }

    // iPhone は、ボタンを押したこの流れの中でマイクを借りないと音が出せない
    audioContextRef.current = ensureAudioContext(audioContextRef.current);
    setCalling(true);
    armTimeout();

    void (async () => {
      try {
        await createPeer();
        const sent = clientRef.current?.send({ type: "call", media: AUDIO_ONLY });
        if (!sent) {
          teardownCall();
          setErrorCode("network");
        }
      } catch (error) {
        teardownCall();
        setErrorCode(error instanceof MicError ? error.code : "unknown");
      }
    })();
  }, [armTimeout, createPeer, homePresence, teardownCall]);

  const hangUp = useCallback(() => {
    if (connected || negotiating || calling) {
      clientRef.current?.send({ type: "bye", reason: "通話を終了しました" });
    }
    teardownCall();
    setEnded(true);
  }, [calling, connected, negotiating, teardownCall]);

  const phase: CallPhase = useMemo(() => {
    if (errorCode) return "error";
    if (!active) return "idle";
    if (signalingState !== "open" || !presenceKnown) return "connecting";
    if (connected) return "in-call";
    if (negotiating) return "negotiating";
    if (calling) return "calling";
    // 親側は、自宅PCが待機していないと呼び出せない。
    // 「通話を終了しました」より、こちらを先に知らせる。
    if (role === "parent" && homePresence === "offline") return "error";
    if (ended) return "ended";
    return "waiting";
  }, [
    active,
    calling,
    connected,
    ended,
    errorCode,
    homePresence,
    negotiating,
    presenceKnown,
    role,
    signalingState,
  ]);

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
    audioBlocked,
    unblockAudio,
    start,
    connect,
    hangUp,
    stop,
  };
}

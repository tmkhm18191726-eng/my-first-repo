/**
 * 親のスマホと自宅PCが、つなぎ役サーバー越しにやりとりする「合図」の型。
 * 音声そのものはここを通らない。通るのは「どこに繋げばよいか」の情報だけ。
 *
 * 映像通話を後から足せるよう、offer / answer は再交渉（renegotiation）を
 * 前提とした形にしてある（何度でも送り直してよい）。
 */

/** どちらの端末か。home = 自宅のWindows PC、parent = 親のスマホ。 */
export type CallRole = "home" | "parent";

/** 自宅PCが今どうしているか。親の画面で「接続できるか」の判定に使う。 */
export type HomePresence = "waiting" | "in-call" | "offline";

/** 通話で使うメディアの種類。将来 video を true にすれば映像通話になる。 */
export type MediaConfig = {
  audio: boolean;
  video: boolean;
};

export const AUDIO_ONLY: MediaConfig = { audio: true, video: false };

/**
 * WebRTC の経路候補。
 * ブラウザの IceCandidateInit と同じ形だが、この型定義はサーバー側
 * （ブラウザの型を持たない Cloudflare Workers）からも使うので、自前で定義する。
 */
export type IceCandidateInit = {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
};

/**
 * クライアント → サーバー
 * 自分がどちらの端末かは、接続するときのアドレス（?role=home / ?role=parent）で伝える。
 */
export type ClientMessage =
  /** 親が自宅PCを呼び出す */
  | { type: "call"; media: MediaConfig }
  /** WebRTC の接続情報（SDP） */
  | { type: "offer"; sdp: string }
  | { type: "answer"; sdp: string }
  /** WebRTC の経路候補（ICE） */
  | { type: "ice"; candidate: IceCandidateInit }
  /** 通話終了 */
  | { type: "bye"; reason?: string }
  /** 接続維持の確認 */
  | { type: "ping" };

/** サーバー → クライアント */
export type ServerMessage =
  /** 接続を受け付けた */
  | { type: "welcome"; role: CallRole }
  /** 相手の在席状況。接続直後と、状況が変わるたびに届く */
  | { type: "presence"; home: HomePresence; parentOnline: boolean }
  /** 親から呼び出しが来た（自宅PC が受け取る） */
  | { type: "incoming"; media: MediaConfig }
  | { type: "offer"; sdp: string }
  | { type: "answer"; sdp: string }
  | { type: "ice"; candidate: IceCandidateInit }
  | { type: "bye"; reason?: string }
  | { type: "pong" }
  /** サーバー側で問題が起きた。code は日本語文言の切り替えに使う。 */
  | { type: "error"; code: ServerErrorCode; message: string };

export type ServerErrorCode =
  | "peer-offline"
  | "role-taken"
  | "unauthorized"
  | "bad-request"
  | "internal";

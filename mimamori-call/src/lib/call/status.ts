/**
 * 通話の状態と、画面に出す日本語の文言をまとめて管理する。
 * 画面ごとに文言がばらけないよう、日本語はすべてこのファイルに集約する。
 */

export type CallPhase =
  /** まだ何も始めていない（自宅PC：待機開始前 ／ 親：接続前） */
  | "idle"
  /** つなぎ役サーバーへ接続しにいっている */
  | "connecting"
  /** 自宅PC＝着信待ち ／ 親＝自宅PCが待機中なので接続できる */
  | "waiting"
  /** 親が「接続」を押して相手を呼び出している */
  | "calling"
  /** 相手が見つかり、音声の経路を作っている */
  | "negotiating"
  /** 通話中 */
  | "in-call"
  /** 通話が終わった */
  | "ended"
  /** 何か問題が起きた */
  | "error";

export type CallErrorCode =
  | "mic-permission"
  | "mic-missing"
  | "insecure-context"
  | "network"
  | "peer-offline"
  | "auth"
  | "connect-failed"
  | "unknown";

/** 画面の色づかい。緑＝通話中、青＝待機中、赤＝異常、灰＝停止中。 */
export type StatusTone = "neutral" | "info" | "active" | "danger";

export type StatusText = {
  /** 大きく出す一言 */
  label: string;
  /** その下に出す説明。今どうなっているか／次に何をすればよいか */
  description: string;
  tone: StatusTone;
};

const PHASE_TEXT: Record<CallPhase, StatusText> = {
  idle: {
    label: "停止中",
    description: "まだ待機していません。",
    tone: "neutral",
  },
  connecting: {
    label: "準備中…",
    description: "つなぎ役サーバーに接続しています。しばらくお待ちください。",
    tone: "info",
  },
  waiting: {
    label: "待機中",
    description: "着信を待っています。このまま画面を開いたままにしてください。",
    tone: "info",
  },
  calling: {
    label: "呼び出し中…",
    description: "自宅のパソコンを呼び出しています。",
    tone: "info",
  },
  negotiating: {
    label: "接続中…",
    description: "音声の通り道を作っています。あと少しお待ちください。",
    tone: "info",
  },
  "in-call": {
    label: "通話中",
    description: "マイクが入っています。話しかけてください。",
    tone: "active",
  },
  ended: {
    label: "通話を終了しました",
    description: "通話は切断されました。もう一度話すには、あらためて接続してください。",
    tone: "neutral",
  },
  error: {
    label: "エラー",
    description: "問題が発生しました。",
    tone: "danger",
  },
};

const ERROR_TEXT: Record<CallErrorCode, StatusText> = {
  "mic-permission": {
    label: "マイクを使えません",
    description:
      "ブラウザからマイクの使用が許可されていません。アドレスバーの左側にある鍵マークからマイクを「許可」にして、画面を再読み込みしてください。",
    tone: "danger",
  },
  "mic-missing": {
    label: "マイクが見つかりません",
    description:
      "この端末にマイクが接続されていません。内蔵マイクが無効になっていないか、Windows の「設定 → システム → サウンド」で確認してください。",
    tone: "danger",
  },
  "insecure-context": {
    label: "安全な接続ではありません",
    description:
      "マイクを使うには https:// で始まるアドレスが必要です。README の「iPhone からつなぐ」の手順に従って接続してください。",
    tone: "danger",
  },
  network: {
    label: "ネットワークに接続できません",
    description:
      "インターネットに接続できていない可能性があります。Wi-Fi や電波の状態を確認してから、もう一度お試しください。",
    tone: "danger",
  },
  "peer-offline": {
    label: "自宅のパソコンが待機していません",
    description:
      "自宅のパソコンで見守り通話の画面を開き、「待機開始」を押してもらってください。",
    tone: "danger",
  },
  auth: {
    label: "認証が必要です",
    description: "ログインの有効期限が切れています。画面を再読み込みしてログインし直してください。",
    tone: "danger",
  },
  "connect-failed": {
    label: "接続に失敗しました",
    description:
      "回線の制限で直接つながらなかった可能性があります。時間をおいて、または別の回線（Wi-Fi ↔ 携帯回線）でお試しください。",
    tone: "danger",
  },
  unknown: {
    label: "エラーが発生しました",
    description: "原因が分かりませんでした。画面を再読み込みして、もう一度お試しください。",
    tone: "danger",
  },
};

/** 現在の状態から、画面に表示する日本語を組み立てる。 */
export function statusText(phase: CallPhase, errorCode?: CallErrorCode): StatusText {
  if (phase === "error") {
    return ERROR_TEXT[errorCode ?? "unknown"];
  }
  return PHASE_TEXT[phase];
}

/**
 * マイクが実際に入っている状態かどうか。マイク使用中表示の判定に使う。
 * 待機中（waiting）はマイクを掴まない設計なので、ここには含めない。
 */
export function isMicLive(phase: CallPhase): boolean {
  return phase === "calling" || phase === "negotiating" || phase === "in-call";
}

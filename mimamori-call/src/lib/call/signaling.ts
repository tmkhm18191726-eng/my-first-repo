import { loadSecret } from "./room";
import type { CallRole, ClientMessage, ServerMessage } from "./types";

/**
 * つなぎ役サーバー（Cloudflare Workers）との WebSocket 接続。
 *
 * 自宅のパソコンは一日中つないだままにするので、
 * 回線が一時的に切れても自動でつなぎ直すようにしてある。
 */

export type SignalingState = "closed" | "connecting" | "open";

/** この番号で切られたときは「別の端末が同じ役割で接続した」ことを意味する（つなぎ直さない）。 */
export const CLOSE_REPLACED = 4000;

/** つなぎ直すまでの待ち時間（ミリ秒）。回数が増えるほど間隔を空ける。 */
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 15000, 30000];

/** 接続が生きているか確かめる間隔。途中の機器に切られるのを防ぐ。 */
const PING_INTERVAL = 25000;

/**
 * つなぎ役サーバーのアドレスを決める。
 *
 * 1. `NEXT_PUBLIC_SIGNAL_URL` が設定されていればそれを使う
 * 2. 手元の開発中（localhost:3000）なら、別ポートで動いているサーバー（8787）へ
 * 3. それ以外は、画面を配っているのと同じ場所の `/ws` へ
 */
export function signalUrl(role: CallRole): string {
  const base = (() => {
    const configured = process.env.NEXT_PUBLIC_SIGNAL_URL;
    if (configured) return configured.replace(/\/$/, "");

    const { protocol, hostname, port } = window.location;
    if (port === "3000" && (hostname === "localhost" || hostname === "127.0.0.1")) {
      return `ws://${hostname}:8787`;
    }
    const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${window.location.host}`;
  })();

  const url = new URL(`${base}/ws`);
  url.searchParams.set("role", role);
  const secret = loadSecret();
  if (secret) url.searchParams.set("secret", secret);
  return url.toString();
}

export type SignalingHandlers = {
  onState?: (state: SignalingState) => void;
  onMessage?: (message: ServerMessage) => void;
  /** つなぎ直しをあきらめた（もう自動では復帰しない）ときに呼ばれる */
  onGiveUp?: (reason: "replaced") => void;
};

export class SignalingClient {
  private ws: WebSocket | null = null;
  private retryCount = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  /** close() を呼んだあとに、うっかりつなぎ直さないための印 */
  private stopped = false;

  constructor(
    private readonly role: CallRole,
    private readonly handlers: SignalingHandlers = {},
  ) {}

  connect(): void {
    this.stopped = false;
    this.openSocket();
  }

  /** 意図的に切る。以後は自動でつなぎ直さない。 */
  close(): void {
    this.stopped = true;
    this.clearTimers();
    const ws = this.ws;
    this.ws = null;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close(1000, "利用者が終了しました");
    }
    this.handlers.onState?.("closed");
  }

  send(message: ClientMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(message));
    return true;
  }

  get isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ---- ここから下は内部処理 ----

  private openSocket(): void {
    if (this.stopped) return;

    this.handlers.onState?.("connecting");

    let ws: WebSocket;
    try {
      ws = new WebSocket(signalUrl(this.role));
    } catch {
      // アドレスが不正な場合など。少し待ってからやり直す。
      this.scheduleRetry();
      return;
    }
    this.ws = ws;

    ws.addEventListener("open", () => {
      if (this.ws !== ws) return;
      this.retryCount = 0;
      this.handlers.onState?.("open");
      this.startPing();
    });

    ws.addEventListener("message", (event) => {
      if (this.ws !== ws || typeof event.data !== "string") return;
      try {
        this.handlers.onMessage?.(JSON.parse(event.data) as ServerMessage);
      } catch {
        // 読み取れないデータは捨てる
      }
    });

    ws.addEventListener("close", (event) => {
      if (this.ws !== ws) return;
      this.ws = null;
      this.stopPing();
      this.handlers.onState?.("closed");

      if (this.stopped) return;

      if (event.code === CLOSE_REPLACED) {
        // 同じ役割で別の端末がつないだ。つなぎ直すと取り合いになるのでやめる。
        this.stopped = true;
        this.handlers.onGiveUp?.("replaced");
        return;
      }

      this.scheduleRetry();
    });

    ws.addEventListener("error", () => {
      // 詳細は取れない。close が続けて発生するので、そちらで処理する。
    });
  }

  private scheduleRetry(): void {
    if (this.stopped || this.retryTimer) return;
    const delay = RETRY_DELAYS[Math.min(this.retryCount, RETRY_DELAYS.length - 1)];
    this.retryCount += 1;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.openSocket();
    }, delay);
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.send({ type: "ping" });
    }, PING_INTERVAL);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private clearTimers(): void {
    this.stopPing();
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }
}

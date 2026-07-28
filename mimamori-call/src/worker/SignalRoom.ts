import { DurableObject } from "cloudflare:workers";
import type {
  CallRole,
  ClientMessage,
  HomePresence,
  ServerErrorCode,
  ServerMessage,
} from "../lib/call/types";

/**
 * 親のスマホと自宅PCを引き合わせる「つなぎ役」。
 *
 * ここを通るのは「どこに繋げばよいか」の合図だけで、音声そのものは通らない。
 * 音声は端末どうしが直接やりとりするので、この部屋には会話は一切残らない。
 *
 * 家ごとに1つの部屋を使う（今は "family" という1部屋のみ）。
 */

/** WebSocket 1本ごとに覚えておく情報。休眠から復帰しても読めるよう、接続に貼り付けて保存する。 */
type SocketInfo = {
  role: CallRole;
  /** 通話がつながっている最中か */
  inCall: boolean;
};

const CLOSE_REPLACED = 4000;

export class SignalRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // 接続確認（ping）には自動で返事をする。
    // こうしておくと、待機中の自宅PCのために部屋を起こし続けなくて済む。
    ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair(
        JSON.stringify({ type: "ping" }),
        JSON.stringify({ type: "pong" }),
      ),
    );
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const role = url.searchParams.get("role");

    if (role !== "home" && role !== "parent") {
      return new Response("role には home か parent を指定してください。", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // 同じ役割の古い接続が残っていたら閉じる。
    // （画面を再読み込みしたときに、古い接続が残って繋がらなくなるのを防ぐ）
    for (const existing of this.ctx.getWebSockets(role)) {
      try {
        existing.close(CLOSE_REPLACED, "別の端末が同じ役割で接続しました");
      } catch {
        // すでに閉じている場合は無視してよい
      }
    }

    // 休眠対応の受け入れ方。待機中は課金対象の稼働時間を消費しない。
    this.ctx.acceptWebSocket(server, [role]);
    const info: SocketInfo = { role, inCall: false };
    server.serializeAttachment(info);

    this.send(server, { type: "welcome", role });
    this.broadcastPresence();

    return new Response(null, { status: 101, webSocket: client });
  }

  override async webSocketMessage(ws: WebSocket, raw: ArrayBuffer | string): Promise<void> {
    if (typeof raw !== "string") {
      return this.sendError(ws, "bad-request", "文字列以外のデータは受け付けません。");
    }

    const info = this.infoOf(ws);
    if (!info) {
      return this.sendError(ws, "internal", "接続の情報が見つかりませんでした。");
    }

    let message: ClientMessage;
    try {
      message = JSON.parse(raw) as ClientMessage;
    } catch {
      return this.sendError(ws, "bad-request", "読み取れない形式のデータでした。");
    }

    switch (message.type) {
      case "ping":
        // 自動返信が効かなかった場合の予備
        return this.send(ws, { type: "pong" });

      case "call": {
        if (info.role !== "parent") {
          return this.sendError(ws, "bad-request", "呼び出しは親側からのみ行えます。");
        }
        const home = this.socketOf("home");
        if (!home) {
          return this.sendError(ws, "peer-offline", "自宅のパソコンが待機していません。");
        }
        this.setInCall(ws, true);
        this.setInCall(home, true);
        this.send(home, { type: "incoming", media: message.media });
        this.broadcastPresence();
        return;
      }

      case "offer":
      case "answer":
      case "ice": {
        // WebRTC の合図は、そのまま相手へ渡すだけ。中身は見ないし残さない。
        const peer = this.socketOf(info.role === "home" ? "parent" : "home");
        if (!peer) {
          return this.sendError(ws, "peer-offline", "相手の端末が接続していません。");
        }
        this.send(peer, message as ServerMessage);
        return;
      }

      case "bye": {
        const peer = this.socketOf(info.role === "home" ? "parent" : "home");
        this.setInCall(ws, false);
        if (peer) {
          this.setInCall(peer, false);
          this.send(peer, { type: "bye", reason: message.reason });
        }
        this.broadcastPresence();
        return;
      }

      default:
        return this.sendError(ws, "bad-request", "知らない種類のデータでした。");
    }
  }

  override async webSocketClose(ws: WebSocket): Promise<void> {
    const info = this.infoOf(ws);
    // 通話中の相手が消えたら、残っている側にも通話終了を伝える
    if (info?.inCall) {
      const peer = this.socketOf(info.role === "home" ? "parent" : "home");
      if (peer) {
        this.setInCall(peer, false);
        this.send(peer, { type: "bye", reason: "相手の接続が切れました" });
      }
    }
    this.broadcastPresence();
  }

  override async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }

  // ---- ここから下は補助 ----

  private infoOf(ws: WebSocket): SocketInfo | null {
    const raw = ws.deserializeAttachment() as SocketInfo | null;
    return raw ?? null;
  }

  /** その役割で今つながっている接続を1本返す（なければ null）。 */
  private socketOf(role: CallRole): WebSocket | null {
    for (const ws of this.ctx.getWebSockets(role)) {
      if (ws.readyState === WebSocket.OPEN) return ws;
    }
    return null;
  }

  private setInCall(ws: WebSocket, inCall: boolean): void {
    const info = this.infoOf(ws);
    if (!info) return;
    ws.serializeAttachment({ ...info, inCall });
  }

  private send(ws: WebSocket, message: ServerMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch {
      // 送信中に切れた場合。次の presence 更新で状態が揃うので無視してよい。
    }
  }

  private sendError(ws: WebSocket, code: ServerErrorCode, message: string): void {
    this.send(ws, { type: "error", code, message });
  }

  /** 誰が今つながっているかを、つながっている全員に知らせる。 */
  private broadcastPresence(): void {
    const home = this.socketOf("home");
    const parent = this.socketOf("parent");

    const homePresence: HomePresence = !home
      ? "offline"
      : this.infoOf(home)?.inCall
        ? "in-call"
        : "waiting";

    const presence: ServerMessage = {
      type: "presence",
      home: homePresence,
      parentOnline: parent !== null,
    };

    for (const ws of this.ctx.getWebSockets()) {
      this.send(ws, presence);
    }
  }
}

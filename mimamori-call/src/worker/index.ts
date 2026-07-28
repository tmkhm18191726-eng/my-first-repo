import { SignalRoom } from "./SignalRoom";

export { SignalRoom };

/**
 * Cloudflare Workers の入口。
 *
 * - `/ws` … 親のスマホと自宅PCをつなぐ WebSocket。SignalRoom（つなぎ役）へ渡す。
 * - `/health` … 動いているかの確認用。
 *
 * フェーズ2で Next.js の画面配信を同じ Worker にまとめる予定。
 * それまでは画面は `npm run dev`（別ポート）で動かす。
 */

/** 家ごとの部屋の名前。今は1家庭なので固定。 */
const ROOM_NAME = "family";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response("ok", { headers: { "content-type": "text/plain; charset=utf-8" } });
    }

    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("WebSocket でのみ接続できます。", { status: 426 });
      }
      const id = env.SIGNAL_ROOM.idFromName(ROOM_NAME);
      return env.SIGNAL_ROOM.get(id).fetch(request);
    }

    return new Response("見つかりませんでした。", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

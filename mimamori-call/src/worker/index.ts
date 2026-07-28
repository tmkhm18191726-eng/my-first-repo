import { SignalRoom } from "./SignalRoom";

export { SignalRoom };

/**
 * Cloudflare Workers の入口。
 *
 * - `/ws`        … 親のスマホと自宅PCをつなぐ WebSocket。SignalRoom（つなぎ役）へ渡す。
 * - `/api/room`  … 合言葉が必要かどうか／その合言葉が正しいかを答える。
 * - `/health`    … 動いているかの確認用。
 * - それ以外      … 画面のファイル（out フォルダ）を Cloudflare が自動で配る。
 */

/** 家ごとの部屋の名前。今は1家庭なので固定。 */
const ROOM_NAME = "family";

/** 手元の開発中だけ、別ポートで動いている画面からの問い合わせを許可する。 */
const DEV_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

/**
 * 合言葉を照合する。
 * 文字列の比較にかかる時間から中身を推測されないよう、最後まで比較する。
 */
function secretMatches(given: string, expected: string): boolean {
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

function requiredSecret(env: Env): string {
  return (env.ROOM_SECRET ?? "").trim();
}

function isAuthorized(url: URL, env: Env): boolean {
  const expected = requiredSecret(env);
  // 合言葉を設定していなければ、誰でも入れる（手元で試すとき用）
  if (!expected) return true;
  return secretMatches(url.searchParams.get("secret") ?? "", expected);
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  if (!DEV_ORIGINS.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response("ok", { headers: { "content-type": "text/plain; charset=utf-8" } });
    }

    if (url.pathname === "/api/room") {
      // 画面側が「合言葉を聞くべきか」を判断するために使う。
      // 答えるのは true / false だけで、合言葉そのものは絶対に返さない。
      return Response.json(
        { required: requiredSecret(env) !== "", ok: isAuthorized(url, env) },
        {
          headers: {
            "cache-control": "no-store",
            ...corsHeaders(request),
          },
        },
      );
    }

    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("WebSocket でのみ接続できます。", { status: 426 });
      }
      if (!isAuthorized(url, env)) {
        return new Response("合言葉が違います。", { status: 401 });
      }
      const id = env.SIGNAL_ROOM.idFromName(ROOM_NAME);
      return env.SIGNAL_ROOM.get(id).fetch(request);
    }

    return new Response("見つかりませんでした。", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

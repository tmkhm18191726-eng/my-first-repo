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

/**
 * 家の中からの接続（自分自身のパソコン）かどうか。
 * トンネル経由のアクセスはここに当てはまらない。
 */
function isLocalRequest(url: URL): boolean {
  return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
}

function isAuthorized(url: URL, env: Env): boolean {
  const expected = requiredSecret(env);
  if (expected) {
    return secretMatches(url.searchParams.get("secret") ?? "", expected);
  }
  // 合言葉が未設定のときは、家の中（同じパソコン）からだけ使える。
  // 合言葉なしでインターネットに公開されてしまう事故を防ぐため、
  // 外からの接続は入口で断る。
  return isLocalRequest(url);
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
      const secretSet = requiredSecret(env) !== "";
      return Response.json(
        {
          // 合言葉が未設定でも、外からの接続には「合言葉が必要」と答える。
          // （設定されていないので、実際には誰も入れない）
          required: secretSet || !isLocalRequest(url),
          ok: isAuthorized(url, env),
          /** 合言葉が未設定のまま外部に公開されている状態 */
          unconfigured: !secretSet && !isLocalRequest(url),
        },
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

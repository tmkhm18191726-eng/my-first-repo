/**
 * 家族だけが知っている「合言葉」の扱い。
 *
 * 秘密のアドレスを知っているだけでは繋げないようにするためのもの。
 * 合言葉が合っているかの判定は必ずサーバー側で行う（画面側の判定は見た目のためだけ）。
 *
 * フェーズ3で Cloudflare Access を入れたあとも、二重の守りとして残す。
 */

const STORAGE_KEY = "mimamori-call.secret";

/** つなぎ役サーバーの場所（http/https のほう）。 */
export function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SIGNAL_URL;
  if (configured) {
    return configured.replace(/^ws/, "http").replace(/\/$/, "");
  }
  const { protocol, hostname, port } = window.location;
  // 手元の開発中は、画面が 3000、つなぎ役が 8787 で動いている
  if (port === "3000" && (hostname === "localhost" || hostname === "127.0.0.1")) {
    return `http://${hostname}:8787`;
  }
  return `${protocol}//${window.location.host}`;
}

export function loadSecret(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    // プライベートブラウズなどで使えない場合
    return "";
  }
}

export function saveSecret(secret: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, secret);
  } catch {
    // 保存できなくても、その回の通話は続けられる
  }
}

export function clearSecret(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 何もしない
  }
}

export type RoomCheck = {
  /** この場所で合言葉が必要か */
  required: boolean;
  /** 今持っている合言葉で入れるか */
  ok: boolean;
  /** 合言葉が未設定のまま、外部に公開されている状態（誰も入れない） */
  unconfigured?: boolean;
};

/** 合言葉が必要か、そして合っているかをサーバーに尋ねる。 */
export async function checkRoom(secret: string): Promise<RoomCheck> {
  const url = new URL(`${apiOrigin()}/api/room`);
  if (secret) url.searchParams.set("secret", secret);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`確認できませんでした (${response.status})`);
  }
  return (await response.json()) as RoomCheck;
}

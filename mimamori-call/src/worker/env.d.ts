/**
 * wrangler が自動で作る型（worker-configuration.d.ts）に、
 * 秘密情報の項目を足すためのファイル。
 *
 * 値そのものはここには書きません。
 * 手元では .dev.vars、公開先では `npx wrangler secret put ROOM_SECRET` に入れます。
 */
interface Env {
  /**
   * 家族だけが知っている合言葉。
   * 設定すると、これを知らない人はつなぎ役サーバーに接続できなくなります。
   * 設定しなければ（空のまま）、合言葉なしで使えます（手元で試すとき用）。
   */
  ROOM_SECRET?: string;
}

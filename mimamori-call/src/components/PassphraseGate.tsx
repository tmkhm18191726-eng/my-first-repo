"use client";

import { useCallback, useEffect, useState } from "react";
import { checkRoom, clearSecret, loadSecret, saveSecret } from "@/lib/call/room";

type GateState = "checking" | "need-secret" | "ready" | "unreachable" | "unconfigured";

/**
 * 合言葉を確かめてから中身を見せる入口。
 *
 * アドレスを知っているだけでは通話に参加できないようにするためのもの。
 * 合言葉が設定されていない場合（手元で試しているときなど）は、何も聞かずに素通しする。
 */
export function PassphraseGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>("checking");
  const [input, setInput] = useState("");
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);

  const verify = useCallback(async (secret: string) => {
    const result = await checkRoom(secret);
    if (result.unconfigured) {
      // 合言葉を決めないまま外部に公開されている。誰も入れない状態。
      setState("unconfigured");
      return false;
    }
    if (!result.required || result.ok) {
      setState("ready");
      return true;
    }
    setState("need-secret");
    return false;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = loadSecret();
        const okay = await verify(stored);
        if (!okay && stored && !cancelled) {
          // 前に入れた合言葉が通らなくなっていたら、忘れて入れ直してもらう
          clearSecret();
        }
      } catch {
        if (!cancelled) setState("unreachable");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [verify]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = input.trim();
    if (!value || busy) return;
    setBusy(true);
    setWrong(false);
    try {
      const result = await checkRoom(value);
      if (result.ok) {
        saveSecret(value);
        setState("ready");
      } else {
        setWrong(true);
      }
    } catch {
      setState("unreachable");
    } finally {
      setBusy(false);
    }
  };

  if (state === "ready") {
    return <>{children}</>;
  }

  if (state === "checking") {
    return (
      <main className="page">
        <div className="card">
          <p className="status-description">確認しています…</p>
        </div>
      </main>
    );
  }

  if (state === "unconfigured") {
    return (
      <main className="page">
        <h1 className="page-title">まだ外から使えません</h1>
        <div className="card">
          <div className="status" data-tone="danger">
            <p className="status-label">
              <span className="status-dot" aria-hidden="true" />
              合言葉が設定されていません
            </p>
            <p className="status-description">
              安全のため、合言葉を決めるまでは、外からの接続をすべてお断りしています。
              自宅のパソコンで合言葉を設定し、アプリを起動し直してください。
              （設定のしかたは README の「先に必ず：合言葉を決める」をご覧ください）
            </p>
          </div>
        </div>
        <p className="note">
          自宅のパソコン本体からは、合言葉なしでそのまま使えます。
        </p>
      </main>
    );
  }

  if (state === "unreachable") {
    return (
      <main className="page">
        <h1 className="page-title">つながりません</h1>
        <div className="card">
          <div className="status" data-tone="danger">
            <p className="status-label">
              <span className="status-dot" aria-hidden="true" />
              サーバーに接続できません
            </p>
            <p className="status-description">
              インターネットに接続できていないか、つなぎ役サーバーが動いていません。
              電波の状態を確認して、画面を再読み込みしてください。
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <h1 className="page-title">合言葉を入力してください</h1>
      <p className="page-lead">
        家族以外が通話に入れないようにするための確認です。1度入力すれば、次からは聞かれません。
      </p>

      <form className="card" onSubmit={submit}>
        <label className="section-title" htmlFor="passphrase">
          合言葉
        </label>
        <input
          id="passphrase"
          className="text-input"
          type="password"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          autoComplete="current-password"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="家族で決めた合言葉"
        />
        {wrong ? (
          <p className="input-error" role="alert">
            合言葉が違います。もう一度入力してください。
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>
          {busy ? "確認中…" : "確認する"}
        </button>
      </form>

      <p className="note">
        合言葉が分からない場合は、この見守り通話を用意した人に聞いてください。
      </p>
    </main>
  );
}

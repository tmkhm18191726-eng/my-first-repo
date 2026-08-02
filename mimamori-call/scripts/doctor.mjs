/**
 * 「なぜ動かないのか」を日本語で教えてくれる確認ツール。
 *
 *   npm run check
 *
 * 何かがおかしいときに、まずこれを実行してください。
 */

import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const lines = [];
let problems = 0;

function ok(title, detail) {
  lines.push(`✅ ${title}${detail ? `\n     ${detail}` : ""}`);
}

function ng(title, howToFix) {
  problems += 1;
  lines.push(`❌ ${title}\n     → ${howToFix}`);
}

function warn(title, detail) {
  lines.push(`⚠️  ${title}\n     ${detail}`);
}

// --- 1. Node.js のバージョン ---
const major = Number(process.versions.node.split(".")[0]);
if (major >= 20) {
  ok(`Node.js のバージョン: ${process.versions.node}`);
} else {
  ng(
    `Node.js が古いです（${process.versions.node}）`,
    "https://nodejs.org/ja から LTS 版（20以上）を入れ直してください。",
  );
}

// --- 2. 実行している場所 ---
if (existsSync(join(root, "wrangler.jsonc"))) {
  ok("実行している場所: 正しいフォルダです");
} else {
  ng(
    "違うフォルダで実行しています",
    "PowerShell で `cd $HOME\\my-first-repo\\mimamori-call` を実行してから、もう一度お試しください。",
  );
}

// --- 3. 正しい置き場所（ブランチ）を使っているか ---
const WANTED_BRANCH = "claude/family-monitoring-voice-app-erh82h";
try {
  const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  if (branch === WANTED_BRANCH) {
    ok(`置き場所（ブランチ）: ${branch}`);
  } else {
    ng(
      `違う置き場所（ブランチ）を見ています：${branch}`,
      `次を実行してください：\n       git checkout ${WANTED_BRANCH}`,
    );
  }
} catch {
  warn("置き場所（ブランチ）を確認できませんでした", "Git が入っていない可能性があります。");
}

// --- 4. 必要な部品が入っているか ---
if (existsSync(join(root, "node_modules", "wrangler"))) {
  ok("必要な部品（node_modules）: 入っています");
} else {
  ng("必要な部品が入っていません", "`npm install` を実行してください。");
}

// --- 5. 画面のファイルが作られているか ---
if (existsSync(join(root, "out", "index.html"))) {
  ok("画面のファイル（out フォルダ）: 作られています");
} else {
  ng(
    "画面のファイルがまだ作られていません",
    "`npm run preview` を実行してください（作るのに1分ほどかかります）。",
  );
}

// --- 6. 合言葉の設定 ---
const devVars = join(root, ".dev.vars");
if (!existsSync(devVars)) {
  warn(
    "合言葉が設定されていません（.dev.vars がありません）",
    "家の中だけで試すならこのままで大丈夫です。\n     インターネットに出すとき（npm run tunnel）は必ず設定してください：\n     copy .dev.vars.example .dev.vars",
  );
} else {
  const match = /^ROOM_SECRET=(.*)$/m.exec(readFileSync(devVars, "utf8"));
  const value = (match?.[1] ?? "").trim();
  if (value) {
    // 合言葉そのものは絶対に表示しない
    ok("合言葉: 設定されています", `（${value.length} 文字）`);
  } else {
    warn(
      "合言葉が空です",
      "家の中だけで試すならこのままで大丈夫です。\n     インターネットに出すときは .dev.vars の ROOM_SECRET= に合言葉を書いてください。",
    );
  }
}

// --- 7. サーバーが動いているか ---
let serverUp = false;
try {
  const response = await fetch("http://localhost:8787/health", {
    signal: AbortSignal.timeout(3000),
  });
  serverUp = response.ok;
} catch {
  serverUp = false;
}

if (serverUp) {
  ok(
    "アプリのサーバー: 動いています",
    "ブラウザで http://localhost:8787/home を開いてください。",
  );
} else {
  ng(
    "アプリのサーバーが動いていません（これが「このサイトにアクセスできません」の原因です）",
    "別の PowerShell を開いて `npm run preview` を実行し、\n" +
      "       『Ready on http://localhost:8787』と表示されるまで待ってください（1分ほどかかります）。",
  );
}

// --- 8. cloudflared（iPhone からつなぐとき用） ---
try {
  const version = execFileSync("cloudflared", ["--version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  ok(`cloudflared: 入っています`, version.trim().split("\n")[0]);
} catch {
  warn(
    "cloudflared が見つかりません",
    "パソコンだけで試すなら不要です。\n     iPhone からつなぐときは `winget install --id Cloudflare.cloudflared` で入れて、\n     PowerShell を開き直してください。",
  );
}

console.log("\n===== 見守り通話 うごくかチェック =====\n");
console.log(lines.join("\n\n"));
console.log("\n=====================================");
if (problems === 0) {
  console.log("問題は見つかりませんでした。\n");
} else {
  console.log(`直したほうがよい点が ${problems} 件あります（❌ の行）。\n`);
}

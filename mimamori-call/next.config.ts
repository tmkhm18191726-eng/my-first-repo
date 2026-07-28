import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 画面はすべて「ただのファイル」として書き出す。
  // こうすると Cloudflare Workers が画面もつなぎ役も同じアドレスで配れるので、
  // スマホから見たときのアドレスが1つで済む。
  output: "export",

  // 型エラーや文法エラーをビルド時に見逃さない（本番で壊れないようにするため）
  typescript: { ignoreBuildErrors: false },
  reactStrictMode: true,
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 型エラーや文法エラーをビルド時に見逃さない（本番で壊れないようにするため）
  typescript: { ignoreBuildErrors: false },
  reactStrictMode: true,
};

export default nextConfig;

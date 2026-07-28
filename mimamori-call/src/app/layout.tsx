import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "見守り通話",
  description: "家族用の見守り音声通話。録音・保存はしません。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "見守り通話",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // iPhone で通話ボタンを二度押ししたときに画面が拡大しないようにする
  maximumScale: 1,
  themeColor: "#0b3d6b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

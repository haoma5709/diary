import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "语音日记",
  description: "用语音记录每一天",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "语音日记",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://qcqwwthiemkokciitylo.supabase.co" />
        <link rel="dns-prefetch" href="https://qcqwwthiemkokciitylo.supabase.co" />
        <link rel="stylesheet" href="/fonts/fonts.css" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#fbf8f3" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`,
          }}
        />
      </head>
      <body className="bg-paper text-ink antialiased font-sans">{children}</body>
    </html>
  );
}

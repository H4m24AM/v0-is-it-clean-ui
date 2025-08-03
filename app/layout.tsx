import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "CleanBite - AI Food Scanner",
  description: "AI-powered food label scanner for dietary compliance checking",
  generator: "CleanBite",
  manifest: "/manifest.json",
  themeColor: "#2b583a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-apple-touch.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CleanBite" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}

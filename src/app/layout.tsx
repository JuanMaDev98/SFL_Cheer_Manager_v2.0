import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import TelegramGate from "@/components/shared/TelegramGate"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Sunflower Helpers Exchange",
  description: "Telegram Mini App for Sunflower Land - Find helpers, exchange cheers, and grow your farming community together!",
  keywords: ["Sunflower Land", "farming", "blockchain", "helpers", "telegram mini app"],
  icons: {
    icon: "/assets/sunflower-logo.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#22c55e",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          src="https://telegram.org/js/telegram-web-app.js"
          async
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-green-50 text-green-900 overflow-x-hidden`}
      >
        <TelegramGate>
          {children}
        </TelegramGate>
        <Toaster />
      </body>
    </html>
  )
}
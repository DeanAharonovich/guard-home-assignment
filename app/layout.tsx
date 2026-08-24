import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Guardio Intent Prototype",
  description: "Personalized intent screen prototype for Guardio onboarding",
}

export const viewport: Viewport = {
  themeColor: "#0d1b42",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`bg-background ${geistSans.className}`}>
      <body>{children}</body>
    </html>
  )
}

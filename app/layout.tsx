// C:\gameon-v1\app\layout.tsx
// Force IPv4 DNS resolution for Render and external APIs
import "@/lib/force-ipv4"

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "@/components/session-provider" // Import the provider
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GameOn - Sports Team Matching",
  description: "Building sports communities, one match at a time",
  generator: 'v0.app',
  icons: {
    icon: '/images/Greenlogoicon.svg',
    apple: '/images/Greenlogoicon.svg',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/Greenlogoicon.svg" type="image/svg+xml" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

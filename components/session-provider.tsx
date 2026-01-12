"use client"

import { SessionProvider } from "next-auth/react"
import type React from "react"
import { DialogProvider } from "@/lib/utils/dialog"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DialogProvider>
        {children}
      </DialogProvider>
    </SessionProvider>
  )
}

"use client"

import { SessionProvider } from "next-auth/react"
import type React from "react"
import { DialogProvider } from "@/lib/utils/dialog"
import { ActivityTracker } from "@/components/activity-tracker"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DialogProvider>
        <ActivityTracker />
        {children}
      </DialogProvider>
    </SessionProvider>
  )
}

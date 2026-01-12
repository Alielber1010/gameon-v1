"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { AICoachChat } from "@/components/dashboard/ai-coach-chat"

export default function AICoachPage() {
  return (
    <div className="flex-1 p-6 space-y-6 h-full">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-2xl font-bold text-green-600">AI Coach</h1>
      </div>

      <div className="h-[calc(100%-80px)]">
        <AICoachChat />
      </div>
    </div>
  )
}

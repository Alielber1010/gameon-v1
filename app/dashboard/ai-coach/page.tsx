"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { AICoachChat } from "@/components/dashboard/ai-coach-chat"

export default function AICoachPage() {
  return (
    <div className="flex-1 p-3 sm:p-6 space-y-3 sm:space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <SidebarTrigger />
        <h1 className="text-xl sm:text-2xl font-bold text-green-600">AI Coach</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <AICoachChat />
      </div>
    </div>
  )
}

import { SidebarTrigger } from "@/components/ui/sidebar"

export default function AICoachPage() {
  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-2xl font-bold text-green-600">AI Coach</h1>
      </div>

      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">AI Coach Coming Soon</p>
        <p className="text-gray-400">Get personalized training tips and advice!</p>
      </div>
    </div>
  )
}

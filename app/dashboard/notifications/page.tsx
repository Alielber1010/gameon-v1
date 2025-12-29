import { SidebarTrigger } from "@/components/ui/sidebar"

export default function NotificationsPage() {
  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-2xl font-bold text-green-600">Notifications</h1>
      </div>

      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No notifications yet</p>
        <p className="text-gray-400">You'll see updates about your games here!</p>
      </div>
    </div>
  )
}

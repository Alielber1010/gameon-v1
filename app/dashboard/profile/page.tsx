import { SidebarTrigger } from "@/components/ui/sidebar"

export default function ProfilePage() {
  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-2xl font-bold text-green-600">Profile</h1>
      </div>

      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Profile Settings</p>
        <p className="text-gray-400">Manage your account and preferences!</p>
      </div>
    </div>
  )
}

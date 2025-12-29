"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AdminSidebar } from "./admin-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function AdminSidebarProvider() {
  const router = useRouter()

  useEffect(() => {
    router.push("/admin/dashboard")
  }, [router])

  return (
    <SidebarProvider defaultOpen={true}>
      <AdminSidebar />
      <SidebarInset>
        <div className="flex-1 p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading admin dashboard...</p>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

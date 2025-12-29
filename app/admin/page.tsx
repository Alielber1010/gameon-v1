"use client"

import { useState } from "react"
import { AdminLoginForm } from "@/components/admin/admin-login-form"
import { AdminSidebarProvider } from "@/components/admin/admin-sidebar-provider"
import { Logo } from "@/components/ui/logo"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Admin Portal</h1>
            <p className="text-gray-600 mt-2">Secure access for administrators</p>
          </div>
          <AdminLoginForm onLogin={() => setIsAuthenticated(true)} />
        </div>
      </div>
    )
  }

  return <AdminSidebarProvider />
}

"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // If not authenticated, redirect to login
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    // If authenticated but not admin, redirect to dashboard
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    // If authenticated and is admin, redirect to admin dashboard
    if (status === "authenticated" && session?.user?.role === "admin") {
      router.push("/admin/dashboard")
    }
  }, [session, status, router])

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything, redirect is happening
  return null
}

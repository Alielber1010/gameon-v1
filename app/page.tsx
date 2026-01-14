"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "loading") return
    
    // Redirect based on user role
    if (status === "authenticated") {
      if (session?.user?.role === "admin") {
        router.push('/admin/dashboard')
      } else {
        router.push('/dashboard')
      }
    } else {
      // Not authenticated, redirect to login
      router.push('/login')
    }
  }, [router, status, session])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}

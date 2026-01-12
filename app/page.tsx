"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    // Redirect to dashboard immediately
    router.push('/dashboard')
  }, [router])

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

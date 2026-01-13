// C:\gameon-v1\app\login
import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { StatsCards } from "@/components/auth/stats-cards"
import { Logo } from "@/components/ui/logo"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding and Stats */}
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="w-1/2">
              <Logo variant="full" theme="green" className="w-full h-auto" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 leading-tight">
                BUILDING SPORTS
                <br />
                COMMUNITIES,
                <br />
                <span className="text-green-600">ONE MATCH AT A TIME</span>
              </h1>
            </div>
          </div>

          <StatsCards />

          {/* Player Silhouettes */}
          <div className="flex justify-center space-x-4 opacity-80">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-12 h-20 bg-green-600 rounded-full relative">
                <div className="absolute inset-0 bg-green-600 rounded-full transform scale-75"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex justify-center lg:justify-end">
          <Suspense fallback={<div className="w-full max-w-md h-96 bg-white rounded-lg animate-pulse" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

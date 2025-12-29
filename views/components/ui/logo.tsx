import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="relative">
        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
          <div className="w-6 h-6 bg-white rounded-full relative">
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-600 rounded-full"></div>
          </div>
        </div>
      </div>
      <div className="text-2xl font-bold">
        <span className="text-green-600">GameOn</span>
        <div className="text-xs text-gray-600 -mt-1">SPORTS TEAM</div>
      </div>
    </div>
  )
}

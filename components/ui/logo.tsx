import { cn } from "@/lib/utils"
import Image from "next/image"

interface LogoProps {
  className?: string
  variant?: "full" | "icon"
  theme?: "green" | "white"
}

export function Logo({ className, variant = "full", theme = "green" }: LogoProps) {
  if (variant === "icon") {
    // Use icon for compact spaces
    return (
      <div className="flex items-center">
        <Image
          src="/images/whitelogoicon.png"
          alt="GameOn Icon"
          width={32}
          height={32}
          className={cn("object-contain", className)}
        />
      </div>
    )
  }

  // Use full logo
  if (theme === "white") {
    return (
      <div className="flex items-center">
        <Image
          src="/images/fullwhitelogo.png"
          alt="GameOn Logo"
          width={200}
          height={60}
          className={cn("object-contain h-auto w-auto", className)}
        />
      </div>
    )
  }

  // Default: green theme
  return (
    <div className="flex items-center">
      <Image
        src="/images/fullgreenlogo.png"
        alt="GameOn Logo"
        width={200}
        height={60}
        className={cn("object-contain h-auto w-auto", className)}
      />
    </div>
  )
}

"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"

/**
 * Component that periodically updates user's lastSeen timestamp
 * to track online/active status
 */
export function ActivityTracker() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated' || !session) {
      return
    }

    // Update activity immediately on mount
    const updateActivity = async () => {
      try {
        await fetch('/api/users/activity', {
          method: 'POST',
        })
      } catch (error) {
        // Silently fail - activity tracking shouldn't break the app
        console.error('Failed to update activity:', error)
      }
    }

    // Update immediately
    updateActivity()

    // Then update every 2 minutes (120 seconds) while user is active
    const interval = setInterval(updateActivity, 2 * 60 * 1000)

    // Also update on user interactions (page visibility, focus, etc.)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateActivity()
      }
    }

    const handleFocus = () => {
      updateActivity()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [status, session])

  return null // This component doesn't render anything
}

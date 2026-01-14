"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Bell, Check, CheckCheck, Gamepad2, UserPlus, UserMinus, XCircle, Trophy } from "lucide-react"
import { getNotifications, markNotificationsAsRead, type Notification } from "@/lib/api/notifications"
import { toast } from "sonner"
import Image from "next/image"

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'join_request_accepted':
      return <Check className="h-5 w-5 text-green-600" />
    case 'join_request_rejected':
      return <XCircle className="h-5 w-5 text-red-600" />
    case 'join_request_sent':
      return <UserPlus className="h-5 w-5 text-blue-600" />
    case 'new_join_request':
      return <UserPlus className="h-5 w-5 text-blue-600" />
    case 'game_cancelled':
      return <Gamepad2 className="h-5 w-5 text-red-600" />
    case 'game_updated':
      return <Gamepad2 className="h-5 w-5 text-yellow-600" />
    case 'player_left':
      return <UserMinus className="h-5 w-5 text-gray-600" />
    case 'host_assigned':
      return <Gamepad2 className="h-5 w-5 text-yellow-600" />
    case 'game_attended':
      return <Check className="h-5 w-5 text-green-600" />
    case 'game_completed':
      return <Trophy className="h-5 w-5 text-yellow-500" />
    default:
      return <Bell className="h-5 w-5 text-gray-600" />
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'join_request_accepted':
      return 'bg-green-50 border-green-200'
    case 'join_request_rejected':
      return 'bg-red-50 border-red-200'
    case 'join_request_sent':
      return 'bg-blue-50 border-blue-200'
    case 'new_join_request':
      return 'bg-blue-50 border-blue-200'
    case 'game_cancelled':
      return 'bg-red-50 border-red-200'
    case 'game_updated':
      return 'bg-yellow-50 border-yellow-200'
    case 'host_assigned':
      return 'bg-yellow-50 border-yellow-200'
    case 'game_attended':
      return 'bg-green-50 border-green-200'
    case 'game_completed':
      return 'bg-yellow-50 border-yellow-200'
    default:
      return 'bg-gray-50 border-gray-200'
  }
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAsRead, setMarkingAsRead] = useState(false)

  useEffect(() => {
    // Check authentication - redirect to login if unauthenticated
    // This works with NextAuth's SessionProvider which automatically detects
    // logout events from other tabs via browser storage events
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchNotifications()
    }
  }, [status, router])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await getNotifications({ limit: 100 })
      if (response.success && response.data) {
        setNotifications(response.data)
      } else {
        toast.error(response.error || 'Failed to load notifications')
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await markNotificationsAsRead({ notificationIds: [notificationId] })
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true, readAt: new Date() } : notif
          )
        )
        // Trigger a custom event to refresh sidebar count
        window.dispatchEvent(new CustomEvent('notification-read'))
      } else {
        toast.error(response.error || 'Failed to mark notification as read')
      }
    } catch (error: any) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    setMarkingAsRead(true)
    try {
      const response = await markNotificationsAsRead({ markAllAsRead: true })
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read: true, readAt: new Date() }))
        )
        // Trigger a custom event to refresh sidebar count
        window.dispatchEvent(new CustomEvent('notification-read'))
        toast.success('All notifications marked as read')
      } else {
        toast.error(response.error || 'Failed to mark all notifications as read')
      }
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark all notifications as read')
    } finally {
      setMarkingAsRead(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-2xl font-bold text-green-600">Notifications</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </div>
    )
  }


  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold text-green-600">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            disabled={markingAsRead}
            variant="outline"
            className="flex items-center gap-2"
          >
            {markingAsRead ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">No notifications yet</p>
            <p className="text-gray-400 text-sm">You'll see updates about your games here!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                !notification.read ? getNotificationColor(notification.type) : 'bg-white'
              } ${!notification.read ? 'border-l-4' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          {!notification.read && (
                            <Badge variant="secondary" className="bg-blue-500 text-white text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                        {notification.gameId && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              // Mark notification as read if it's unread
                              if (!notification.read) {
                                await handleMarkAsRead(notification.id)
                              }
                              // Navigate based on notification type
                              if (notification.type === 'game_completed' || notification.type === 'game_attended') {
                                // Completed games - go to previously played games page
                                router.push(`/dashboard/completed?gameId=${notification.gameId}`)
                              } else if (notification.type === 'join_request_accepted') {
                                // Join request accepted - go to upcoming games (joined games section)
                                router.push(`/dashboard/hosted?gameId=${notification.gameId}`)
                              } else if (notification.type === 'new_join_request') {
                                // Host viewing join requests - go to hosted games
                                router.push(`/dashboard/hosted?gameId=${notification.gameId}`)
                              } else if (notification.type === 'join_request_sent') {
                                // User viewing their sent request - go to upcoming games (pending requests section)
                                router.push(`/dashboard/hosted?gameId=${notification.gameId}`)
                              } else {
                                // For other game-related notifications, go to dashboard
                                router.push(`/dashboard?gameId=${notification.gameId}`)
                              }
                            }}
                            className="text-green-600 hover:text-green-700 text-sm font-medium inline-flex items-center gap-1 underline"
                          >
                            View game
                          </button>
                        )}
                        <p className="text-xs text-gray-400 mt-2">{formatDate(notification.createdAt)}</p>
                      </div>
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAsRead(notification.id)
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

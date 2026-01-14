"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/ui/logo"
import { Home, Calendar, Bot, Bell, User, LogOut, History, Activity } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import  handleLogout  from "@/lib/logout"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { getNotifications } from "@/lib/api/notifications"
import Image from "next/image"

const menuItems = [
  {
    title: "Home",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Upcoming Games",
    url: "/dashboard/hosted",
    icon: Calendar,
  },
  {
    title: "Previously Played",
    url: "/dashboard/completed",
    icon: History,
  },
  {
    title: "Sports Events",
    url: "/dashboard/events",
    icon: Activity,
  },
  {
    title: "AI Coach",
    url: "/dashboard/ai-coach",
    icon: Bot,
  },
  {
    title: "Notifications",
    url: "/dashboard/notifications",
    icon: Bell,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const { setOpenMobile, isMobile } = useSidebar()
  
  // Close sidebar on mobile when a link is clicked
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      // Fetch unread notification count
      const fetchUnreadCount = async () => {
        try {
          const response = await getNotifications({ read: false, limit: 1 })
          if (response.success && response.pagination) {
            setUnreadCount(response.pagination.unread)
          }
        } catch (error) {
          console.error('Error fetching notification count:', error)
        }
      }

      fetchUnreadCount()
      // Refresh every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000)
      
      // Listen for custom event to refresh count when notifications are marked as read
      const handleNotificationRead = () => {
        fetchUnreadCount()
      }
      window.addEventListener('notification-read', handleNotificationRead)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('notification-read', handleNotificationRead)
      }
    }
  }, [status])

  return (
    <Sidebar className="bg-green-600 text-white">
      <SidebarHeader className="p-4">
        <Logo variant="full" theme="white" className="text-white" />
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.url}
                className={cn(
                  "text-white hover:bg-green-700 data-[active=true]:bg-green-700",
                  pathname === item.url && "bg-green-700",
                )}
              >
                <Link href={item.url} className="relative" onClick={handleLinkClick}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                  {item.title === "Notifications" && unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-2">
        {/* Profile Button - Positioned lower */}
        <div className="mt-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard/profile"}
                className={cn(
                  "text-white hover:bg-green-700 data-[active=true]:bg-green-700",
                  pathname === "/dashboard/profile" && "bg-green-700",
                )}
              >
                <Link href="/dashboard/profile" className="relative flex items-center gap-2" onClick={handleLinkClick}>
                  {session?.user?.image ? (
                    <div className="relative h-5 w-5 rounded-full overflow-hidden flex-shrink-0 border border-white/20">
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "Profile"}
                        width={20}
                        height={20}
                        className="object-cover w-full h-full"
                        unoptimized={session.user.image?.includes('blob.vercel-storage.com') || session.user.image?.startsWith('http')}
                        onError={(e) => {
                          // Fallback to placeholder on error
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-user.jpg';
                        }}
                      />
                    </div>
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span>{session?.user?.name || "Profile"}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

        {/* Logout Button */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="text-white hover:bg-green-700"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
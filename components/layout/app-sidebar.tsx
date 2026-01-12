"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/ui/logo"
import { Home, Calendar, Trophy, Bot, Bell, User, LogOut, History, Activity } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import  handleLogout  from "@/lib/logout"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { getNotifications } from "@/lib/api/notifications"

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
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: User,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)

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
        <Logo className="text-white" />
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
                <Link href={item.url} className="relative">
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

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              className="text-white hover:bg-green-700"
              onClick={() => {
                console.log('[AppSidebar] Logout button clicked on SidebarMenuButton');
                handleLogout();
              }}
            >
              <button 
                className="w-full flex items-center gap-2"
                onClick={(e) => {
                  console.log('[AppSidebar] Logout button clicked on inner button', e);
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
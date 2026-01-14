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
import { BarChart3, Flag, Users, LogOut, Gamepad2, FileText } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import  handleLogout  from "@/lib/logout"

const menuItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: BarChart3,
  },
  {
    title: "Reports",
    url: "/admin/reports",
    icon: Flag,
  },
  {
    title: "Games",
    url: "/admin/games",
    icon: Gamepad2,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Privacy Policy",
    url: "/admin/privacy-policy",
    icon: FileText,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar()
  
  // Close sidebar on mobile when a link is clicked
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar className="bg-red-600 text-white">
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <Logo variant="full" theme="white" className="text-white" />
          <span className="text-xs bg-red-700 px-2 py-1 rounded">ADMIN</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.url}
                className={cn(
                  "text-white hover:bg-red-700 data-[active=true]:bg-red-700",
                  pathname === item.url && "bg-red-700",
                )}
              >
                <Link href={item.url} onClick={handleLinkClick}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
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
              className="text-white hover:bg-red-700"
              onClick={() => {
                console.log('[AdminSidebar] Logout button clicked on SidebarMenuButton');
                handleLogout();
              }}
            >
              <button 
                className="w-full flex items-center gap-2"
                onClick={(e) => {
                  console.log('[AdminSidebar] Logout button clicked on inner button', e);
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

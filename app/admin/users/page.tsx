"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { UsersTable, type User } from "@/components/admin/users-table"
import { UserDetailsModal } from "@/components/admin/user-details-modal"
import { Users, Search, Loader2, Ban } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface Game {
  id: string
  title: string
  sport: string
  date: string
  status: string
  isHost: boolean
}

export default function AdminUsersPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userGames, setUserGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingGames, setLoadingGames] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [showBanned, setShowBanned] = useState<boolean | null>(null) // null = all, true = banned only, false = non-banned only

  useEffect(() => {
    // Check authentication and admin role
    if (sessionStatus === "unauthenticated") {
      router.push("/login")
      return
    }

    if (sessionStatus === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    if (sessionStatus === "authenticated" && session?.user?.role === "admin") {
      fetchUsers()
    }
  }, [sessionStatus, session, router])

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (searchQuery !== undefined) {
      fetchUsers()
    }
  }, [searchQuery, showBanned])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) {
        params.append("search", searchQuery)
      }
      if (showBanned !== null) {
        params.append("showBanned", showBanned.toString())
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setUsers(data.users || [])
      } else {
        console.error("Failed to fetch users:", data.error)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserGames = async (userId: string) => {
    try {
      setLoadingGames(true)
      const response = await fetch(`/api/admin/users/${userId}/games`)
      const data = await response.json()

      if (data.success) {
        setUserGames(data.games || [])
      } else {
        console.error("Failed to fetch user games:", data.error)
        setUserGames([])
      }
    } catch (error) {
      console.error("Error fetching user games:", error)
      setUserGames([])
    } finally {
      setLoadingGames(false)
    }
  }

  const handleUserClick = async (user: User) => {
    setSelectedUser(user)
    await fetchUserGames(user.id)
  }

  const handleUserUpdated = async () => {
    console.log('[AdminUsersPage] handleUserUpdated called')
    
    // Refresh the users list
    console.log('[AdminUsersPage] Refreshing users list...')
    await fetchUsers()
    
    // Update the selected user in the modal with fresh data
    if (selectedUser) {
      console.log('[AdminUsersPage] Updating selected user:', selectedUser.id)
      try {
        const response = await fetch(`/api/admin/users?search=${selectedUser.email}`)
        const data = await response.json()
        console.log('[AdminUsersPage] Updated user data:', data)
        
        if (data.success && data.users.length > 0) {
          const updatedUser = data.users.find((u: User) => u.id === selectedUser.id)
          if (updatedUser) {
            console.log('[AdminUsersPage] Setting updated user:', updatedUser)
            setSelectedUser(updatedUser)
          } else {
            // User was deleted, close the modal
            console.log('[AdminUsersPage] User not found - account was deleted, closing modal')
            setSelectedUser(null)
            setUserGames([])
          }
        } else {
          // User was deleted, close the modal
          console.log('[AdminUsersPage] No users found - account was deleted, closing modal')
          setSelectedUser(null)
          setUserGames([])
        }
      } catch (error) {
        console.error('[AdminUsersPage] Error fetching updated user:', error)
        // On error, close modal in case user was deleted
        setSelectedUser(null)
        setUserGames([])
      }
    } else {
      console.log('[AdminUsersPage] No selected user to update')
    }
  }

  const handleCloseModal = () => {
    setSelectedUser(null)
    setUserGames([])
  }

  // Show loading while checking session
  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-600" />
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated or not admin
  if (sessionStatus === "unauthenticated" || session?.user?.role !== "admin") {
    return null
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Users Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">View and manage all platform users</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-red-600" />
          <span className="text-sm text-gray-600">{users.length} users</span>
        </div>
      </div>

      {/* Search Bar and Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Banned Filter */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Checkbox
              id="showBanned"
              checked={showBanned === true}
              onCheckedChange={(checked) => {
                setShowBanned(checked ? true : null)
              }}
            />
            <Label 
              htmlFor="showBanned" 
              className="text-sm font-medium cursor-pointer flex items-center gap-2"
            >
              <Ban className="h-4 w-4 text-red-600" />
              Banned
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Click on a user to view their details and game history</CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} onUserClick={handleUserClick} />
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          games={userGames}
          isOpen={!!selectedUser}
          onClose={handleCloseModal}
          loadingGames={loadingGames}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  )
}

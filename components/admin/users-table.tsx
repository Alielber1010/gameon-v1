"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye } from "lucide-react"

export interface User {
  id: string
  name: string
  email: string
  image: string
  role: string
  bio: string
  phoneNumber: string
  location: string
  gamesPlayed: number
  averageRating: number
  totalRatings: number
  createdAt: string
  isBanned?: boolean
  bannedAt?: string
  banReason?: string
}

interface UsersTableProps {
  users: User[]
  onUserClick: (user: User) => void
}

export function UsersTable({ users, onUserClick }: UsersTableProps) {
  const MASTER_ADMIN_EMAIL = 'ali.melbermawy@gmail.com'
  
  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700"
      case "user":
        return "bg-blue-100 text-blue-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }
  
  const isMasterAdmin = (user: User) => {
    return user.email === MASTER_ADMIN_EMAIL && user.role === 'admin'
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Games Played</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
              No users found
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user.id} className="cursor-pointer hover:bg-gray-50">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{user.name}</span>
                      {user.isBanned && (
                        <Badge className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-md hover:bg-red-100 pointer-events-none">
                          BANNED
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {isMasterAdmin(user) && (
                        <Badge className="bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded-md hover:bg-red-600 pointer-events-none">
                          MASTER
                        </Badge>
                      )}
                      {user.role === 'admin' && !isMasterAdmin(user) && (
                        <Badge className={`${getRoleColor(user.role)} text-xs px-2 py-0.5 font-medium rounded-md hover:bg-red-100 hover:text-red-700 pointer-events-none`}>
                          ADMIN
                        </Badge>
                      )}
                      {user.location && (
                        <span className="text-sm text-gray-500">{user.location}</span>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm">{user.email}</TableCell>
              <TableCell>{user.gamesPlayed}</TableCell>
              <TableCell>
                {user.totalRatings > 0 ? (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{user.averageRating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">({user.totalRatings})</span>
                  </div>
                ) : (
                  <span className="text-gray-400">No ratings</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onUserClick(user)
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

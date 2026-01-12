"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Eye, Gamepad2, User, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export interface Report {
  id: string
  type: 'game' | 'user'
  gameId: string | null
  gameTitle: string | null
  gameSport: string | null
  gameImage: string | null
  userId: string | null
  userName: string | null
  userEmail: string | null
  userImage: string | null
  reportType: string
  description: string
  images: string[]
  status: string
  action?: string
  actionReason?: string
  actionDate?: string
  priority: 'high' | 'medium' | 'low'
  reportedBy: {
    id: string
    name: string
    email: string
    image: string
  }
  resolvedBy?: {
    id: string
    name: string
    email: string
  } | null
  createdAt: string
  updatedAt: string
}

interface ReportsTableProps {
  reports: Report[]
  onReportClick?: (report: Report) => void
}

export function ReportsTable({ reports, onReportClick }: ReportsTableProps) {
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'text-red-500 fill-red-500'
      case 'medium':
        return 'text-yellow-500 fill-yellow-500'
      case 'low':
        return 'text-green-500 fill-green-500'
      default:
        return 'text-gray-500 fill-gray-500'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default'
      case 'resolved':
        return 'secondary'
      case 'dismissed':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      spam: 'Spam',
      harassment: 'Harassment',
      inappropriate: 'Inappropriate',
      fake_scam: 'Fake/Scam',
      violence: 'Violence',
      other: 'Other',
    }
    return labels[type] || type
  }

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No reports found.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Priority</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Reported Item</TableHead>
            <TableHead>Report Type</TableHead>
            <TableHead>Reported By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow
              key={report.id}
              className="hover:bg-gray-50"
            >
              <TableCell>
                <Circle
                  className={cn("h-4 w-4", getPriorityColor(report.priority))}
                  fill="currentColor"
                />
              </TableCell>
              <TableCell>
                {report.type === 'game' ? (
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <Gamepad2 className="h-3 w-3" />
                    Game
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <User className="h-3 w-3" />
                    User
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {report.type === 'game' ? (
                  <div className="flex items-center gap-3">
                    {report.gameImage && (
                      <div className="relative h-10 w-10 rounded overflow-hidden">
                        <Image
                          src={report.gameImage}
                          alt={report.gameTitle || 'Game'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{report.gameTitle || 'Unknown Game'}</div>
                      {report.gameSport && (
                        <div className="text-sm text-gray-500">{report.gameSport}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={report.userImage || '/placeholder-user.jpg'} alt={report.userName || 'User'} />
                      <AvatarFallback>
                        {report.userName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{report.userName || 'Unknown User'}</div>
                      {report.userEmail && (
                        <div className="text-sm text-gray-500">{report.userEmail}</div>
                      )}
                    </div>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="destructive" className="text-xs">
                  {getReportTypeLabel(report.reportType)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={report.reportedBy?.image} alt={report.reportedBy?.name || 'Unknown'} />
                    <AvatarFallback>
                      {(report.reportedBy?.name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{report.reportedBy?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{report.reportedBy?.email || ''}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(report.status)}>
                  {report.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDate(report.createdAt)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onReportClick?.(report)
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { User, Calendar, AlertTriangle, Image as ImageIcon, Gamepad2, ExternalLink } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export interface Report {
  id: string
  type?: 'game' | 'user'
  gameId?: string | null
  gameTitle?: string | null
  gameSport?: string | null
  gameImage?: string | null
  userId?: string | null
  userName?: string | null
  userEmail?: string | null
  userImage?: string | null
  reportType: string
  description: string
  images: string[]
  status: string
  action?: string
  actionReason?: string
  actionDate?: string
  priority?: 'high' | 'medium' | 'low'
  createdAt: string
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
}

interface ReportDetailsModalProps {
  report: Report | null
  isOpen: boolean
  onClose: () => void
}

export function ReportDetailsModal({ report, isOpen, onClose }: ReportDetailsModalProps) {
  const router = useRouter()
  
  if (!report) return null

  const handleGameClick = () => {
    if (report.gameId) {
      // Close the report modal
      onClose()
      // Navigate to games page with gameId in URL
      router.push(`/admin/games?gameId=${report.gameId}`)
    }
  }

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      spam: 'Spam',
      harassment: 'Harassment or Bullying',
      inappropriate: 'Inappropriate Content',
      fake_scam: 'Fake or Scam Activity',
      violence: 'Violence or Threats',
      other: 'Other Violation',
    }
    return labels[type] || type
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

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Report Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Type & Status */}
          <div className="flex items-center gap-4">
            <Badge variant="destructive" className="text-sm px-3 py-1">
              {getReportTypeLabel(report.reportType)}
            </Badge>
            <Badge variant={getStatusBadgeVariant(report.status)}>
              {report.status}
            </Badge>
            {report.action && (
              <Badge variant="outline">
                Action: {report.action}
              </Badge>
            )}
          </div>

          {/* Reported Item (Game or User) */}
          {(report.type === 'game' || report.gameId) && (
            <>
              <Card 
                className={report.gameId ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}
                onClick={report.gameId ? handleGameClick : undefined}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Gamepad2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1">Reported Game</div>
                      <div className="font-semibold flex items-center gap-2">
                        {report.gameTitle || 'Unknown Game'}
                        {report.gameId && (
                          <ExternalLink className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      {report.gameSport && (
                        <div className="text-sm text-gray-500">{report.gameSport}</div>
                      )}
                    </div>
                    {report.gameImage && (
                      <div className="relative h-16 w-16 rounded overflow-hidden">
                        <Image
                          src={report.gameImage}
                          alt={report.gameTitle || 'Game'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Separator />
            </>
          )}

          {(report.type === 'user' || report.userId) && (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={report.userImage || '/placeholder-user.jpg'} alt={report.userName || 'User'} />
                      <AvatarFallback>
                        {report.userName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1">Reported User</div>
                      <div className="font-semibold">{report.userName || 'Unknown User'}</div>
                      {report.userEmail && (
                        <div className="text-sm text-gray-500">{report.userEmail}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Separator />
            </>
          )}

          {/* Reported By */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={report.reportedBy.image} alt={report.reportedBy.name} />
                  <AvatarFallback>
                    {report.reportedBy.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">Reported By</div>
                  <div className="font-semibold">{report.reportedBy.name}</div>
                  <div className="text-sm text-gray-500">{report.reportedBy.email}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Description
            </h3>
            <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-md">
              {report.description}
            </p>
          </div>

          {/* Images */}
          {report.images && report.images.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Evidence Images ({report.images.length})
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {report.images.map((img, index) => (
                  <div key={index} className="relative aspect-video rounded-md overflow-hidden border">
                    <Image
                      src={img}
                      alt={`Evidence ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Details */}
          {report.action && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Action Taken</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Action: </span>
                    <Badge variant="outline">{report.action}</Badge>
                  </div>
                  {report.actionReason && (
                    <div>
                      <span className="font-medium">Reason: </span>
                      <span className="text-gray-700">{report.actionReason}</span>
                    </div>
                  )}
                  {report.actionDate && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(report.actionDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Timestamps */}
          <Separator />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Reported on {formatDate(report.createdAt)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

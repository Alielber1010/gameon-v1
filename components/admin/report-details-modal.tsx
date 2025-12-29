"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, Calendar, User, Flag } from "lucide-react"
import type { Report } from "@/types/admin"

interface ReportDetailsModalProps {
  report: Report
  isOpen: boolean
  onClose: () => void
  onAction: (reportId: string, action: "resolve" | "dismiss") => void
}

export function ReportDetailsModal({ report, isOpen, onClose, onAction }: ReportDetailsModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-700"
      case "resolved":
        return "bg-green-100 text-green-700"
      case "dismissed":
        return "bg-gray-100 text-gray-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "inappropriate_content":
        return "Inappropriate Content"
      case "no_show":
        return "No Show"
      case "spam":
        return "Spam"
      default:
        return "Other"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-600" />
            Report Details
          </DialogTitle>
          <DialogDescription>Review and take action on this user report</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500">Report Type</div>
              <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500">Status</div>
              <Badge className={getStatusColor(report.status)}>
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Game and User Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Game:</span>
              <span>{report.gameTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Reported User:</span>
              <span>{report.reportedUser}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Reported By:</span>
              <span>{report.reportedBy}</span>
            </div>
          </div>

          <Separator />

          {/* Report Details */}
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-2">Reason</div>
              <p className="text-sm">{report.reason}</p>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-2">Description</div>
              <p className="text-sm">{report.description}</p>
            </div>
            {report.evidence && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Evidence</div>
                <p className="text-sm">{report.evidence}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          {report.status === "pending" && (
            <div className="flex gap-3">
              <Button onClick={() => onAction(report.id, "resolve")} className="flex-1 bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve Report
              </Button>
              <Button onClick={() => onAction(report.id, "dismiss")} variant="outline" className="flex-1">
                <XCircle className="h-4 w-4 mr-2" />
                Dismiss Report
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

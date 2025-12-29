"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import type { Report } from "@/types/admin"

interface ReportsTableProps {
  reports: Report[]
  onReportClick: (report: Report) => void
}

export function ReportsTable({ reports, onReportClick }: ReportsTableProps) {
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Game</TableHead>
          <TableHead>Reported User</TableHead>
          <TableHead>Reported By</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => (
          <TableRow key={report.id}>
            <TableCell>
              <Badge variant="outline" className="text-xs">
                {getTypeLabel(report.type)}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{report.gameTitle}</TableCell>
            <TableCell>{report.reportedUser}</TableCell>
            <TableCell>{report.reportedBy}</TableCell>
            <TableCell>
              <Badge className={getStatusColor(report.status)}>
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" onClick={() => onReportClick(report)}>
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

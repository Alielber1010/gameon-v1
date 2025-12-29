"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ReportsTable } from "@/components/admin/reports-table"
import { ReportDetailsModal } from "@/components/admin/report-details-modal"
import { AlertTriangle, Users, Flag, TrendingUp } from "lucide-react"
import type { Report } from "@/types/admin"

// Mock data for admin dashboard
const mockReports: Report[] = [
  {
    id: "1",
    type: "inappropriate_content",
    gameTitle: "BASKETBALL MATCH",
    reportedBy: "John Doe",
    reportedUser: "BadPlayer123",
    reason: "Using inappropriate language during game",
    status: "pending",
    createdAt: "2024-01-15T10:30:00Z",
    description: "Player was using offensive language and being disrespectful to other team members.",
    evidence: "Screenshots of chat messages",
  },
  {
    id: "2",
    type: "no_show",
    gameTitle: "FOOTBALL TEAM 3",
    reportedBy: "Jane Smith",
    reportedUser: "NoShowPlayer",
    reason: "Didn't show up to scheduled game",
    status: "resolved",
    createdAt: "2024-01-14T15:45:00Z",
    description: "Player confirmed attendance but never showed up, causing team to be short-handed.",
    evidence: "Game attendance records",
  },
  {
    id: "3",
    type: "spam",
    gameTitle: "HIKING GROUP",
    reportedBy: "Mike Johnson",
    reportedUser: "SpamBot99",
    reason: "Posting spam messages in game chat",
    status: "pending",
    createdAt: "2024-01-13T09:15:00Z",
    description: "User is posting promotional links and spam content in multiple game chats.",
    evidence: "Multiple chat logs",
  },
]

export default function AdminDashboardPage() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [reports, setReports] = useState(mockReports)

  const handleReportAction = (reportId: string, action: "resolve" | "dismiss") => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === reportId ? { ...report, status: action === "resolve" ? "resolved" : "dismissed" } : report,
      ),
    )
    setSelectedReport(null)
  }

  const stats = [
    {
      title: "Total Reports",
      value: reports.length.toString(),
      description: "All time reports",
      icon: Flag,
      color: "text-blue-600",
    },
    {
      title: "Pending Reports",
      value: reports.filter((r) => r.status === "pending").length.toString(),
      description: "Awaiting review",
      icon: AlertTriangle,
      color: "text-orange-600",
    },
    {
      title: "Active Users",
      value: "1,234",
      description: "Currently online",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Resolution Rate",
      value: "94%",
      description: "This month",
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ]

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage platform activity</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          System Healthy
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Review and manage user reports and content moderation</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportsTable reports={reports} onReportClick={setSelectedReport} />
        </CardContent>
      </Card>

      {/* Report Details Modal */}
      {selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          onAction={handleReportAction}
        />
      )}
    </div>
  )
}

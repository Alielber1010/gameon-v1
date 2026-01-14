"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ReportsTable, type Report } from "@/components/admin/reports-table"
import { ReportDetailsModal } from "@/components/admin/report-details-modal"
import { Flag, Search, Loader2, Gamepad2, User, Circle } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"

export default function AdminReportsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all") // 'game', 'user', or 'all'
  const [priorityFilter, setPriorityFilter] = useState<string>("all") // 'high', 'medium', 'low', or 'all'
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

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
      fetchReports()
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
      fetchReports()
    }
  }, [searchQuery, statusFilter, typeFilter, priorityFilter])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) {
        params.append("search", searchQuery)
      }
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      if (typeFilter && typeFilter !== "all") {
        params.append("reportType", typeFilter)
      }
      if (priorityFilter && priorityFilter !== "all") {
        params.append("priority", priorityFilter)
      }

      const response = await fetch(`/api/admin/reports?${params.toString()}`)
      const data = await response.json()

      console.log('[Admin Reports Page] API Response:', data)
      console.log('[Admin Reports Page] Reports count:', data.reports?.length || 0)

      if (data.success) {
        setReports(data.reports || [])
      } else {
        console.error("Failed to fetch reports:", data.error, data.details)
        setReports([])
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking session
  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-600" />
          <p className="mt-4 text-gray-600">Loading reports...</p>
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
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Reports Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">View and manage all reports about games and users</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-red-600" />
          <span className="text-sm text-gray-600">{reports.length} reports</span>
        </div>
      </div>

      {/* Search Bar and Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search reports by game, user, reporter, or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Label htmlFor="status" className="text-sm font-medium whitespace-nowrap">
                Status:
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter (Game/User) */}
            <div className="flex items-center gap-2">
              <Label htmlFor="type" className="text-sm font-medium whitespace-nowrap">
                Type:
              </Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="game">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="h-3 w-3" />
                      <span>Games</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>Users</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <Label htmlFor="priority" className="text-sm font-medium whitespace-nowrap">
                Priority:
              </Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <Circle className="h-3 w-3 text-red-500 fill-red-500" />
                      <span>High</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Circle className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span>Medium</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <Circle className="h-3 w-3 text-green-500 fill-green-500" />
                      <span>Low</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
          <CardDescription>
            Click on a report to view details. Priority indicators show report urgency.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportsTable 
            reports={reports} 
            onReportClick={(report) => setSelectedReport(report)}
          />
        </CardContent>
      </Card>

      {/* Report Details Modal */}
      {selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  )
}

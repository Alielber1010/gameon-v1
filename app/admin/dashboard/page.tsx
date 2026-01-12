"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  Users, 
  Flag, 
  TrendingUp, 
  Gamepad2, 
  MessageSquare,
  Activity,
  UserPlus,
  Calendar,
  CheckCircle2,
  Ban,
  BarChart3
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts"

interface Analytics {
  // User Stats
  totalUsers: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  onlineUsers: number
  bannedUsers: number
  userGrowth: Array<{ date: string; count: number }>
  
  // Game Stats
  totalGames: number
  upcomingGames: number
  gamesThisWeek: number
  gamesThisMonth: number
  completedGames: number
  ongoingGames: number
  gamesBySport: Array<{ sport: string; count: number }>
  gamesByStatus: Array<{ status: string; count: number }>
  
  // Report Stats
  totalReports: number
  pendingReports: number
  resolvedReports: number
  reportsThisWeek: number
  reportsByType: Array<{ type: string; count: number }>
  resolutionRate: number
  
  // Message Stats
  totalMessages: number
  messagesToday: number
  
  // Platform Metrics
  avgGamesPerUser: string
  mostActiveUsers: Array<{
    name: string
    email: string
    gamesPlayed: number
    averageRating: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function AdminDashboardPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

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
      fetchAnalytics()
      // Refresh analytics every 30 seconds
      const interval = setInterval(fetchAnalytics, 30000)
      return () => clearInterval(interval)
    }
  }, [sessionStatus, session, router])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics')
      const data = await response.json()

      if (data.success) {
        setAnalytics(data.analytics)
      } else {
        console.error("Failed to fetch analytics:", data.error)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
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
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated or not admin
  if (sessionStatus === "unauthenticated" || session?.user?.role !== "admin") {
    return null
  }

  if (!analytics) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center text-gray-500">
          Failed to load analytics
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: "Total Users",
      value: analytics.totalUsers.toLocaleString(),
      description: `${analytics.newUsersThisWeek} new this week`,
      icon: Users,
      color: "text-blue-600",
      trend: analytics.newUsersThisWeek > 0 ? "+" + analytics.newUsersThisWeek : "0"
    },
    {
      title: "Online Users",
      value: analytics.onlineUsers.toLocaleString(),
      description: "Active in last 15 min",
      icon: Activity,
      color: "text-green-600",
      trend: null
    },
    {
      title: "Upcoming Games",
      value: analytics.upcomingGames.toLocaleString(),
      description: `${analytics.gamesThisWeek} created this week`,
      icon: Calendar,
      color: "text-purple-600",
      trend: analytics.gamesThisWeek > 0 ? "+" + analytics.gamesThisWeek : "0"
    },
    {
      title: "Pending Reports",
      value: analytics.pendingReports.toLocaleString(),
      description: `${analytics.resolutionRate}% resolution rate`,
      icon: Flag,
      color: "text-orange-600",
      trend: null
    },
    {
      title: "Total Games",
      value: analytics.totalGames.toLocaleString(),
      description: `${analytics.completedGames} completed`,
      icon: Gamepad2,
      color: "text-indigo-600",
      trend: null
    },
    {
      title: "Messages Today",
      value: analytics.messagesToday.toLocaleString(),
      description: `${analytics.totalMessages} total messages`,
      icon: MessageSquare,
      color: "text-cyan-600",
      trend: null
    },
  ]

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time platform analytics and insights</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          System Healthy
        </Badge>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stat.value}</div>
                {stat.trend && (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {stat.trend}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              User Growth (Last 7 Days)
            </CardTitle>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Games by Sport */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-purple-600" />
              Games by Sport
            </CardTitle>
            <CardDescription>Distribution of games across different sports</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.gamesBySport.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sport" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Games" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Games by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Games by Status
            </CardTitle>
            <CardDescription>Current status distribution of all games</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.gamesByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                >
                  {analytics.gamesByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reports by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-orange-600" />
              Reports by Type
            </CardTitle>
            <CardDescription>Distribution of report types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.reportsByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="type" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#ff8042" name="Reports" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-600" />
              New This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.newUsersThisMonth}</div>
            <p className="text-xs text-muted-foreground">Users registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Completed Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completedGames}</div>
            <p className="text-xs text-muted-foreground">Total completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Ban className="h-4 w-4 text-red-600" />
              Banned Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.bannedUsers}</div>
            <p className="text-xs text-muted-foreground">Currently banned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Avg Games/User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgGamesPerUser}</div>
            <p className="text-xs text-muted-foreground">Average participation</p>
          </CardContent>
        </Card>
      </div>

      {/* Most Active Users */}
      {analytics.mostActiveUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Most Active Users
            </CardTitle>
            <CardDescription>Top users by games played</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.mostActiveUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">{user.gamesPlayed} games</div>
                      <div className="text-sm text-gray-500">
                        {user.averageRating > 0 ? `⭐ ${user.averageRating.toFixed(1)}` : 'No rating'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

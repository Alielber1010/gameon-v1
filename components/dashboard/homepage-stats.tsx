"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Gamepad2 } from "lucide-react"
import { useEffect, useState } from "react"

interface StatsData {
  totalPlayers: number
  totalGames: number
}

export function HomepageStats() {
  const [stats, setStats] = useState<StatsData>({
    totalPlayers: 0,
    totalGames: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()
        if (data.success) {
          setStats(data.stats)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US')
  }

  const statsConfig = [
    {
      icon: Users,
      label: "Players",
      value: formatNumber(stats.totalPlayers),
    },
    {
      icon: Gamepad2,
      label: "Upcoming Games",
      value: formatNumber(stats.totalGames),
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {statsConfig.map((stat, index) => (
        <Card key={index} className="bg-white/80 backdrop-blur-sm border-green-200">
          <CardContent className="p-4 text-center">
            <stat.icon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-green-600">
              {loading ? "..." : stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

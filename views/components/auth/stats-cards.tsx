import { Card, CardContent } from "@/components/ui/card"
import { Clock, Users, Trophy } from "lucide-react"

export function StatsCards() {
  const stats = [
    {
      icon: Clock,
      label: "Active Now",
      value: "1,438",
    },
    {
      icon: Users,
      label: "Players",
      value: "47,392",
    },
    {
      icon: Trophy,
      label: "Active Teams",
      value: "2,847",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-white/80 backdrop-blur-sm border-green-200">
          <CardContent className="p-4 text-center">
            <stat.icon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-green-600">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

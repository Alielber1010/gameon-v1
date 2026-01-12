export interface Report {
  id: string
  type: string
  gameTitle: string
  reportedBy: string
  reportedUser: string
  reason: string
  status: "pending" | "resolved" | "dismissed"
  createdAt: string
  description: string
  evidence?: string
}

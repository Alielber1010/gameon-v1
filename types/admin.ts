export interface GameReport {
  id: string
  gameId: string
  gameTitle: string
  gameSport: string
  gameLocation: string
  gameImage?: string
  reportType: "inappropriate_content" | "no_show" | "spam" | "other"
  reportDescription: string
  reportedBy: string
  reportedByEmail: string
  reportDate: string
  status: "pending" | "resolved" | "dismissed"
  action?: "delete" | "keep"
  actionReason?: string
  actionDate?: string
  gameHost: string
  gameHostEmail: string
  gameHostWhatsApp: string
  reportedUser: string
  reason: string
  evidence?: string
}

export interface AdminUser {
  id: string
  username: string
  role: "admin" | "moderator"
  lastLogin: string
}

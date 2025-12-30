export interface GameReport {
  id: string
  gameId: string
  gameTitle: string
  gameSport: string
  gameLocation: string
  gameImage?: string
  reportType: "inappropriate" | "spam" | "sexual"
  reportDescription: string
  reportedBy: string
  reportedByEmail: string
  reportDate: string
  status: "pending" | "resolved"
  action?: "delete" | "keep"
  actionReason?: string
  actionDate?: string
  gameHost: string
  gameHostEmail: string
  gameHostWhatsApp: string
}

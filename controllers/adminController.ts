import type { GameReport } from "@/lib/db/models/types/admin"
import { mockReports } from "@/lib/db/models/data/mockReports"

export class AdminController {
  static login(email: string, password: string): boolean {
    if (email === "admin@gameon.com" && password === "admin123") {
      localStorage.setItem("adminAuth", "true")
      return true
    }
    return false
  }

  static logout(): void {
    localStorage.removeItem("adminAuth")
  }

  static isAuthenticated(): boolean {
    return localStorage.getItem("adminAuth") === "true"
  }

  static getAllReports(): GameReport[] {
    return mockReports
  }

  static updateReportStatus(reportId: string, action: "delete" | "keep", reason?: string): GameReport[] {
    return mockReports.map((report) =>
      report.id === reportId
        ? {
            ...report,
            status: "resolved" as const,
            action,
            actionReason: reason,
            actionDate: new Date().toISOString().split("T")[0],
          }
        : report,
    )
  }

  static getReportStats(): {
    pending: number
    resolved: number
    total: number
  } {
    const pending = mockReports.filter((r) => r.status === "pending").length
    const resolved = mockReports.filter((r) => r.status === "resolved").length
    return {
      pending,
      resolved,
      total: mockReports.length,
    }
  }
}

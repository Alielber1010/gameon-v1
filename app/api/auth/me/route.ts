import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  const user = requireAuth()
  return NextResponse.json(user)
}

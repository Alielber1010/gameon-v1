import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized")
  }
  
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role || "user",
    image: session.user.image,
  }
}

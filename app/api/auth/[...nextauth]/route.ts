// C:\gameon-v1\app\api\auth\[...nextauth]
import NextAuth, { NextAuthOptions } from "next-auth"
import { Adapter } from "next-auth/adapters" // Added this import
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import bcrypt from "bcryptjs"
import connectDB, { clientPromise } from "@/lib/db/mongodb" // Combined imports
import User from "@lib/db/models/User"

export const authOptions: NextAuthOptions = {
  // Cast to Adapter to resolve compatibility issues between @auth/mongodb-adapter and next-auth
  adapter: MongoDBAdapter(clientPromise) as Adapter,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        await connectDB()

          const user = await User.findOne({ email: credentials.email.toLowerCase() }).select("+password")
          if (!user || !user.password) return null

          const match = await bcrypt.compare(credentials.password, user.password)
          if (!match) return null

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role || "user",
            image: user.image || "",
          }
      },
    }),
  ],

  session: { 
    strategy: "jwt" // Required for CredentialsProvider
  },
 callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || "user"
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login', // Middleware will now redirect here instead
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
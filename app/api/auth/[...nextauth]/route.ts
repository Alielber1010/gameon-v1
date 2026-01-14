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

  // Set the base URL for NextAuth callbacks
  ...(process.env.NEXTAUTH_URL && { url: process.env.NEXTAUTH_URL }),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
      authorization: {
        params: {
          prompt: "select_account", // Force account selection, prevents auto-login
          access_type: "offline",
        },
      },
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

          // Check if user is banned - return null and let signIn callback handle the redirect
          if (user.isBanned) {
            return null // Return null to trigger error, signIn callback will handle ban check
          }

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
    async signIn({ user, account, profile }) {
      // Check if user is banned for all providers
      if (user?.email) {
        await connectDB()
        const dbUser = await User.findOne({ email: user.email.toLowerCase() })
        if (dbUser?.isBanned) {
          // Throw error with AccountBanned to trigger proper redirect
          throw new Error("AccountBanned")
        }
      }
      
      // Allow sign in for credentials provider
      if (account?.provider === "credentials") {
        return true
      }

      // For Google OAuth, check if user exists with email/password and allow linking
      if (account?.provider === "google" && user.email) {
        await connectDB()
        
        const existingUser = await User.findOne({ email: user.email.toLowerCase() })
        
        // Update or create user with provider field set to "google"
        if (existingUser) {
          // Update existing user to mark as Google provider if not already set
          if (existingUser.provider !== "google") {
            await User.updateOne(
              { email: user.email.toLowerCase() },
              { $set: { provider: "google" } }
            )
          }
          // User exists - allow sign in (NextAuth will link accounts)
          return true
        } else {
          // New user - MongoDBAdapter will create the user, but we need to ensure provider is set
          // We'll handle this in the jwt callback after user is created
          return true
        }
      }

      return true
    },

    async jwt({ token, user, account, trigger }) {
      // On initial sign in, set user data
      if (user) {
        token.id = user.id
        token.role = (user as any).role || "user"
        token.email = user.email
      }
      
      // If this is a new sign-in (not a token refresh), ensure we have the latest user data
      if (account || trigger === "signIn") {
        await connectDB()
        const email = token.email || user?.email
        if (email) {
          const dbUser = await User.findOne({ email: email.toLowerCase() })
          if (dbUser) {
            token.role = dbUser.role || "user"
            token.id = dbUser._id.toString()
            // Update email to ensure consistency
            token.email = dbUser.email
            
            // If this is a Google sign-in, ensure provider is set
            if (account?.provider === "google") {
              if (dbUser.provider !== "google") {
                await User.updateOne(
                  { email: email.toLowerCase() },
                  { $set: { provider: "google" } }
                )
              }
            }
          } else if (account?.provider === "google" && email) {
            // New Google user - MongoDBAdapter created it, but we need to ensure provider is set
            // Try to find and update after a short delay (MongoDBAdapter might still be creating)
            setTimeout(async () => {
              await connectDB()
              await User.updateOne(
                { email: email.toLowerCase() },
                { $set: { provider: "google" } },
                { upsert: false }
              )
            }, 100)
          }
        }
      }
      
      // For token refreshes, ensure we have the latest role from database
      if (token.email && !account && trigger !== "signIn") {
        await connectDB()
        const dbUser = await User.findOne({ email: token.email.toLowerCase() })
        if (dbUser) {
          token.role = dbUser.role || "user"
          token.id = dbUser._id.toString()
        }
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

    async redirect({ url, baseUrl }) {
      // If url is a relative path, make it absolute
      if (url.startsWith("/")) {
        // Check if user is admin and redirecting to dashboard - redirect to admin instead
        if (url === "/dashboard" || url.startsWith("/dashboard")) {
          // We can't check role here, so let middleware handle the redirect
          return `${baseUrl}${url}`
        }
        return `${baseUrl}${url}`
      }
      // If url is on the same origin, allow it
      if (new URL(url).origin === baseUrl) return url
      // Default to dashboard for authenticated users (middleware will redirect admins)
      return `${baseUrl}/dashboard`
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect errors to login page
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
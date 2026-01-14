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
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Hardcoded admin account
        const ADMIN_EMAIL = "admin@gmail.com"
        const ADMIN_PASSWORD = "t9rmQXsQj9b0K37J3rkBIncdXxD8WPd2"
        
        if (credentials.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          // Check hardcoded admin password
          if (credentials.password === ADMIN_PASSWORD) {
            await connectDB()
            // Find or create admin user
            let adminUser = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() })
            
            if (!adminUser) {
              // Create admin user if it doesn't exist
              adminUser = await User.create({
                name: "Admin",
                email: ADMIN_EMAIL.toLowerCase(),
                password: await bcrypt.hash(ADMIN_PASSWORD, 10),
                role: "admin",
                provider: "credentials",
              })
            } else {
              // Ensure existing admin user has admin role
              if (adminUser.role !== "admin") {
                adminUser.role = "admin"
                await adminUser.save()
              }
            }
            
            return {
              id: adminUser._id.toString(),
              email: adminUser.email,
              name: adminUser.name,
              role: "admin",
              image: adminUser.image || "",
            }
          } else {
            // Wrong password for admin account
            return null
          }
        }

        await connectDB()

          const user = await User.findOne({ email: credentials.email.toLowerCase() }).select("+password provider")
          
          if (!user) return null
          
          // Check if user signed up with Google (no password means Google account)
          // MongoDBAdapter stores OAuth accounts separately, so if there's no password,
          // it's likely a Google account
          if (!user.password || user.provider === 'google') {
            // Return null to trigger error, but we'll handle this in the login form
            // by checking before attempting login
            return null
          }

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
        
        // If user exists, preserve their role (especially if they're an admin)
        if (existingUser) {
          // Preserve the existing role - MongoDBAdapter might overwrite it
          // We'll handle role preservation in the JWT callback instead
          console.log(`[signIn] Google OAuth for existing user: ${user.email}, current role: ${existingUser.role}`)
          return true
        }
        
        // New user - allow sign in
        return true
      }

      return true
    },

    async jwt({ token, user, account }) {
      // On initial sign in, set basic user data
      if (user) {
        token.id = user.id
        // Don't set role from user object - always fetch from database
      }
      
      // ALWAYS fetch the latest role from database - never trust cached values
      // This ensures role changes are immediately reflected
      if (token.email) {
        try {
          await connectDB()
          const dbUser = await User.findOne({ email: token.email.toLowerCase() })
          if (dbUser) {
            // Always use the role from database, never trust the token or user object
            token.role = dbUser.role || "user"
            token.id = dbUser._id.toString()
            console.log(`[JWT] Fetched role for ${token.email}: ${dbUser.role} (was: ${(user as any)?.role || token.role})`)
          } else {
            console.warn(`[JWT] User not found in database for email: ${token.email}`)
            // Fallback to user role if not found
            token.role = token.role || "user"
          }
        } catch (error) {
          console.error(`[JWT] Error fetching user role for ${token.email}:`, error)
          // Fallback to user role on error
          token.role = token.role || "user"
        }
      } else {
        // If no email, default to user role
        token.role = token.role || "user"
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
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // If url is on the same origin, allow it
      if (new URL(url).origin === baseUrl) return url
      // Default to dashboard for authenticated users
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
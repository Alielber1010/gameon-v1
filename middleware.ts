import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === "admin"
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")

    // If user is trying to access admin route but is not admin, redirect to dashboard
    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // If user is admin and trying to access dashboard, redirect to admin
    if (!isAdminRoute && isAdmin && req.nextUrl.pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/admin", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access if user is authenticated
        return !!token
      },
    },
  }
)

export const config = { 
  // Protect dashboard and admin routes
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*"
  ] 
}

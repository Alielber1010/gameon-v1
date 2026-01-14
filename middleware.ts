import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === "admin"
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")
    const isLoginRoute = req.nextUrl.pathname === "/login"

    // If authenticated user visits login page, redirect to appropriate dashboard
    if (isLoginRoute && token) {
      if (isAdmin) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url))
      } else {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    // If user is trying to access admin route but is not admin, redirect to dashboard
    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // If user is admin and trying to access dashboard, redirect to admin dashboard
    if (!isAdminRoute && isAdmin && req.nextUrl.pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // For login route, allow access even if not authenticated (so unauthenticated users can access it)
        if (req.nextUrl.pathname === "/login") {
          return true
        }
        // For other routes, require authentication
        return !!token
      },
    },
  }
)

export const config = { 
  // Protect dashboard and admin routes, and handle login redirect
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login"
  ] 
}

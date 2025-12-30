export { default } from "next-auth/middleware"


export const config = { 
  // Add all routes you want to protect here
  matcher: ["/dashboard/:path*"] 
}
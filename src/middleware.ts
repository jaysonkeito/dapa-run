import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const role = token?.role as string | undefined
    const pathname = req.nextUrl.pathname

    // Admin-only routes that staff cannot access
    const adminOnlyPaths = [
      '/admin/dashboard/merchandise',
      '/admin/dashboard/pos-analytics',
      '/admin/dashboard/users',
      '/admin/dashboard/settings',
      '/admin/dashboard/reports',
    ]

    // Check if current path is admin-only
    const isAdminOnlyPath = adminOnlyPaths.some(path => pathname.startsWith(path))

    // If staff tries to access admin-only routes, redirect to dashboard
    if (isAdminOnlyPath && role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    pages: {
      signIn: '/admin/login',
    },
  }
)

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
  ],
}

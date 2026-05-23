import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const role = token?.role as string | undefined
    const pathname = req.nextUrl.pathname

    // Handle developer login page - allow unauthenticated access
    if (pathname === '/admin/dev-login') {
      // If already logged in as developer, redirect to dashboard
      if (role === 'developer') {
        return NextResponse.redirect(new URL('/admin/dev-dashboard', req.url))
      }
      return NextResponse.next()
    }

    // Handle developer dashboard routes
    if (pathname.startsWith('/admin/dev-dashboard')) {
      // Only developer role can access developer dashboard
      if (role !== 'developer') {
        return NextResponse.redirect(new URL('/admin/dev-login', req.url))
      }
      return NextResponse.next()
    }

    // Handle admin dashboard routes
    if (pathname.startsWith('/admin/dashboard')) {
      // Block developer from accessing admin dashboard
      if (role === 'developer') {
        return NextResponse.redirect(new URL('/admin/dev-dashboard', req.url))
      }

      // Block regular users from ALL admin dashboard routes
      if (role !== 'admin' && role !== 'staff') {
        return NextResponse.redirect(new URL('/admin/login', req.url))
      }

      // Admin-only routes that staff cannot access
      const adminOnlyPaths = [
        '/admin/dashboard/merchandise',
        '/admin/dashboard/pos-analytics',
        '/admin/dashboard/users',
        '/admin/dashboard/settings',
        '/admin/dashboard/reports',
        '/admin/dashboard/system-logs',
      ]

      // Check if current path is admin-only
      const isAdminOnlyPath = adminOnlyPaths.some(path => pathname.startsWith(path))

      // If staff tries to access admin-only routes, redirect to dashboard
      if (isAdminOnlyPath && role !== 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }

      return NextResponse.next()
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        // Allow unauthenticated access to developer login page
        if (pathname === '/admin/dev-login') {
          return true
        }

        // For all other protected routes, require authentication
        return !!token
      },
    },
    pages: {
      signIn: '/admin/login',
    },
  }
)

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/admin/dev-dashboard/:path*',
  ],
}

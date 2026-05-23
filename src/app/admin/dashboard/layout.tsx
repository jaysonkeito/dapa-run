'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  ShoppingBag,
  Trophy,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  BarChart3,
  Settings,
  ClipboardList,
  Monitor,
  UserPlus,
  PieChart,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'

const allSidebarItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
  { label: 'Events', href: '/admin/dashboard/events', icon: Calendar, roles: ['admin', 'staff'] },
  { label: 'Inventory', href: '/admin/dashboard/merchandise', icon: ShoppingBag, roles: ['admin'] },
  { label: 'Race Results', href: '/admin/dashboard/results', icon: Trophy, roles: ['admin', 'staff'] },
  { label: 'Registrations', href: '/admin/dashboard/registrations', icon: ClipboardList, roles: ['admin', 'staff'] },
  { label: 'On-site Registration', href: '/admin/dashboard/onsite-registration', icon: UserPlus, roles: ['admin', 'staff'] },
  { label: 'Sales Counter', href: '/admin/dashboard/pos', icon: Monitor, roles: ['admin', 'staff'] },
  { label: 'Sales Analytics', href: '/admin/dashboard/pos-analytics', icon: PieChart, roles: ['admin'] },
  { label: 'Users', href: '/admin/dashboard/users', icon: Users, roles: ['admin'] },
  { label: 'Reports', href: '/admin/dashboard/reports', icon: BarChart3, roles: ['admin'] },
  { label: 'Settings', href: '/admin/dashboard/settings', icon: Settings, roles: ['admin'] },
  { label: 'System Logs', href: '/admin/dashboard/system-logs', icon: FileText, roles: ['admin'] },
]

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [siteSettings, setSiteSettings] = useState({ siteTagline: 'Dumaguete', siteTitle: 'DAPA RUN - Dumaguete' })

  const userRole = (session?.user as Record<string, unknown>)?.role as string | undefined

  const sidebarItems = useMemo(() => {
    if (!userRole) return []
    return allSidebarItems.filter((item) => item.roles.includes(userRole))
  }, [userRole])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setSiteSettings((prev) => ({
          ...prev,
          siteTagline: data.siteTagline || data.site_tagline || prev.siteTagline,
          siteTitle: data.siteTitle || data.site_title || prev.siteTitle,
        }))
      })
      .catch(() => { /* use default */ })
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/admin/login'
    } else if (status === 'authenticated' && userRole !== 'admin' && userRole !== 'staff') {
      window.location.href = '/admin/login'
    }
  }, [session, status, userRole])

  // Don't render until mounted on client to avoid hydration mismatch
  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || (userRole !== 'admin' && userRole !== 'staff')) {
    return null
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-gray-900">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center overflow-hidden">
            <img src="/dapa-run-logo.png" alt="DAPA RUN" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">DAPA RUN</h1>
          </div>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="px-3 py-4 border-t border-gray-800">
          <button
            onClick={() => { signOut({ redirect: false }).then(() => { window.location.href = '/admin/login' }) }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 z-50">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center overflow-hidden">
                  <img src="/dapa-run-logo.png" alt="DAPA RUN" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg">DAPA RUN</h1>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="py-4 space-y-1 px-3">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <button
                    key={item.href}
                    onClick={() => { router.push(item.href); setSidebarOpen(false) }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:pl-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <button onClick={() => router.push('/admin/dashboard')} className="hover:text-orange-500 capitalize">{userRole} Panel</button>
                {pathname !== '/admin/dashboard' && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-gray-900 font-medium">
                      {sidebarItems.find((i) => i.href === pathname)?.label || 'Page'}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-gray-500 hover:text-orange-500 font-medium"
              >
                View Site →
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-xs">{(session.user as Record<string, unknown>)?.name?.toString()?.charAt(0)?.toUpperCase() || 'A'}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{(session.user as Record<string, unknown>)?.name?.toString() || 'Admin'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

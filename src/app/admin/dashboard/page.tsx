'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Users, ShoppingBag, ClipboardList, Monitor, UserPlus } from 'lucide-react'

interface Stats {
  totalEvents: number
  totalUsers: number
  totalRegistrations: number
  totalMerchandise: number
  totalPOSSales: number
  totalPOSRevenue: number
  totalOnsiteRegs: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [eventsRes, merchRes, regRes, posRes, onsiteRes] = await Promise.all([
          fetch('/api/admin/events'),
          fetch('/api/admin/merchandise'),
          fetch('/api/admin/registrations'),
          fetch('/api/admin/pos'),
          fetch('/api/admin/onsite-registration'),
        ])

        // Safely parse each response - fallback to empty array if not OK or not an array
        const safeParseArray = async (res: Response): Promise<Record<string, unknown>[]> => {
          if (!res.ok) return []
          try {
            const data = await res.json()
            return Array.isArray(data) ? data : []
          } catch {
            return []
          }
        }

        const events = await safeParseArray(eventsRes)
        const merch = await safeParseArray(merchRes)
        const registrations = await safeParseArray(regRes)
        const posOrders = await safeParseArray(posRes)
        const onsiteRegs = await safeParseArray(onsiteRes)

        // Count unique users from registrations
        const uniqueUsers = new Set(registrations.map((r) => (r.user as Record<string, unknown> | undefined)?.id)).size

        // Calculate POS revenue
        const posRevenue = posOrders.reduce((sum, order) => sum + ((order.totalAmount as number) || 0), 0)

        setStats({
          totalEvents: events.length || 0,
          totalUsers: uniqueUsers || 0,
          totalRegistrations: registrations.length || 0,
          totalMerchandise: merch.length || 0,
          totalPOSSales: posOrders.length || 0,
          totalPOSRevenue: posRevenue,
          totalOnsiteRegs: onsiteRegs.length || 0,
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        setStats({ totalEvents: 0, totalUsers: 0, totalRegistrations: 0, totalMerchandise: 0, totalPOSSales: 0, totalPOSRevenue: 0, totalOnsiteRegs: 0 })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'Total Events',
      value: stats?.totalEvents ?? 0,
      icon: Calendar,
      color: 'from-orange-500 to-orange-600',
      bgLight: 'bg-orange-50',
    },
    {
      title: 'Registered Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50',
    },
    {
      title: 'Event Registrations',
      value: stats?.totalRegistrations ?? 0,
      icon: ClipboardList,
      color: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
    },
    {
      title: 'Inventory Items',
      value: stats?.totalMerchandise ?? 0,
      icon: ShoppingBag,
      color: 'from-purple-500 to-purple-600',
      bgLight: 'bg-purple-50',
    },
    {
      title: 'POS Sales',
      value: stats?.totalPOSSales ?? 0,
      subtitle: stats?.totalPOSRevenue ? `₱${stats.totalPOSRevenue.toLocaleString()} revenue` : undefined,
      icon: Monitor,
      color: 'from-cyan-500 to-cyan-600',
      bgLight: 'bg-cyan-50',
    },
    {
      title: 'On-site Registrations',
      value: stats?.totalOnsiteRegs ?? 0,
      icon: UserPlus,
      color: 'from-rose-500 to-rose-600',
      bgLight: 'bg-rose-50',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back to DAPA RUN admin panel</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {loading ? (
                        <span className="inline-block w-12 h-8 bg-gray-100 animate-pulse rounded" />
                      ) : (
                        card.value
                      )}
                    </p>
                    {card.subtitle && !loading && (
                      <p className="text-xs font-medium text-gray-400 mt-0.5">{card.subtitle}</p>
                    )}
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/dashboard/events'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Events</h3>
                <p className="text-sm text-gray-500">Create, edit, or delete events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/dashboard/pos'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Point of Sale</h3>
                <p className="text-sm text-gray-500">Process on-site merchandise sales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/dashboard/onsite-registration'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">On-site Registration</h3>
                <p className="text-sm text-gray-500">Register walk-in participants</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

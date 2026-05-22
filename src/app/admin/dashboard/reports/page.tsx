'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Users,
  ClipboardList,
  DollarSign,
  Download,
  ShoppingCart,
  Package,
  AlertTriangle,
  CreditCard,
  UserCheck,
  FileBarChart,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { generateCSV, formatDateForReport, formatPriceForReport } from '@/lib/report-utils'

interface LowStockItem {
  id: string
  name: string
  stock: number
  soldCount: number
}

interface PaymentMethodSummary {
  method: string
  count: number
  revenue: number
}

interface RoleSummary {
  role: string
  count: number
}

interface ReportData {
  summary: {
    totalEvents: number
    totalUsers: number
    totalRegistrations: number
    estimatedRevenue: number
  }
  eventsSummary: {
    totalEvents: number
    upcoming: number
    past: number
    totalRegistrations: number
    totalRevenue: number
  }
  registrationsSummary: {
    totalOnline: number
    totalOnsite: number
    totalRevenue: number
    onlineRevenue: number
    onsiteRevenue: number
  }
  merchandiseSummary: {
    totalItems: number
    totalSold: number
    totalRevenueFromPOS: number
    lowStockItems: LowStockItem[]
  }
  posSummary: {
    totalOrders: number
    totalRevenue: number
    byPaymentMethod: PaymentMethodSummary[]
  }
  usersSummary: {
    totalUsers: number
    byRole: RoleSummary[]
  }
  eventBreakdown: { eventId: string; title: string; count: number; revenue: number }[]
  monthlyTrends: { month: string; count: number }[]
  registrations: {
    id: string
    userName: string
    userEmail: string
    eventTitle: string
    eventDate: string
    distance: string
    createdAt: string
    priceRange: string
    totalAmount: number
  }[]
  onsiteRegistrations: {
    id: string
    participantName: string
    participantEmail: string | null
    participantPhone: string | null
    eventTitle: string
    distance: string
    paymentMethod: string
    amountPaid: number
    createdAt: string
  }[]
  posOrders: {
    id: string
    orderNumber: string
    totalAmount: number
    paymentMethod: string
    customerName: string
    staffName: string | null
    createdAt: string
    items: { itemName: string; price: number; quantity: number; size: string | null }[]
  }[]
}

export default function AdminReportsPage() {
  const { toast } = useToast()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const res = await fetch(`/api/admin/reports?${params.toString()}`)
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleGenerateFullReport = () => {
    if (!data) return
    const headers = ['Section', 'Metric', 'Value']
    const rows: string[][] = []

    // Events
    rows.push(['Events', 'Total Events', String(data.eventsSummary.totalEvents)])
    rows.push(['Events', 'Upcoming', String(data.eventsSummary.upcoming)])
    rows.push(['Events', 'Past', String(data.eventsSummary.past)])
    rows.push(['Events', 'Total Registrations', String(data.eventsSummary.totalRegistrations)])
    rows.push(['Events', 'Total Revenue', formatPriceForReport(data.eventsSummary.totalRevenue)])

    // Registrations
    rows.push(['Registrations', 'Online Registrations', String(data.registrationsSummary.totalOnline)])
    rows.push(['Registrations', 'On-site Registrations', String(data.registrationsSummary.totalOnsite)])
    rows.push(['Registrations', 'Online Revenue', formatPriceForReport(data.registrationsSummary.onlineRevenue)])
    rows.push(['Registrations', 'On-site Revenue', formatPriceForReport(data.registrationsSummary.onsiteRevenue)])
    rows.push(['Registrations', 'Total Revenue', formatPriceForReport(data.registrationsSummary.totalRevenue)])

    // Merchandise
    rows.push(['Merchandise', 'Total Items', String(data.merchandiseSummary.totalItems)])
    rows.push(['Merchandise', 'Total Sold', String(data.merchandiseSummary.totalSold)])
    rows.push(['Merchandise', 'POS Revenue', formatPriceForReport(data.merchandiseSummary.totalRevenueFromPOS)])
    rows.push(['Merchandise', 'Low Stock Items', String(data.merchandiseSummary.lowStockItems.length)])

    // POS
    rows.push(['POS', 'Total Orders', String(data.posSummary.totalOrders)])
    rows.push(['POS', 'Total Revenue', formatPriceForReport(data.posSummary.totalRevenue)])
    data.posSummary.byPaymentMethod.forEach((pm) => {
      rows.push(['POS', `${pm.method} Orders`, String(pm.count)])
      rows.push(['POS', `${pm.method} Revenue`, formatPriceForReport(pm.revenue)])
    })

    // Users
    rows.push(['Users', 'Total Users', String(data.usersSummary.totalUsers)])
    data.usersSummary.byRole.forEach((r) => {
      rows.push(['Users', `${r.role}s`, String(r.count)])
    })

    generateCSV(headers, rows, 'dapa-run-full-report')
    toast({ title: 'Report Generated', description: 'Full comprehensive report has been downloaded.' })
  }

  const handleEventsReport = () => {
    if (!data) return
    const headers = ['Event', 'Registrations', 'Revenue']
    const rows = data.eventBreakdown.map((eb) => [
      eb.title,
      String(eb.count),
      formatPriceForReport(eb.revenue),
    ])
    generateCSV(headers, rows, 'dapa-run-events-report')
    toast({ title: 'Report Generated', description: 'Events report has been downloaded.' })
  }

  const handleRegistrationsReport = () => {
    if (!data) return
    const headers = ['Type', 'Name', 'Email', 'Event', 'Distance', 'Amount', 'Date']
    const rows: string[][] = []
    data.registrations.forEach((r) => {
      rows.push(['Online', r.userName, r.userEmail, r.eventTitle, r.distance, formatPriceForReport(r.totalAmount), formatDateForReport(r.createdAt)])
    })
    data.onsiteRegistrations.forEach((r) => {
      rows.push(['On-site', r.participantName, r.participantEmail || '—', r.eventTitle, r.distance, formatPriceForReport(r.amountPaid), formatDateForReport(r.createdAt)])
    })
    generateCSV(headers, rows, 'dapa-run-registrations-report')
    toast({ title: 'Report Generated', description: 'Registrations report has been downloaded.' })
  }

  const handlePOSReport = () => {
    if (!data) return
    const headers = ['Order #', 'Customer', 'Staff', 'Payment Method', 'Total Amount', 'Items', 'Date']
    const rows = data.posOrders.map((o) => [
      o.orderNumber,
      o.customerName,
      o.staffName || '—',
      o.paymentMethod,
      formatPriceForReport(o.totalAmount),
      o.items.map((i) => `${i.itemName} x${i.quantity}${i.size ? ` (${i.size})` : ''}`).join('; '),
      formatDateForReport(o.createdAt),
    ])
    generateCSV(headers, rows, 'dapa-run-pos-report')
    toast({ title: 'Report Generated', description: 'POS report has been downloaded.' })
  }

  const handleUsersReport = () => {
    if (!data) return
    const headers = ['Role', 'Count']
    const rows = data.usersSummary.byRole.map((r) => [r.role, String(r.count)])
    rows.push(['Total', String(data.usersSummary.totalUsers)])
    generateCSV(headers, rows, 'dapa-run-users-report')
    toast({ title: 'Report Generated', description: 'Users report has been downloaded.' })
  }

  const maxMonthlyCount = Math.max(...(data?.monthlyTrends.map((m) => m.count) || [1]), 1)

  const summaryCards = [
    { title: 'Total Events', value: data?.eventsSummary.totalEvents ?? 0, icon: Calendar, color: 'from-orange-500 to-orange-600' },
    { title: 'Total Registrations', value: (data?.registrationsSummary.totalOnline ?? 0) + (data?.registrationsSummary.totalOnsite ?? 0), icon: ClipboardList, color: 'from-emerald-500 to-emerald-600' },
    { title: 'Total Revenue', value: formatPriceForReport(data?.summary.estimatedRevenue ?? 0), icon: DollarSign, color: 'from-purple-500 to-purple-600' },
    { title: 'Total Users', value: data?.usersSummary.totalUsers ?? 0, icon: Users, color: 'from-rose-500 to-rose-600' },
    { title: 'POS Orders', value: data?.posSummary.totalOrders ?? 0, icon: ShoppingCart, color: 'from-cyan-500 to-cyan-600' },
    { title: 'Merch Sold', value: data?.merchandiseSummary.totalSold ?? 0, icon: Package, color: 'from-amber-500 to-amber-600' },
  ]

  const paymentMethodLabels: Record<string, string> = {
    cash: 'Cash',
    gcash: 'GCash',
    card: 'Card',
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Comprehensive analytics and insights</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleGenerateFullReport} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold" disabled={!data}>
            <FileBarChart className="w-4 h-4 mr-2" />
            Generate Full Report
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-col sm:flex-row items-end gap-4">
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium text-gray-600">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium text-gray-600">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button onClick={fetchData} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold">
          Apply
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {loading ? <span className="inline-block w-16 h-6 bg-gray-100 animate-pulse rounded" /> : card.value}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Section Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Events Summary */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Events Summary</h3>
              <Button onClick={handleEventsReport} variant="outline" size="sm" disabled={!data}>
                <Download className="w-3 h-3 mr-1" />
                Events Report
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Events</span>
                <span className="font-semibold">{data?.eventsSummary.totalEvents ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Upcoming</span>
                <Badge className="bg-emerald-500 text-white">{data?.eventsSummary.upcoming ?? 0}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Past</span>
                <Badge className="bg-gray-500 text-white">{data?.eventsSummary.past ?? 0}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Registrations</span>
                <span className="font-semibold">{data?.eventsSummary.totalRegistrations ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Revenue</span>
                <span className="font-semibold text-orange-600">{formatPriceForReport(data?.eventsSummary.totalRevenue ?? 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registrations Summary */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Registrations Summary</h3>
              <Button onClick={handleRegistrationsReport} variant="outline" size="sm" disabled={!data}>
                <Download className="w-3 h-3 mr-1" />
                Registrations Report
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Online Registrations</span>
                <span className="font-semibold">{data?.registrationsSummary.totalOnline ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">On-site Registrations</span>
                <span className="font-semibold">{data?.registrationsSummary.totalOnsite ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Online Revenue</span>
                <span className="font-semibold text-emerald-600">{formatPriceForReport(data?.registrationsSummary.onlineRevenue ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">On-site Revenue</span>
                <span className="font-semibold text-blue-600">{formatPriceForReport(data?.registrationsSummary.onsiteRevenue ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-700 font-medium">Total Revenue</span>
                <span className="font-bold text-orange-600">{formatPriceForReport(data?.registrationsSummary.totalRevenue ?? 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Merchandise Summary */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Merchandise Summary</h3>
              <Package className="w-5 h-5 text-amber-500" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Items</span>
                <span className="font-semibold">{data?.merchandiseSummary.totalItems ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Sold</span>
                <span className="font-semibold">{data?.merchandiseSummary.totalSold ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">POS Revenue</span>
                <span className="font-semibold text-orange-600">{formatPriceForReport(data?.merchandiseSummary.totalRevenueFromPOS ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Low Stock Items</span>
                <Badge className={data?.merchandiseSummary.lowStockItems.length ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}>
                  {data?.merchandiseSummary.lowStockItems.length ?? 0}
                </Badge>
              </div>
              {data?.merchandiseSummary.lowStockItems && data.merchandiseSummary.lowStockItems.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-1 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-semibold text-red-700">Low Stock Items</span>
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {data.merchandiseSummary.lowStockItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span className="text-gray-700">{item.name}</span>
                        <span className="text-red-600 font-semibold">{item.stock} left</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* POS Summary */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">POS Summary</h3>
              <Button onClick={handlePOSReport} variant="outline" size="sm" disabled={!data}>
                <Download className="w-3 h-3 mr-1" />
                POS Report
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Orders</span>
                <span className="font-semibold">{data?.posSummary.totalOrders ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Revenue</span>
                <span className="font-semibold text-orange-600">{formatPriceForReport(data?.posSummary.totalRevenue ?? 0)}</span>
              </div>
              {data?.posSummary.byPaymentMethod && data.posSummary.byPaymentMethod.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-gray-600 mb-2">By Payment Method</p>
                  {data.posSummary.byPaymentMethod.map((pm) => (
                    <div key={pm.method} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">{paymentMethodLabels[pm.method] || pm.method}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400">{pm.count} orders</span>
                        <span className="ml-2 font-semibold">{formatPriceForReport(pm.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Summary & Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Users Summary */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Users Summary</h3>
              <Button onClick={handleUsersReport} variant="outline" size="sm" disabled={!data}>
                <Download className="w-3 h-3 mr-1" />
                Users Report
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Users</span>
                <span className="font-semibold">{data?.usersSummary.totalUsers ?? 0}</span>
              </div>
              {data?.usersSummary.byRole.map((r) => {
                const roleColors: Record<string, string> = {
                  admin: 'bg-red-500 text-white',
                  staff: 'bg-orange-500 text-white',
                  user: 'bg-gray-500 text-white',
                }
                return (
                  <div key={r.role} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3 h-3 text-gray-400" />
                      <Badge className={roleColors[r.role] || 'bg-gray-500 text-white'}>{r.role}</Badge>
                    </div>
                    <span className="font-semibold">{r.count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends Bar Chart */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Registration Trends</h3>
            {data?.monthlyTrends && data.monthlyTrends.length > 0 ? (
              <div className="flex items-end gap-2 h-48">
                {data.monthlyTrends.map((mt) => (
                  <div key={mt.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-gray-700">{mt.count}</span>
                    <div
                      className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-md min-h-[4px] transition-all"
                      style={{ height: `${(mt.count / maxMonthlyCount) * 100}%` }}
                    />
                    <span className="text-[10px] text-gray-500 rotate-0 truncate max-w-[50px]">
                      {mt.month.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Registration Breakdown Table */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-900 mb-4">Event Registration Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold text-gray-600">Event</th>
                  <th className="text-right py-2 font-semibold text-gray-600">Registrations</th>
                  <th className="text-right py-2 font-semibold text-gray-600">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data?.eventBreakdown.map((eb) => (
                  <tr key={eb.eventId} className="border-b last:border-0">
                    <td className="py-2.5 text-gray-900">{eb.title}</td>
                    <td className="py-2.5 text-right text-gray-700">{eb.count}</td>
                    <td className="py-2.5 text-right text-orange-600 font-semibold">{formatPriceForReport(eb.revenue)}</td>
                  </tr>
                ))}
                {(!data?.eventBreakdown || data.eventBreakdown.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-gray-400">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

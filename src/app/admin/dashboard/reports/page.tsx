'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, Users, ClipboardList, DollarSign, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ReportData {
  summary: {
    totalEvents: number
    totalUsers: number
    totalRegistrations: number
    estimatedRevenue: number
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

  const handleExportCSV = () => {
    if (!data?.registrations) return

    const headers = ['Name', 'Email', 'Event', 'Event Date', 'Distance', 'Registration Date', 'Price Range']
    const rows = data.registrations.map((r) => [
      r.userName,
      r.userEmail,
      r.eventTitle,
      r.eventDate,
      r.distance,
      new Date(r.createdAt).toLocaleDateString(),
      r.priceRange,
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dapa-run-report-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast({ title: 'Export Complete', description: 'CSV file downloaded.' })
  }

  const maxMonthlyCount = Math.max(...(data?.monthlyTrends.map((m) => m.count) || [1]), 1)

  const summaryCards = [
    { title: 'Total Events', value: data?.summary.totalEvents ?? 0, icon: Calendar, color: 'from-orange-500 to-orange-600' },
    { title: 'Total Registrations', value: data?.summary.totalRegistrations ?? 0, icon: ClipboardList, color: 'from-emerald-500 to-emerald-600' },
    { title: 'Total Users', value: data?.summary.totalUsers ?? 0, icon: Users, color: 'from-blue-500 to-blue-600' },
    { title: 'Est. Revenue', value: `₱${(data?.summary.estimatedRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: 'from-purple-500 to-purple-600' },
  ]

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Analytics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleExportCSV} variant="outline" className="font-semibold" disabled={!data}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Breakdown Table */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Event Registration Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-semibold text-gray-600">Event</th>
                    <th className="text-right py-2 font-semibold text-gray-600">Registrations</th>
                    <th className="text-right py-2 font-semibold text-gray-600">Est. Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.eventBreakdown.map((eb) => (
                    <tr key={eb.eventId} className="border-b last:border-0">
                      <td className="py-2.5 text-gray-900">{eb.title}</td>
                      <td className="py-2.5 text-right text-gray-700">{eb.count}</td>
                      <td className="py-2.5 text-right text-orange-600 font-semibold">₱{eb.revenue.toLocaleString()}</td>
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
    </div>
  )
}

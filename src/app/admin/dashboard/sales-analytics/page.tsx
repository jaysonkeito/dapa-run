'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Receipt,
  Banknote,
  Smartphone,
  CreditCard,
  Package,
  Trophy,
  Calendar,
  ArrowUpRight,
  Eye,
  Search,
  Loader2,
  BarChart3,
  Download,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { generateCSV, formatDateForReport, formatPriceForReport } from '@/lib/report-utils'
interface Summary {
  totalRevenue: number
  totalTransactions: number
  avgTransactionValue: number
}

interface BestSellingItem {
  itemId: string
  itemName: string
  totalQuantity: number
  totalRevenue: number
  category: string
}

interface RecentOrder {
  id: string
  orderNumber: string
  totalAmount: number
  paymentMethod: string
  customerName: string
  staffName: string | null
  createdAt: string
  itemCount: number
  items: { itemName: string; quantity: number; price: number; size: string | null }[]
}

interface AnalyticsData {
  summary: Summary
  paymentBreakdown: Record<string, { count: number; revenue: number }>
  bestSellingItems: BestSellingItem[]
  categoryBreakdown: Record<string, { quantity: number; revenue: number }>
  dailySales: { date: string; revenue: number; transactions: number }[]
  recentOrders: RecentOrder[]
}

const periodOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
]

const paymentMethodLabels: Record<string, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  card: 'Card',
}

const paymentMethodIcons: Record<string, typeof Banknote> = {
  cash: Banknote,
  gcash: Smartphone,
  card: CreditCard,
}

const categoryColors: Record<string, string> = {
  shoes: 'bg-orange-500 text-white',
  apparel: 'bg-purple-500 text-white',
  accessories: 'bg-emerald-500 text-white',
  unknown: 'bg-gray-500 text-white',
}

const categoryLabels: Record<string, string> = {
  shoes: 'Shoes',
  apparel: 'Apparel',
  accessories: 'Accessories',
  unknown: 'Other',
}

function formatPrice(amount: number): string {
  return `₱${amount.toLocaleString()}`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function SalesAnalyticsPage() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/sales-analytics?period=${period}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const analyticsData = await res.json()
        setData(analyticsData)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [period])

  const filteredOrders = (data?.recentOrders || []).filter((order) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      order.orderNumber.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.items.some((item) => item.itemName.toLowerCase().includes(q))
    )
  })

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales Analytics</h1>
          <p className="text-gray-500 mt-1">Track sales, best sellers, and revenue breakdown</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Filter */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  period === opt.value
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button onClick={() => {
            if (!data?.recentOrders) return
            const headers = ['Order Number', 'Date', 'Customer', 'Payment Method', 'Total Amount', 'Items']
            const rows = data.recentOrders.map((order) => [
              order.orderNumber,
              formatDateForReport(order.createdAt),
              order.customerName,
              order.paymentMethod,
              formatPriceForReport(order.totalAmount),
              order.items.map((item) => `${item.itemName}${item.size ? ` (${item.size})` : ''} x${item.quantity}`).join('; '),
            ])
            generateCSV(headers, rows, 'dapa-run-sales-counter-sales-report')
            toast({ title: 'Report Generated', description: 'Sales Counter sales report has been downloaded.' })
          }} variant="outline" className="font-semibold">
            <Download className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {loading ? <span className="inline-block w-24 h-8 bg-gray-100 animate-pulse rounded" /> : formatPrice(data?.summary.totalRevenue || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {loading ? <span className="inline-block w-16 h-8 bg-gray-100 animate-pulse rounded" /> : data?.summary.totalTransactions || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Receipt className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Transaction</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {loading ? <span className="inline-block w-20 h-8 bg-gray-100 animate-pulse rounded" /> : formatPrice(data?.summary.avgTransactionValue || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Payment Breakdown + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Breakdown */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-500" />
              Payment Method Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(data?.paymentBreakdown || {}).length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No sales data available</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(data?.paymentBreakdown || {}).map(([method, info]) => {
                  const Icon = paymentMethodIcons[method] || CreditCard
                  const totalRevenue = data?.summary.totalRevenue || 1
                  const percentage = Math.round((info.revenue / totalRevenue) * 100)
                  return (
                    <div key={method}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{paymentMethodLabels[method] || method}</p>
                            <p className="text-xs text-gray-400">{info.count} transaction{info.count !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 text-sm">{formatPrice(info.revenue)}</p>
                          <p className="text-xs text-gray-400">{percentage}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
              Sales by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(data?.categoryBreakdown || {}).length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No sales data available</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(data?.categoryBreakdown || {}).map(([cat, info]) => {
                  const totalRevenue = data?.summary.totalRevenue || 1
                  const percentage = Math.round((info.revenue / totalRevenue) * 100)
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${categoryColors[cat] || 'bg-gray-500 text-white'} text-xs px-2 py-1`}>
                            {categoryLabels[cat] || cat}
                          </Badge>
                          <span className="text-xs text-gray-400">{info.quantity} item{info.quantity !== 1 ? 's' : ''} sold</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 text-sm">{formatPrice(info.revenue)}</p>
                          <p className="text-xs text-gray-400">{percentage}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Best Selling Items */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Best Selling Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.bestSellingItems || data.bestSellingItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No items sold yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 font-semibold text-gray-500 text-xs uppercase tracking-wider">Rank</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-500 text-xs uppercase tracking-wider">Item Name</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-500 text-xs uppercase tracking-wider">Category</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-500 text-xs uppercase tracking-wider">Qty Sold</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-500 text-xs uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bestSellingItems.slice(0, 20).map((item, index) => (
                    <tr key={`${item.itemId}-${index}`} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-600' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-medium text-gray-900">{item.itemName}</td>
                      <td className="py-3 px-2">
                        <Badge className={`${categoryColors[item.category] || 'bg-gray-500 text-white'} text-[10px] px-1.5 py-0.5`}>
                          {categoryLabels[item.category] || item.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right font-semibold text-gray-900">{item.totalQuantity}</td>
                      <td className="py-3 px-2 text-right font-bold text-orange-600">{formatPrice(item.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Sales Chart (Visual Bar Chart) */}
      {data?.dailySales && data.dailySales.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-500" />
              Daily Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
              {data.dailySales.map((day) => {
                const maxRevenue = Math.max(...data.dailySales.map(d => d.revenue), 1)
                const heightPercent = Math.max((day.revenue / maxRevenue) * 100, 4)
                return (
                  <div key={day.date} className="flex flex-col items-center min-w-[40px] flex-1 group">
                    <div className="relative w-full flex justify-center">
                      <div
                        className="w-6 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-md hover:from-orange-600 hover:to-orange-500 transition-all duration-200 cursor-pointer relative group"
                        style={{ height: `${heightPercent}%` }}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {formatDate(day.date)}: {formatPrice(day.revenue)} ({day.transactions})
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 whitespace-nowrap">
                      {new Date(day.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders / Sales History */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Sales History
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search orders, customers, items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white border-gray-200 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">{searchQuery ? 'No matching orders found' : 'No sales recorded yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 font-semibold text-gray-500 text-xs uppercase tracking-wider">Order #</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-500 text-xs uppercase tracking-wider">Items</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-500 text-xs uppercase tracking-wider">Payment</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-500 text-xs uppercase tracking-wider">Total</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-500 text-xs uppercase tracking-wider">Date</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-500 text-xs uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.slice(0, 50).map((order) => {
                    const PaymentIcon = paymentMethodIcons[order.paymentMethod] || CreditCard
                    return (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2">
                          <span className="font-mono font-semibold text-gray-900 text-xs">{order.orderNumber}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-gray-700">{order.customerName}</span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-700 font-medium">{order.itemCount}</span>
                            <span className="text-gray-400 text-xs">item{order.itemCount !== 1 ? 's' : ''}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5">
                            <PaymentIcon className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-600 text-xs">{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="font-bold text-orange-600">{formatPrice(order.totalAmount)}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-gray-500 text-xs">{formatDateTime(order.createdAt)}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedOrder(order); setOrderDialogOpen(true) }}
                            className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 h-7 px-2"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogTitle>Order Details</DialogTitle>
          {selectedOrder && (
            <div className="mt-4 space-y-4">
              {/* Order Header */}
              <div className="flex items-center justify-between bg-orange-50 rounded-lg p-4">
                <div>
                  <p className="font-mono font-bold text-gray-900">{selectedOrder.orderNumber}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(selectedOrder.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">{formatPrice(selectedOrder.totalAmount)}</p>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    {(() => {
                      const Icon = paymentMethodIcons[selectedOrder.paymentMethod] || CreditCard
                      return <Icon className="w-3.5 h-3.5 text-gray-500" />
                    })()}
                    <span className="text-xs text-gray-500">{paymentMethodLabels[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Customer & Staff Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cashier</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedOrder.staffName || 'N/A'}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Items Ordered</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Item</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">Qty</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Price</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="border-b last:border-b-0">
                          <td className="py-2 px-3">
                            <p className="text-gray-900">{item.itemName}</p>
                            {item.size && <p className="text-[10px] text-gray-400">Size: {item.size}</p>}
                          </td>
                          <td className="py-2 px-3 text-center text-gray-600">{item.quantity}</td>
                          <td className="py-2 px-3 text-right text-gray-600">{formatPrice(item.price)}</td>
                          <td className="py-2 px-3 text-right font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <span className="font-bold text-gray-900">Grand Total</span>
                <span className="text-xl font-bold text-orange-600">{formatPrice(selectedOrder.totalAmount)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

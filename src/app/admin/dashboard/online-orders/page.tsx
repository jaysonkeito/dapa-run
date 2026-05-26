'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Package,
  Search,
  Filter,
  Loader2,
  Eye,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'

interface MerchOrderItem {
  id: string
  itemId: string
  itemName: string
  price: number
  quantity: number
  size: string | null
  image: string | null
}

interface MerchOrder {
  id: string
  orderNumber: string
  totalAmount: number
  paymentStatus: string
  paymentMethod: string | null
  paymentReference: string | null
  paidAt: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  items: MerchOrderItem[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: typeof CheckCircle }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200', icon: Clock },
  paid: { label: 'Paid', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200', icon: CheckCircle },
  failed: { label: 'Failed', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200', icon: XCircle },
  refunded: { label: 'Refunded', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', icon: RotateCcw },
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  gcash: 'GCash',
  maya: 'Maya',
  grabpay: 'GrabPay',
}

export default function OnlineOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<MerchOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<MerchOrder | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ordersPerPage = 10

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, searchQuery])

  async function fetchOrders() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/admin/merch-orders?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Stats
  const totalOrders = orders.length
  const paidOrders = orders.filter(o => o.paymentStatus === 'paid')
  const pendingOrders = orders.filter(o => o.paymentStatus === 'pending')
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0)

  // Pagination
  const totalPages = Math.ceil(orders.length / ordersPerPage)
  const paginatedOrders = orders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  )

  const openOrderDetail = (order: MerchOrder) => {
    setSelectedOrder(order)
    setDetailDialogOpen(true)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Online Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Merchandise orders from online e-wallet payments</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Orders</p>
                <p className="text-lg font-bold text-gray-900">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Paid</p>
                <p className="text-lg font-bold text-gray-900">{paidOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-lg font-bold text-gray-900">{pendingOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-lg font-bold text-gray-900">₱{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by order #, customer name, or email..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1) }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Order #</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Customer</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Items</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Total</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Payment</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedOrders.map((order) => {
                    const statusConfig = STATUS_CONFIG[order.paymentStatus] || STATUS_CONFIG.pending
                    const StatusIcon = statusConfig.icon
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono font-semibold text-gray-900">{order.orderNumber}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{order.user.name}</p>
                            <p className="text-xs text-gray-500">{order.user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-900">₱{order.totalAmount.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod : '—'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={`${statusConfig.bgColor} ${statusConfig.color} border text-xs font-semibold`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openOrderDetail(order)}
                            className="text-orange-500 hover:text-orange-600"
                          >
                            <Eye className="w-4 h-4 mr-1" />
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * ordersPerPage + 1}-{Math.min(currentPage * ordersPerPage, orders.length)} of {orders.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-700">{currentPage} / {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogTitle>Order Details</DialogTitle>
          {selectedOrder && (
            <div className="space-y-4 mt-4">
              {/* Order Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-bold text-gray-900">{selectedOrder.orderNumber}</p>
                  <p className="text-xs text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`${STATUS_CONFIG[selectedOrder.paymentStatus]?.bgColor} ${STATUS_CONFIG[selectedOrder.paymentStatus]?.color} border text-xs font-semibold`}
                >
                  {STATUS_CONFIG[selectedOrder.paymentStatus]?.label || selectedOrder.paymentStatus}
                </Badge>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Customer</p>
                <p className="text-sm font-medium text-gray-900">{selectedOrder.user.name}</p>
                <p className="text-sm text-gray-500">{selectedOrder.user.email}</p>
              </div>

              {/* Payment Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Payment</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {selectedOrder.paymentMethod ? PAYMENT_METHOD_LABELS[selectedOrder.paymentMethod] || selectedOrder.paymentMethod : 'N/A'}
                  </span>
                  <span className="text-lg font-bold text-orange-600">₱{selectedOrder.totalAmount.toLocaleString()}</span>
                </div>
                {selectedOrder.paymentReference && (
                  <p className="text-xs text-gray-400 mt-1">Ref: {selectedOrder.paymentReference}</p>
                )}
                {selectedOrder.paidAt && (
                  <p className="text-xs text-green-600 mt-1">Paid: {formatDate(selectedOrder.paidAt)}</p>
                )}
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                        {item.image && <img src={item.image} alt={item.itemName} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.itemName}</p>
                        <p className="text-xs text-gray-500">
                          {item.size ? `Size: ${item.size} · ` : ''}Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 shrink-0">
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

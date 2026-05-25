'use client'

import { useState, useEffect, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  LayoutDashboard,
  Users,
  Calendar,
  ShoppingBag,
  ClipboardList,
  Trophy,
  Receipt,
  UserCheck,
  Settings,
  FileText,
  LogOut,
  Search,
  Edit3,
  Trash2,
  Loader2,
  ChevronRight,
  X,
  Save,
  AlertCircle,
  Database,
  Activity,
  Eye,
  Plus,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type TabKey = 'dashboard' | 'users' | 'events' | 'merch' | 'registrations' | 'results' | 'posOrders' | 'onsiteRegistrations' | 'settings' | 'logs'

interface SidebarItem {
  key: TabKey
  label: string
  icon: React.ElementType
}

const sidebarItems: SidebarItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'events', label: 'Events', icon: Calendar },
  { key: 'merch', label: 'Inventory', icon: ShoppingBag },
  { key: 'registrations', label: 'Registrations', icon: ClipboardList },
  { key: 'results', label: 'Race Results', icon: Trophy },
  { key: 'posOrders', label: 'Sales Counter Orders', icon: Receipt },
  { key: 'onsiteRegistrations', label: 'On-Site Reg.', icon: UserCheck },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'logs', label: 'System Logs', icon: FileText },
]

// Field configurations for each model - what to display and what's editable
interface FieldConfig {
  key: string
  label: string
  editable: boolean
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea'
  options?: string[]
  hide?: boolean
}

const fieldConfigs: Record<string, FieldConfig[]> = {
  users: [
    { key: 'id', label: 'ID', editable: false, type: 'text' },
    { key: 'email', label: 'Email', editable: true, type: 'text' },
    { key: 'name', label: 'Name', editable: true, type: 'text' },
    { key: 'role', label: 'Role', editable: true, type: 'select', options: ['user', 'staff', 'admin', 'developer'] },
    { key: 'phone', label: 'Phone', editable: true, type: 'text' },
    { key: 'password', label: 'Password', editable: false, type: 'text', hide: true },
    { key: 'createdAt', label: 'Created', editable: false, type: 'text' },
    { key: 'updatedAt', label: 'Updated', editable: false, type: 'text' },
  ],
  events: [
    { key: 'id', label: 'ID', editable: false, type: 'text' },
    { key: 'title', label: 'Title', editable: true, type: 'text' },
    { key: 'date', label: 'Date', editable: true, type: 'text' },
    { key: 'time', label: 'Time', editable: true, type: 'text' },
    { key: 'location', label: 'Location', editable: true, type: 'text' },
    { key: 'priceRange', label: 'Price Range', editable: true, type: 'text' },
    { key: 'distances', label: 'Distances', editable: true, type: 'text' },
    { key: 'description', label: 'Description', editable: true, type: 'textarea' },
    { key: 'status', label: 'Status', editable: true, type: 'select', options: ['upcoming', 'ongoing', 'completed', 'cancelled'] },
    { key: 'featured', label: 'Featured', editable: true, type: 'boolean' },
    { key: 'image', label: 'Image', editable: true, type: 'text' },
    { key: 'basePrice', label: 'Registration Fee', editable: true, type: 'number' },
    { key: 'finisherShirtPrice', label: 'Finisher Shirt Price', editable: true, type: 'number' },
    { key: 'singletPrice', label: 'Singlet Price', editable: true, type: 'number' },
    { key: 'regCloseDate', label: 'Reg Close Date', editable: true, type: 'text' },
    { key: 'regCloseTime', label: 'Reg Close Time', editable: true, type: 'text' },
    { key: 'finisherShirtSizes', label: 'Finisher Shirt Sizes', editable: true, type: 'text' },
    { key: 'singletSizes', label: 'Singlet Sizes', editable: true, type: 'text' },
    { key: 'createdAt', label: 'Created', editable: false, type: 'text' },
    { key: 'updatedAt', label: 'Updated', editable: false, type: 'text' },
  ],
  merch: [
    { key: 'id', label: 'ID', editable: false, type: 'text' },
    { key: 'name', label: 'Name', editable: true, type: 'text' },
    { key: 'price', label: 'Price', editable: true, type: 'number' },
    { key: 'category', label: 'Category', editable: true, type: 'text' },
    { key: 'description', label: 'Description', editable: true, type: 'textarea' },
    { key: 'sizes', label: 'Sizes', editable: true, type: 'text' },
    { key: 'badge', label: 'Badge', editable: true, type: 'text' },
    { key: 'stock', label: 'Stock', editable: true, type: 'number' },
    { key: 'soldCount', label: 'Sold Count', editable: true, type: 'number' },
    { key: 'image', label: 'Image', editable: true, type: 'text' },
    { key: 'createdAt', label: 'Created', editable: false, type: 'text' },
    { key: 'updatedAt', label: 'Updated', editable: false, type: 'text' },
  ],
  registrations: [
    { key: 'id', label: 'ID', editable: false, type: 'text' },
    { key: 'userId', label: 'User ID', editable: false, type: 'text' },
    { key: 'eventId', label: 'Event ID', editable: false, type: 'text' },
    { key: 'distance', label: 'Distance', editable: true, type: 'text' },
    { key: 'finisherShirtSize', label: 'Finisher Shirt', editable: true, type: 'text' },
    { key: 'singletSize', label: 'Singlet Size', editable: true, type: 'text' },
    { key: 'totalAmount', label: 'Total Amount', editable: true, type: 'number' },
    { key: 'user', label: 'User', editable: false, type: 'text' },
    { key: 'event', label: 'Event', editable: false, type: 'text' },
    { key: 'createdAt', label: 'Created', editable: false, type: 'text' },
  ],
  results: [
    { key: 'id', label: 'ID', editable: false, type: 'text' },
    { key: 'eventId', label: 'Event ID', editable: false, type: 'text' },
    { key: 'distance', label: 'Distance', editable: true, type: 'text' },
    { key: 'finishers', label: 'Finishers', editable: true, type: 'textarea' },
    { key: 'event', label: 'Event', editable: false, type: 'text' },
    { key: 'createdAt', label: 'Created', editable: false, type: 'text' },
  ],
  posOrders: [
    { key: 'id', label: 'ID', editable: false, type: 'text' },
    { key: 'orderNumber', label: 'Order #', editable: false, type: 'text' },
    { key: 'totalAmount', label: 'Total', editable: true, type: 'number' },
    { key: 'paymentMethod', label: 'Payment', editable: true, type: 'select', options: ['cash', 'gcash', 'card'] },
    { key: 'customerName', label: 'Customer', editable: true, type: 'text' },
    { key: 'staffName', label: 'Staff', editable: true, type: 'text' },
    { key: 'items', label: 'Items', editable: false, type: 'text' },
    { key: 'createdAt', label: 'Created', editable: false, type: 'text' },
  ],
  onsiteRegistrations: [
    { key: 'id', label: 'ID', editable: false, type: 'text' },
    { key: 'eventId', label: 'Event ID', editable: false, type: 'text' },
    { key: 'participantName', label: 'Name', editable: true, type: 'text' },
    { key: 'participantEmail', label: 'Email', editable: true, type: 'text' },
    { key: 'participantPhone', label: 'Phone', editable: true, type: 'text' },
    { key: 'distance', label: 'Distance', editable: true, type: 'text' },
    { key: 'paymentMethod', label: 'Payment', editable: true, type: 'select', options: ['cash', 'gcash', 'card'] },
    { key: 'amountPaid', label: 'Amount Paid', editable: true, type: 'number' },
    { key: 'finisherShirtSize', label: 'Finisher Shirt', editable: true, type: 'text' },
    { key: 'singletSize', label: 'Singlet', editable: true, type: 'text' },
    { key: 'staffName', label: 'Staff', editable: true, type: 'text' },
    { key: 'event', label: 'Event', editable: false, type: 'text' },
    { key: 'createdAt', label: 'Created', editable: false, type: 'text' },
  ],
  settings: [
    { key: 'id', label: 'ID', editable: false, type: 'text' },
    { key: 'key', label: 'Key', editable: true, type: 'text' },
    { key: 'value', label: 'Value', editable: true, type: 'textarea' },
    { key: 'createdAt', label: 'Created', editable: false, type: 'text' },
    { key: 'updatedAt', label: 'Updated', editable: false, type: 'text' },
  ],
}

// Table display columns (which fields to show in the table, subset of all fields)
const tableColumns: Record<string, string[]> = {
  users: ['id', 'email', 'name', 'role', 'phone', 'createdAt'],
  events: ['id', 'title', 'date', 'location', 'status', 'featured', 'basePrice'],
  merch: ['id', 'name', 'price', 'category', 'stock', 'soldCount'],
  registrations: ['id', 'distance', 'totalAmount', 'user', 'event', 'createdAt'],
  results: ['id', 'distance', 'event', 'createdAt'],
  posOrders: ['id', 'orderNumber', 'totalAmount', 'paymentMethod', 'customerName', 'createdAt'],
  onsiteRegistrations: ['id', 'participantName', 'distance', 'amountPaid', 'event', 'createdAt'],
  settings: ['id', 'key', 'value'],
}

function formatCellValue(value: unknown, key: string): string {
  if (value === null || value === undefined) return '—'
  if (key === 'password') return '••••••••'
  if (typeof value === 'object') {
    if (key === 'user' && value && typeof value === 'object') {
      const u = value as Record<string, unknown>
      return `${u.name || ''} (${u.email || ''})`
    }
    if (key === 'event' && value && typeof value === 'object') {
      const e = value as Record<string, unknown>
      return `${e.title || ''}`
    }
    if (key === 'items' && Array.isArray(value)) {
      return `${value.length} item(s)`
    }
    return JSON.stringify(value)
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value instanceof Date) return value.toLocaleString()
  if (typeof value === 'string' && (key.includes('At') || key.includes('Date'))) {
    try {
      const d = new Date(value)
      if (!isNaN(d.getTime())) return d.toLocaleString()
    } catch {}
  }
  if (typeof value === 'number' && (key.toLowerCase().includes('price') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('paid'))) {
    return `₱${value.toLocaleString()}`
  }
  return String(value)
}

function truncateId(id: string): string {
  if (!id) return '—'
  return id.length > 12 ? `${id.slice(0, 8)}...` : id
}

export default function DeveloperPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<Record<string, unknown> | null>(null)
  const [editFormData, setEditFormData] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteRecord, setDeleteRecord] = useState<Record<string, unknown> | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [stats, setStats] = useState<Record<string, number>>({})
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [logs, setLogs] = useState<Record<string, unknown>[]>([])
  const [addRecordOpen, setAddRecordOpen] = useState(false)
  const [addFormData, setAddFormData] = useState<Record<string, unknown>>({})
  const [adding, setAdding] = useState(false)
  const { toast } = useToast()

  const fetchData = useCallback(async (model: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/settings?devModel=${model}`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
      } else {
        toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings?devModel=stats')
      if (res.ok) {
        const result = await res.json()
        setStats(result)
      }
    } catch {}
  }, [])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings?devModel=logs')
      if (res.ok) {
        const result = await res.json()
        setLogs(result)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch logs', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats()
    } else if (activeTab === 'logs') {
      fetchLogs()
    } else {
      fetchData(activeTab)
    }
    setSearchQuery('')
  }, [activeTab, fetchData, fetchStats, fetchLogs])

  const handleEdit = (record: Record<string, unknown>) => {
    setEditRecord(record)
    setEditFormData({ ...record })
    setEditModalOpen(true)
  }

  const handleSave = async () => {
    if (!editRecord) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          devUpdate: true,
          model: activeTab,
          id: editRecord.id,
          data: editFormData,
        }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast({ title: 'Success', description: 'Record updated successfully' })
        setEditModalOpen(false)
        setEditRecord(null)
        setEditFormData({})
        // Refresh data
        if (activeTab === 'logs') {
          fetchLogs()
        } else {
          fetchData(activeTab)
        }
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to update', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/admin/login' })
  }

  const handleAddRecord = () => {
    const fields = fieldConfigs[activeTab] || []
    const initial: Record<string, unknown> = {}
    fields.forEach(f => {
      if (f.editable) {
        if (f.type === 'number') initial[f.key] = 0
        else if (f.type === 'boolean') initial[f.key] = false
        else initial[f.key] = ''
      }
    })
    setAddFormData(initial)
    setAddRecordOpen(true)
  }

  const handleAddSave = async () => {
    if (!activeTab) return
    setAdding(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          devCreate: true,
          model: activeTab,
          data: addFormData,
        }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast({ title: 'Record Created', description: 'New record has been created successfully.' })
        setAddRecordOpen(false)
        setAddFormData({})
        fetchData(activeTab)
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to create record', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteRecord || !activeTab) return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          devDelete: true,
          model: activeTab,
          id: deleteRecord.id,
        }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast({ title: 'Record Deleted', description: 'The record has been permanently deleted.' })
        setDeleteConfirmOpen(false)
        setDeleteRecord(null)
        // Refresh data
        if (activeTab === 'logs') {
          fetchLogs()
        } else {
          fetchData(activeTab)
        }
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to delete', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const getFilteredData = () => {
    if (!searchQuery) return data
    const q = searchQuery.toLowerCase()
    return data.filter((row) =>
      Object.values(row).some((val) => {
        if (val === null || val === undefined) return false
        if (typeof val === 'object') {
          return JSON.stringify(val).toLowerCase().includes(q)
        }
        return String(val).toLowerCase().includes(q)
      })
    )
  }

  const filteredData = getFilteredData()
  const currentFields = fieldConfigs[activeTab] || []
  const currentColumns = tableColumns[activeTab] || []

  const statCards = [
    { key: 'users', label: 'Total Users', icon: Users, color: 'from-blue-500 to-blue-600' },
    { key: 'events', label: 'Total Events', icon: Calendar, color: 'from-orange-500 to-orange-600' },
    { key: 'registrations', label: 'Registrations', icon: ClipboardList, color: 'from-green-500 to-green-600' },
    { key: 'merch', label: 'Inventory Items', icon: ShoppingBag, color: 'from-purple-500 to-purple-600' },
    { key: 'results', label: 'Race Results', icon: Trophy, color: 'from-yellow-500 to-yellow-600' },
    { key: 'posOrders', label: 'Sales Counter Orders', icon: Receipt, color: 'from-pink-500 to-pink-600' },
    { key: 'onsiteRegistrations', label: 'On-Site Reg.', icon: UserCheck, color: 'from-teal-500 to-teal-600' },
    { key: 'settings', label: 'Settings', icon: Settings, color: 'from-gray-500 to-gray-600' },
  ]

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-gray-900 text-white flex flex-col transition-all duration-300 fixed h-full z-40`}>
        {/* Sidebar Header */}
        <div
          className={`p-4 border-b border-gray-800 relative group/header ${sidebarCollapsed ? 'cursor-pointer' : ''}`}
          onClick={() => { if (sidebarCollapsed) setSidebarCollapsed(false) }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src="/dapa-run-logo.png" alt="DAPA RUN" className="w-full h-full object-cover" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1">
                <h1 className="font-bold text-lg tracking-tight whitespace-nowrap">DAPA RUN</h1>
                <p className="text-gray-400 text-[0.55em] whitespace-nowrap font-light -mt-0.5" style={{ letterSpacing: '0.45em' }}>DUMAGUETE</p>
                <p className="text-[10px] text-orange-400 font-medium mt-0.5">Developer Panel</p>
              </div>
            )}
            {/* Collapse button - shown on hover when expanded */}
            {!sidebarCollapsed && (
              <button
                onClick={(e) => { e.stopPropagation(); setSidebarCollapsed(true) }}
                className="opacity-0 group-hover/header:opacity-100 transition-opacity duration-200 p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white"
                title="Collapse sidebar"
              >
                <ChevronRight className="w-3 h-3 rotate-180" />
              </button>
            )}
            {/* Expand hint on hover when collapsed */}
            {sidebarCollapsed && (
              <div className="absolute inset-0 bg-gray-800/0 group-hover/header:bg-gray-800/50 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover/header:opacity-100 pointer-events-none">
                <ChevronRight className="w-3 h-3 text-gray-300" />
              </div>
            )}
          </div>
        </div>

        {/* Navigation + Sign Out in scrollable area */}
        <nav className="flex-1 py-3 overflow-y-auto px-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.key
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-3 ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'} py-2.5 text-left transition-all duration-200 group ${
                  isActive
                    ? 'bg-orange-500/15 text-orange-400 border-r-2 border-orange-500'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-orange-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
              </button>
            )
          })}

          {/* Sign Out - inside scrollable area */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-3 ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'} py-2.5 text-left text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-all duration-200`}
              title={sidebarCollapsed ? 'Sign Out' : undefined}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-sm font-medium">Sign Out</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {sidebarItems.find(i => i.key === activeTab)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {activeTab === 'dashboard' ? 'Overview of your database' : `${filteredData.length} record${filteredData.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
            {activeTab !== 'dashboard' && activeTab !== 'logs' && (
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <Button
                  onClick={handleAddRecord}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold h-9"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Record
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => {
                  const Icon = card.icon
                  return (
                    <Card key={card.key} className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab(card.key as TabKey)}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats[card.key] ?? '—'}</p>
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

              {/* Quick Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Database className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Database Overview</h3>
                        <p className="text-xs text-gray-500">SQLite via Prisma ORM</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Records</span>
                        <span className="font-semibold text-gray-900">{Object.values(stats).reduce((a, b) => a + b, 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Models</span>
                        <span className="font-semibold text-gray-900">{Object.keys(stats).length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Developer Access</h3>
                        <p className="text-xs text-gray-500">Full database viewer & editor</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Eye className="w-3.5 h-3.5 text-green-500" />
                        <span>View all records</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                        <span>Edit records (changes are logged)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        <span>Delete records (changes are logged)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* System Logs View */}
          {activeTab === 'logs' && (
            <Card className="border-0 shadow-md">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <FileText className="w-12 h-12 mb-3" />
                    <p className="font-medium">No system logs yet</p>
                    <p className="text-sm">Logs will appear when records are edited</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Timestamp</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Action</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Model</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Record ID</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Performer</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Role</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Changes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => {
                          const logId = String(log.id)
                          const isExpanded = expandedLogId === logId
                          return (
                            <tr key={logId} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="px-5 py-3 text-sm text-gray-600">
                                {log.createdAt ? new Date(String(log.createdAt)).toLocaleString() : '—'}
                              </td>
                              <td className="px-5 py-3">
                                <Badge className={`${
                                  String(log.action) === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                                  String(log.action) === 'CREATE' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-700'
                                } text-xs font-medium`}>
                                  {String(log.action)}
                                </Badge>
                              </td>
                              <td className="px-5 py-3 text-sm font-medium text-gray-900">{String(log.model)}</td>
                              <td className="px-5 py-3 text-sm text-gray-500 font-mono">{truncateId(String(log.recordId || ''))}</td>
                              <td className="px-5 py-3 text-sm text-gray-700">{String(log.performerName || '—')}</td>
                              <td className="px-5 py-3">
                                <Badge variant="outline" className="text-xs">{String(log.performerRole || '—')}</Badge>
                              </td>
                              <td className="px-5 py-3">
                                <button
                                  onClick={() => setExpandedLogId(isExpanded ? null : logId)}
                                  className="text-orange-500 hover:text-orange-600 text-xs font-medium flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  {isExpanded ? 'Hide' : 'View'}
                                </button>
                                {isExpanded && log.changes && (
                                  <pre className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 max-w-xs overflow-auto max-h-32">
                                    {(() => {
                                      try {
                                        return JSON.stringify(JSON.parse(String(log.changes)), null, 2)
                                      } catch {
                                        return String(log.changes)
                                      }
                                    })()}
                                  </pre>
                                )}
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
          )}

          {/* Data Table View */}
          {activeTab !== 'dashboard' && activeTab !== 'logs' && (
            <Card className="border-0 shadow-md">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  </div>
                ) : filteredData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Database className="w-12 h-12 mb-3" />
                    <p className="font-medium">No records found</p>
                    <p className="text-sm">{searchQuery ? 'Try a different search term' : 'This table is empty'}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {currentColumns.map((col) => {
                            const field = currentFields.find(f => f.key === col)
                            return (
                              <th key={col} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                                {field?.label || col}
                              </th>
                            )
                          })}
                          <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((row, idx) => (
                          <tr key={String(row.id || idx)} className={`border-b border-gray-50 hover:bg-orange-50/30 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                            {currentColumns.map((col) => (
                              <td key={col} className="px-5 py-3 text-sm">
                                {col === 'id' ? (
                                  <span className="font-mono text-xs text-gray-400">{truncateId(String(row[col] || ''))}</span>
                                ) : col === 'role' ? (
                                  <Badge className={`${
                                    String(row[col]) === 'admin' ? 'bg-orange-100 text-orange-700' :
                                    String(row[col]) === 'staff' ? 'bg-blue-100 text-blue-700' :
                                    String(row[col]) === 'developer' ? 'bg-purple-100 text-purple-700' :
                                    'bg-gray-100 text-gray-700'
                                  } text-xs font-medium`}>
                                    {String(row[col])}
                                  </Badge>
                                ) : col === 'status' ? (
                                  <Badge className={`${
                                    String(row[col]) === 'upcoming' ? 'bg-green-100 text-green-700' :
                                    String(row[col]) === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                                    String(row[col]) === 'completed' ? 'bg-gray-100 text-gray-700' :
                                    String(row[col]) === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                  } text-xs font-medium`}>
                                    {String(row[col])}
                                  </Badge>
                                ) : col === 'featured' ? (
                                  <Badge className={`${row[col] ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'} text-xs font-medium`}>
                                    {row[col] ? 'Yes' : 'No'}
                                  </Badge>
                                ) : col === 'value' ? (
                                  <span className="text-gray-700 max-w-[200px] truncate block">{String(row[col] || '—').slice(0, 80)}{String(row[col] || '').length > 80 ? '...' : ''}</span>
                                ) : (
                                  <span className="text-gray-700">{formatCellValue(row[col], col)}</span>
                                )}
                              </td>
                            ))}
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(row)}
                                  className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 h-8 px-3"
                                >
                                  <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { setDeleteRecord(row); setDeleteConfirmOpen(true) }}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-3"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogTitle>Edit Record</DialogTitle>
          <div className="mt-4 space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-orange-700">
                Changes and deletions are logged to the System Log. Password fields cannot be edited here. Delete with caution.
              </p>
            </div>
            {currentFields.filter(f => !f.hide).map((field) => {
              const value = editFormData[field.key]
              const isObject = value !== null && value !== undefined && typeof value === 'object'
              
              return (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    {field.label}
                    {field.editable ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">editable</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-gray-400 border-gray-200">read-only</Badge>
                    )}
                  </label>
                  {field.editable && !isObject ? (
                    field.type === 'textarea' ? (
                      <textarea
                        value={String(value || '')}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-y min-h-[80px]"
                        rows={3}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={String(value || '')}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                      >
                        <option value="">Select...</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'boolean' ? (
                      <select
                        value={value ? 'true' : 'false'}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, [field.key]: e.target.value === 'true' }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : (
                      <Input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={String(value ?? '')}
                        onChange={(e) => setEditFormData(prev => ({ 
                          ...prev, 
                          [field.key]: field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value 
                        }))}
                        className="text-sm"
                      />
                    )
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100">
                      {isObject ? JSON.stringify(value) : formatCellValue(value, field.key)}
                    </div>
                  )}
                </div>
              )
            })}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={saving}>
                <X className="w-4 h-4 mr-1.5" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Record Dialog */}
      <Dialog open={addRecordOpen} onOpenChange={setAddRecordOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogTitle>Add Record — {activeTab}</DialogTitle>
          <div className="mt-4 space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-orange-700">
                Creating a new record in the {activeTab} model. Fill in the editable fields below.
              </p>
            </div>
            {(fieldConfigs[activeTab] || []).filter(f => f.editable).map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={String(addFormData[field.key] || '')}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-y min-h-[80px]"
                    rows={3}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={String(addFormData[field.key] || '')}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="">Select...</option>
                    {(field.options || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'boolean' ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!addFormData[field.key]}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, [field.key]: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-600">{field.label}</span>
                  </label>
                ) : field.type === 'number' ? (
                  <Input
                    type="number"
                    value={addFormData[field.key] !== undefined ? String(addFormData[field.key]) : ''}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, [field.key]: Number(e.target.value) || 0 }))}
                    className="h-9 text-sm"
                  />
                ) : (
                  <Input
                    type="text"
                    value={String(addFormData[field.key] || '')}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="h-9 text-sm"
                  />
                )}
              </div>
            ))}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setAddRecordOpen(false)}>Cancel</Button>
              <Button
                onClick={handleAddSave}
                disabled={adding}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
              >
                {adding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Delete Record</DialogTitle>
          <div className="mt-4 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700">This action cannot be undone</p>
                <p className="text-xs text-red-600 mt-1">
                  This record will be permanently deleted from the database. The deletion will be logged in the System Log.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Record ID</p>
              <p className="text-sm font-mono text-gray-700">{String(deleteRecord?.id || '')}</p>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold"
              >
                {deleting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
                Delete Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

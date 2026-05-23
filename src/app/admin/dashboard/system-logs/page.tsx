'use client'

import { useEffect, useState, useCallback } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Search, RefreshCw, ChevronLeft, ChevronRight, FileText } from 'lucide-react'

interface SystemLog {
  id: string
  action: string
  category: string
  description: string
  userId: string | null
  userName: string | null
  userRole: string | null
  details: string | null
  createdAt: string
}

const categoryColors: Record<string, string> = {
  events: 'bg-orange-500 text-white',
  inventory: 'bg-purple-500 text-white',
  pos: 'bg-cyan-500 text-white',
  registrations: 'bg-blue-500 text-white',
  users: 'bg-emerald-500 text-white',
  settings: 'bg-gray-500 text-white',
  auth: 'bg-red-500 text-white',
  results: 'bg-yellow-500 text-white',
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (actionFilter !== 'all') params.set('action', actionFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/system-logs?${params}`)
      const data = await res.json()
      setLogs(data.logs || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }, [page, categoryFilter, actionFilter, search])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchLogs, 30000)
    return () => clearInterval(interval)
  }, [fetchLogs])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ')
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-500 mt-1">Monitor all system activities and changes</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" className="font-semibold">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="events">Events</SelectItem>
            <SelectItem value="inventory">Inventory</SelectItem>
            <SelectItem value="pos">POS</SelectItem>
            <SelectItem value="registrations">Registrations</SelectItem>
            <SelectItem value="users">Users</SelectItem>
            <SelectItem value="settings">Settings</SelectItem>
            <SelectItem value="auth">Auth</SelectItem>
            <SelectItem value="results">Results</SelectItem>
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="CREATE_EVENT">Create Event</SelectItem>
            <SelectItem value="UPDATE_EVENT">Update Event</SelectItem>
            <SelectItem value="DELETE_EVENT">Delete Event</SelectItem>
            <SelectItem value="CREATE_MERCH">Create Inventory</SelectItem>
            <SelectItem value="UPDATE_MERCH">Update Inventory</SelectItem>
            <SelectItem value="DELETE_MERCH">Delete Inventory</SelectItem>
            <SelectItem value="POS_SALE">POS Sale</SelectItem>
            <SelectItem value="ONSITE_REG">On-site Registration</SelectItem>
            <SelectItem value="USER_LOGIN">User Login</SelectItem>
            <SelectItem value="USER_LOGOUT">User Logout</SelectItem>
            <SelectItem value="CREATE_USER">Create User</SelectItem>
            <SelectItem value="UPDATE_USER">Update User</SelectItem>
            <SelectItem value="DELETE_USER">Delete User</SelectItem>
            <SelectItem value="CHANGE_PASSWORD">Change Password</SelectItem>
            <SelectItem value="UPDATE_SETTINGS">Update Settings</SelectItem>
            <SelectItem value="CREATE_RESULT">Create Result</SelectItem>
            <SelectItem value="UPDATE_RESULT">Update Result</SelectItem>
            <SelectItem value="DELETE_RESULT">Delete Result</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search logs..."
            className="w-[200px]"
          />
          <Button onClick={handleSearch} variant="outline" size="icon">
            <Search className="w-4 h-4" />
          </Button>
        </div>
        <span className="flex items-center text-sm text-gray-500">{total} total logs</span>
      </div>

      <div className="bg-white rounded-xl shadow-md border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No system logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-gray-600 whitespace-nowrap">{formatDate(log.createdAt)}</TableCell>
                    <TableCell className="text-sm font-medium">{log.userName || 'System'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {log.userRole || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={categoryColors[log.category] || 'bg-gray-500 text-white'}>
                        {log.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatAction(log.action)}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs truncate">{log.description}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

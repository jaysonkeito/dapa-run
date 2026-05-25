'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Search, RefreshCw, ChevronLeft, ChevronRight, Database, Check, X, Pencil, Trash2 } from 'lucide-react'

interface TableInfo {
  model: string
  label: string
  count: number
}

interface ColumnInfo {
  key: string
  label: string
  editable: boolean
  type: 'string' | 'number' | 'date' | 'boolean'
}

const modelColumns: Record<string, ColumnInfo[]> = {
  'settings': [
    { key: 'id', label: 'ID', editable: false, type: 'string' },
    { key: 'key', label: 'Key', editable: false, type: 'string' },
    { key: 'value', label: 'Value', editable: true, type: 'string' },
    { key: 'createdAt', label: 'Created', editable: false, type: 'date' },
    { key: 'updatedAt', label: 'Updated', editable: false, type: 'date' },
  ],
  'users': [
    { key: 'id', label: 'ID', editable: false, type: 'string' },
    { key: 'name', label: 'Name', editable: true, type: 'string' },
    { key: 'email', label: 'Email', editable: false, type: 'string' },
    { key: 'role', label: 'Role', editable: false, type: 'string' },
    { key: 'phone', label: 'Phone', editable: true, type: 'string' },
    { key: 'createdAt', label: 'Created', editable: false, type: 'date' },
    { key: 'updatedAt', label: 'Updated', editable: false, type: 'date' },
  ],
  'events': [
    { key: 'id', label: 'ID', editable: false, type: 'string' },
    { key: 'title', label: 'Title', editable: true, type: 'string' },
    { key: 'date', label: 'Date', editable: false, type: 'string' },
    { key: 'time', label: 'Time', editable: true, type: 'string' },
    { key: 'location', label: 'Location', editable: true, type: 'string' },
    { key: 'description', label: 'Description', editable: true, type: 'string' },
    { key: 'status', label: 'Status', editable: false, type: 'string' },
    { key: 'featured', label: 'Featured', editable: false, type: 'boolean' },
    { key: 'distances', label: 'Distances', editable: true, type: 'string' },
    { key: 'priceRange', label: 'Price Range', editable: true, type: 'string' },
    { key: 'basePrice', label: 'Base Price', editable: false, type: 'number' },
    { key: 'createdAt', label: 'Created', editable: false, type: 'date' },
  ],
  'merchandise': [
    { key: 'id', label: 'ID', editable: false, type: 'string' },
    { key: 'name', label: 'Name', editable: true, type: 'string' },
    { key: 'price', label: 'Price', editable: true, type: 'number' },
    { key: 'category', label: 'Category', editable: false, type: 'string' },
    { key: 'description', label: 'Description', editable: true, type: 'string' },
    { key: 'sizes', label: 'Sizes', editable: false, type: 'string' },
    { key: 'badge', label: 'Badge', editable: true, type: 'string' },
    { key: 'stock', label: 'Stock', editable: true, type: 'number' },
    { key: 'soldCount', label: 'Sold', editable: false, type: 'number' },
    { key: 'createdAt', label: 'Created', editable: false, type: 'date' },
  ],
  'registrations': [
    { key: 'id', label: 'ID', editable: false, type: 'string' },
    { key: 'userId', label: 'User ID', editable: false, type: 'string' },
    { key: 'eventId', label: 'Event ID', editable: false, type: 'string' },
    { key: 'distance', label: 'Distance', editable: false, type: 'string' },
    { key: 'finisherShirtSize', label: 'Finisher Shirt', editable: false, type: 'string' },
    { key: 'singletSize', label: 'Singlet', editable: false, type: 'string' },
    { key: 'totalAmount', label: 'Amount', editable: false, type: 'number' },
    { key: 'createdAt', label: 'Created', editable: false, type: 'date' },
  ],
  'onsite-registrations': [
    { key: 'id', label: 'ID', editable: false, type: 'string' },
    { key: 'eventId', label: 'Event ID', editable: false, type: 'string' },
    { key: 'participantName', label: 'Name', editable: false, type: 'string' },
    { key: 'participantEmail', label: 'Email', editable: false, type: 'string' },
    { key: 'participantPhone', label: 'Phone', editable: false, type: 'string' },
    { key: 'distance', label: 'Distance', editable: false, type: 'string' },
    { key: 'paymentMethod', label: 'Payment', editable: false, type: 'string' },
    { key: 'amountPaid', label: 'Amount', editable: false, type: 'number' },
    { key: 'staffName', label: 'Staff', editable: false, type: 'string' },
    { key: 'createdAt', label: 'Created', editable: false, type: 'date' },
  ],
  'pos-orders': [
    { key: 'id', label: 'ID', editable: false, type: 'string' },
    { key: 'orderNumber', label: 'Order #', editable: false, type: 'string' },
    { key: 'totalAmount', label: 'Amount', editable: false, type: 'number' },
    { key: 'paymentMethod', label: 'Payment', editable: false, type: 'string' },
    { key: 'customerName', label: 'Customer', editable: false, type: 'string' },
    { key: 'staffName', label: 'Staff', editable: false, type: 'string' },
    { key: 'createdAt', label: 'Created', editable: false, type: 'date' },
  ],
  'race-results': [
    { key: 'id', label: 'ID', editable: false, type: 'string' },
    { key: 'eventId', label: 'Event ID', editable: false, type: 'string' },
    { key: 'distance', label: 'Distance', editable: false, type: 'string' },
    { key: 'finishers', label: 'Finishers', editable: false, type: 'string' },
    { key: 'createdAt', label: 'Created', editable: false, type: 'date' },
  ],
  'system-logs': [
    { key: 'id', label: 'ID', editable: false, type: 'string' },
    { key: 'action', label: 'Action', editable: false, type: 'string' },
    { key: 'category', label: 'Category', editable: false, type: 'string' },
    { key: 'description', label: 'Description', editable: false, type: 'string' },
    { key: 'userName', label: 'User', editable: false, type: 'string' },
    { key: 'userRole', label: 'Role', editable: false, type: 'string' },
    { key: 'createdAt', label: 'Created', editable: false, type: 'date' },
  ],
}

export default function DatabaseBrowserPage() {
  const { toast } = useToast()
  const [tables, setTables] = useState<TableInfo[]>([])
  const [activeTab, setActiveTab] = useState('settings')
  const [records, setRecords] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [readOnly, setReadOnly] = useState(false)

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch table overview
  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch('/api/admin-developer/database')
      const data = await res.json()
      setTables(data.tables || [])
    } catch (error) {
      console.error('Failed to fetch tables:', error)
    }
  }, [])

  // Fetch records for active tab
  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin-developer/database/${activeTab}?${params}`)
      const data = await res.json()
      setRecords(data.records || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
      setReadOnly(data.isReadOnly || false)
    } catch (error) {
      console.error('Failed to fetch records:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab, page, search])

  useEffect(() => { fetchTables() }, [fetchTables])
  useEffect(() => { fetchRecords() }, [fetchRecords])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setPage(1)
    setSearch('')
    setSearchInput('')
    setEditingCell(null)
  }

  // Inline editing
  const startEditing = (id: string, field: string, currentValue: unknown) => {
    const columns = modelColumns[activeTab]
    const col = columns?.find(c => c.key === field)
    if (!col?.editable || readOnly) return
    setEditingCell({ id, field })
    setEditValue(String(currentValue ?? ''))
  }

  const cancelEditing = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const saveEditing = async () => {
    if (!editingCell) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin-developer/database/${activeTab}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCell.id,
          field: editingCell.field,
          value: editValue,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: 'Update Failed',
          description: data.error || 'Failed to update record',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Updated',
          description: `${editingCell.field} has been updated successfully`,
        })
        await fetchRecords()
        await fetchTables()
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
      setEditingCell(null)
      setEditValue('')
    }
  }

  // Delete functionality
  const openDeleteDialog = (id: string, label: string) => {
    setDeleteTarget({ id, label })
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin-developer/database/${activeTab}?id=${deleteTarget.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: 'Delete Failed',
          description: data.error || 'Failed to delete record',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Deleted',
          description: `Record has been deleted successfully`,
        })
        await fetchRecords()
        await fetchTables()
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditing()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    return date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const truncateId = (id: string) => {
    if (!id) return '—'
    return id.length > 12 ? `${id.substring(0, 8)}...` : id
  }

  const formatCellValue = (key: string, value: unknown): string => {
    if (value === null || value === undefined) return '—'
    if (key === 'id' || key === 'userId' || key === 'eventId') return truncateId(String(value))
    if (key === 'createdAt' || key === 'updatedAt') return formatDate(String(value))
    if (key === 'price' || key === 'basePrice' || key === 'totalAmount' || key === 'amountPaid') {
      return `₱${Number(value).toLocaleString()}`
    }
    if (typeof value === 'string' && value.length > 80) {
      return value.substring(0, 80) + '...'
    }
    return String(value)
  }

  const getRecordLabel = (record: Record<string, unknown>): string => {
    return String(record.title || record.name || record.participantName || record.orderNumber || record.key || record.id || 'this record')
  }

  const columns = modelColumns[activeTab] || []

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Database className="w-8 h-8 text-teal-500" />
            Database Browser
          </h1>
          <p className="text-gray-500 mt-1">View, edit, and delete all database records</p>
        </div>
        <Button onClick={() => { fetchTables(); fetchRecords() }} variant="outline" className="font-semibold border-teal-200 text-teal-600 hover:bg-teal-50">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-gray-100 p-1 rounded-lg mb-6">
          {tables.map((table) => (
            <TabsTrigger
              key={table.model}
              value={table.model}
              className="data-[state=active]:bg-teal-500 data-[state=active]:text-white px-3 py-2 text-sm"
            >
              {table.label}
              <Badge variant="secondary" className="ml-2 text-xs bg-gray-200">
                {table.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab}>
          {/* Search & Info */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex gap-2">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search records..."
                className="w-[250px]"
              />
              <Button onClick={handleSearch} variant="outline" size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <span className="text-sm text-gray-500">
              {total} record{total !== 1 ? 's' : ''} total
            </span>
            {readOnly && (
              <Badge className="bg-gray-500 text-white">Read Only</Badge>
            )}
            {!readOnly && (
              <Badge className="bg-teal-500 text-white">Editable + Deletable</Badge>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-md border-0 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col.key} className="whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          {col.label}
                          {col.editable && !readOnly && (
                            <Pencil className="w-3 h-3 text-teal-400" />
                          )}
                        </span>
                      </TableHead>
                    ))}
                    {/* Actions column - only show if not read-only */}
                    {!readOnly && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={columns.length + (readOnly ? 0 : 1)} className="text-center py-8 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading records...
                      </TableCell>
                    </TableRow>
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length + (readOnly ? 0 : 1)} className="text-center py-8 text-gray-400">
                        <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={String(record.id)}>
                        {columns.map((col) => {
                          const isEditing = editingCell?.id === String(record.id) && editingCell?.field === col.key
                          const cellValue = record[col.key]
                          const isEditable = col.editable && !readOnly

                          return (
                            <TableCell
                              key={col.key}
                              className={`text-sm whitespace-nowrap max-w-[200px] truncate ${
                                isEditable ? 'cursor-pointer hover:bg-teal-50 group' : ''
                              }`}
                              onClick={() => {
                                if (isEditable && !isEditing) {
                                  startEditing(String(record.id), col.key, cellValue)
                                }
                              }}
                            >
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onBlur={() => saveEditing()}
                                    className="h-8 text-sm min-w-[120px]"
                                    autoFocus
                                    disabled={saving}
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-green-600 hover:text-green-700"
                                    onMouseDown={(e) => { e.preventDefault(); saveEditing() }}
                                    disabled={saving}
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-red-400 hover:text-red-500"
                                    onMouseDown={(e) => { e.preventDefault(); cancelEditing() }}
                                    disabled={saving}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="flex items-center gap-1">
                                  {col.type === 'boolean' ? (
                                    <Badge variant={cellValue ? 'default' : 'secondary'} className={cellValue ? 'bg-green-500 text-white' : ''}>
                                      {cellValue ? 'Yes' : 'No'}
                                    </Badge>
                                  ) : col.key === 'role' ? (
                                    <Badge className={
                                      cellValue === 'admin' ? 'bg-orange-500 text-white' :
                                      cellValue === 'developer' ? 'bg-teal-500 text-white' :
                                      cellValue === 'staff' ? 'bg-blue-500 text-white' :
                                      'bg-gray-500 text-white'
                                    }>
                                      {String(cellValue)}
                                    </Badge>
                                  ) : col.key === 'status' ? (
                                    <Badge className={
                                      cellValue === 'upcoming' ? 'bg-blue-500 text-white' :
                                      cellValue === 'ongoing' ? 'bg-green-500 text-white' :
                                      cellValue === 'completed' ? 'bg-gray-500 text-white' :
                                      'bg-yellow-500 text-white'
                                    }>
                                      {String(cellValue)}
                                    </Badge>
                                  ) : (
                                    <span title={String(cellValue ?? '')}>{formatCellValue(col.key, cellValue)}</span>
                                  )}
                                  {isEditable && (
                                    <Pencil className="w-3 h-3 text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </span>
                              )}
                            </TableCell>
                          )
                        })}
                        {/* Delete button */}
                        {!readOnly && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(String(record.id), getRecordLabel(record))}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        )}
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
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>&quot;{deleteTarget?.label}&quot;</strong>? This action cannot be undone and will be logged in the system audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

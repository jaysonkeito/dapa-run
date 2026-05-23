'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Plus, Pencil, Trash2, Loader2, Eye, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ImageUpload from '@/components/ImageUpload'
import { generateCSV, formatDateForReport, formatPriceForReport } from '@/lib/report-utils'

interface Event {
  id: string
  title: string
  date: string
  time: string
  location: string
  priceRange: string
  image: string
  distances: string
  description: string
  status: string
  featured: boolean
  regCloseDate: string
  regCloseTime: string
  basePrice: number
  finisherShirtPrice: number
  singletPrice: number
  finisherShirtSizes: string | null
  singletSizes: string | null
  distancePricing: string
  isPackage: boolean
  _count?: { registrations: number }
}

const emptyEvent = {
  title: '',
  date: '',
  time: '',
  location: '',
  priceRange: '',
  image: '/hero-banner.png',
  distances: '',
  description: '',
  status: 'upcoming',
  featured: false,
  regCloseDate: '',
  regCloseTime: '',
  basePrice: 0,
  finisherShirtPrice: 0,
  singletPrice: 0,
  finisherShirtSizes: '',
  singletSizes: '',
  distancePricing: '',
  isPackage: false,
}

const standardShirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
const standardDistances = ['1K', '3K', '5K', '10K', '21K', '42K', '50K', '100K']

export default function AdminEventsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  const isAdmin = (session?.user as Record<string, unknown>)?.role === 'admin'
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [form, setForm] = useState(emptyEvent)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Multi-select state for sizes and distances
  const [finisherShirtSelectedSizes, setFinisherShirtSelectedSizes] = useState<string[]>([])
  const [finisherShirtOtherSize, setFinisherShirtOtherSize] = useState('')
  const [singletSelectedSizes, setSingletSelectedSizes] = useState<string[]>([])
  const [singletOtherSize, setSingletOtherSize] = useState('')
  const [selectedDistances, setSelectedDistances] = useState<string[]>([])
  const [otherDistance, setOtherDistance] = useState('')

  // Auto-calculate price range
  useEffect(() => {
    const pricing = form.distancePricing ? (() => { try { return JSON.parse(form.distancePricing) } catch { return {} } })() : {}
    const distPrices = Object.values(pricing) as number[]

    if (form.isPackage) {
      // Package: min distance price to max distance price
      if (distPrices.length > 0 && distPrices.some(p => p > 0)) {
        const minPrice = Math.min(...distPrices.filter(p => p > 0))
        const maxPrice = Math.max(...distPrices)
        setForm(prev => ({ ...prev, priceRange: `₱${minPrice.toLocaleString()} – ₱${maxPrice.toLocaleString()}` }))
      } else if (form.basePrice > 0) {
        setForm(prev => ({ ...prev, priceRange: `₱${form.basePrice.toLocaleString()}` }))
      } else {
        setForm(prev => ({ ...prev, priceRange: '' }))
      }
    } else {
      // Standard: registration fee to registration fee + all add-ons
      const minBase = distPrices.length > 0 && distPrices.some(p => p > 0) ? Math.min(...distPrices.filter(p => p > 0)) : form.basePrice
      const maxBase = distPrices.length > 0 && distPrices.some(p => p > 0) ? Math.max(...distPrices) : form.basePrice
      if (minBase > 0) {
        const maxTotal = maxBase + (form.finisherShirtPrice || 0) + (form.singletPrice || 0)
        setForm(prev => ({ ...prev, priceRange: `₱${minBase.toLocaleString()} – ₱${maxTotal.toLocaleString()}` }))
      } else {
        setForm(prev => ({ ...prev, priceRange: '' }))
      }
    }
  }, [form.basePrice, form.finisherShirtPrice, form.singletPrice, form.distancePricing, form.isPackage])

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/events')
      const data = await res.json()
      if (Array.isArray(data)) setEvents(data)
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  const openCreate = () => {
    setSelectedEvent(null)
    setForm(emptyEvent)
    setFinisherShirtSelectedSizes([])
    setFinisherShirtOtherSize('')
    setSingletSelectedSizes([])
    setSingletOtherSize('')
    setSelectedDistances([])
    setOtherDistance('')
    setDialogOpen(true)
  }

  const openEdit = (event: Event) => {
    setSelectedEvent(event)

    // Parse finisher shirt sizes
    const fSizes = event.finisherShirtSizes ? event.finisherShirtSizes.split(',').filter(Boolean) : []
    const hasOtherFShirt = fSizes.some(s => !standardShirtSizes.includes(s))
    const parsedFSizes = fSizes.filter(s => standardShirtSizes.includes(s))
    if (hasOtherFShirt) parsedFSizes.push('Other')
    setFinisherShirtSelectedSizes(parsedFSizes)
    setFinisherShirtOtherSize(fSizes.find(s => !standardShirtSizes.includes(s)) || '')

    // Parse singlet sizes
    const sSizes = event.singletSizes ? event.singletSizes.split(',').filter(Boolean) : []
    const hasOtherSShirt = sSizes.some(s => !standardShirtSizes.includes(s))
    const parsedSSizes = sSizes.filter(s => standardShirtSizes.includes(s))
    if (hasOtherSShirt) parsedSSizes.push('Other')
    setSingletSelectedSizes(parsedSSizes)
    setSingletOtherSize(sSizes.find(s => !standardShirtSizes.includes(s)) || '')

    // Parse distances
    const dists = event.distances ? event.distances.split(',').filter(Boolean) : []
    const hasOtherDist = dists.some(d => !standardDistances.includes(d))
    const parsedDists = dists.filter(d => standardDistances.includes(d))
    if (hasOtherDist) parsedDists.push('Other')
    setSelectedDistances(parsedDists)
    setOtherDistance(dists.find(d => !standardDistances.includes(d)) || '')

    setForm({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      priceRange: event.priceRange,
      image: event.image,
      distances: event.distances,
      description: event.description,
      status: event.status,
      featured: event.featured,
      regCloseDate: event.regCloseDate || '',
      regCloseTime: event.regCloseTime || '',
      basePrice: event.basePrice || 0,
      finisherShirtPrice: event.finisherShirtPrice || 0,
      singletPrice: event.singletPrice || 0,
      finisherShirtSizes: event.finisherShirtSizes || '',
      singletSizes: event.singletSizes || '',
      distancePricing: event.distancePricing || '',
      isPackage: event.isPackage || false,
    })
    setDialogOpen(true)
  }

  const openDelete = (event: Event) => {
    setSelectedEvent(event)
    setDeleteDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (selectedEvent) {
        const res = await fetch(`/api/admin/events/${selectedEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Failed to update event')
        toast({ title: 'Event Updated', description: `${form.title} has been updated.` })
      } else {
        const res = await fetch('/api/admin/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Failed to create event')
        toast({ title: 'Event Created', description: `${form.title} has been created.` })
      }
      setDialogOpen(false)
      fetchEvents()
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedEvent) return
    try {
      await fetch(`/api/admin/events/${selectedEvent.id}`, { method: 'DELETE' })
      toast({ title: 'Event Deleted', description: `${selectedEvent.title} has been deleted.` })
      setDeleteDialogOpen(false)
      fetchEvents()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete event.', variant: 'destructive' })
    }
  }

  const filteredEvents = statusFilter === 'all'
    ? events
    : events.filter((e) => e.status === statusFilter)

  const handleGenerateReport = () => {
    const headers = ['Title', 'Race Date', 'Location', 'Status', 'Registration Fee', 'Finisher Shirt Price', 'Singlet Price', 'Registration Close Date', 'Total Registrations']
    const rows = events.map((e) => [
      e.title,
      e.date,
      e.location,
      e.status,
      e.basePrice ? formatPriceForReport(e.basePrice) : 'N/A',
      e.finisherShirtPrice ? formatPriceForReport(e.finisherShirtPrice) : 'N/A',
      e.singletPrice ? formatPriceForReport(e.singletPrice) : 'N/A',
      e.regCloseDate || '—',
      String(e._count?.registrations ?? 0),
    ])
    generateCSV(headers, rows, 'dapa-run-events-report')
    toast({ title: 'Report Generated', description: 'Events report has been downloaded.' })
  }

  // Helper for toggling finisher shirt sizes
  const toggleFinisherShirtSize = (size: string) => {
    const newArr = finisherShirtSelectedSizes.includes(size)
      ? finisherShirtSelectedSizes.filter(s => s !== size)
      : [...finisherShirtSelectedSizes, size]
    setFinisherShirtSelectedSizes(newArr)
    const allSizes = newArr.filter(s => s !== 'Other')
    if (size === 'Other' ? newArr.includes('Other') : finisherShirtSelectedSizes.includes('Other')) {
      if (finisherShirtOtherSize) allSizes.push(finisherShirtOtherSize)
    }
    if (size !== 'Other' && newArr.includes('Other') && finisherShirtOtherSize) {
      allSizes.push(finisherShirtOtherSize)
    }
    setForm(prev => ({ ...prev, finisherShirtSizes: allSizes.join(',') }))
  }

  const handleFinisherShirtOtherCheck = (checked: boolean) => {
    if (checked) {
      const newArr = [...finisherShirtSelectedSizes, 'Other']
      setFinisherShirtSelectedSizes(newArr)
      const allSizes = newArr.filter(s => s !== 'Other')
      if (finisherShirtOtherSize) allSizes.push(finisherShirtOtherSize)
      setForm(prev => ({ ...prev, finisherShirtSizes: allSizes.join(',') }))
    } else {
      const newArr = finisherShirtSelectedSizes.filter(s => s !== 'Other')
      setFinisherShirtSelectedSizes(newArr)
      setFinisherShirtOtherSize('')
      const allSizes = [...newArr]
      setForm(prev => ({ ...prev, finisherShirtSizes: allSizes.join(',') }))
    }
  }

  const handleFinisherShirtOtherText = (value: string) => {
    setFinisherShirtOtherSize(value)
    const allSizes = finisherShirtSelectedSizes.filter(s => s !== 'Other')
    if (value) allSizes.push(value)
    setForm(prev => ({ ...prev, finisherShirtSizes: allSizes.join(',') }))
  }

  // Helper for toggling singlet sizes
  const toggleSingletSize = (size: string) => {
    const newArr = singletSelectedSizes.includes(size)
      ? singletSelectedSizes.filter(s => s !== size)
      : [...singletSelectedSizes, size]
    setSingletSelectedSizes(newArr)
    const allSizes = newArr.filter(s => s !== 'Other')
    if (size === 'Other' ? newArr.includes('Other') : singletSelectedSizes.includes('Other')) {
      if (singletOtherSize) allSizes.push(singletOtherSize)
    }
    if (size !== 'Other' && newArr.includes('Other') && singletOtherSize) {
      allSizes.push(singletOtherSize)
    }
    setForm(prev => ({ ...prev, singletSizes: allSizes.join(',') }))
  }

  const handleSingletOtherCheck = (checked: boolean) => {
    if (checked) {
      const newArr = [...singletSelectedSizes, 'Other']
      setSingletSelectedSizes(newArr)
      const allSizes = newArr.filter(s => s !== 'Other')
      if (singletOtherSize) allSizes.push(singletOtherSize)
      setForm(prev => ({ ...prev, singletSizes: allSizes.join(',') }))
    } else {
      const newArr = singletSelectedSizes.filter(s => s !== 'Other')
      setSingletSelectedSizes(newArr)
      setSingletOtherSize('')
      const allSizes = [...newArr]
      setForm(prev => ({ ...prev, singletSizes: allSizes.join(',') }))
    }
  }

  const handleSingletOtherText = (value: string) => {
    setSingletOtherSize(value)
    const allSizes = singletSelectedSizes.filter(s => s !== 'Other')
    if (value) allSizes.push(value)
    setForm(prev => ({ ...prev, singletSizes: allSizes.join(',') }))
  }

  // Helper for toggling distances
  const toggleDistance = (dist: string) => {
    const newArr = selectedDistances.includes(dist)
      ? selectedDistances.filter(d => d !== dist)
      : [...selectedDistances, dist]
    setSelectedDistances(newArr)
    const allDists = newArr.filter(d => d !== 'Other')
    if (dist === 'Other' ? newArr.includes('Other') : selectedDistances.includes('Other')) {
      if (otherDistance) allDists.push(otherDistance)
    }
    if (dist !== 'Other' && newArr.includes('Other') && otherDistance) {
      allDists.push(otherDistance)
    }
    setForm(prev => ({ ...prev, distances: allDists.join(',') }))
  }

  const handleDistanceOtherCheck = (checked: boolean) => {
    if (checked) {
      const newArr = [...selectedDistances, 'Other']
      setSelectedDistances(newArr)
      const allDists = newArr.filter(d => d !== 'Other')
      if (otherDistance) allDists.push(otherDistance)
      setForm(prev => ({ ...prev, distances: allDists.join(',') }))
    } else {
      const newArr = selectedDistances.filter(d => d !== 'Other')
      setSelectedDistances(newArr)
      setOtherDistance('')
      const allDists = [...newArr]
      setForm(prev => ({ ...prev, distances: allDists.join(',') }))
    }
  }

  const handleDistanceOtherText = (value: string) => {
    setOtherDistance(value)
    const allDists = selectedDistances.filter(d => d !== 'Other')
    if (value) allDists.push(value)
    setForm(prev => ({ ...prev, distances: allDists.join(',') }))
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-500 mt-1">Manage all running events</p>
          </div>
          {/* Filter Tabs - between title and button */}
          <div className="flex items-center gap-2 ml-2">
            {['all', 'upcoming', 'past'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  statusFilter === filter
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                <span className="ml-1.5 text-xs opacity-75">
                  ({filter === 'all' ? events.length : events.filter((e) => e.status === filter).length})
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleGenerateReport} variant="outline" className="font-semibold">
            <Download className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          {isAdmin && (
            <Button onClick={openCreate} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Race Date</TableHead>
                <TableHead>Reg. Close</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registration Fee</TableHead>
                <TableHead>Registrations</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading events...
                  </TableCell>
                </TableRow>
              ) : filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-400">No events found.</TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => (
                  <TableRow key={event.id} className="cursor-pointer hover:bg-orange-50/50" onClick={() => router.push(`/admin/dashboard/events/${event.id}`)}>
                    <TableCell className="font-medium">
                      <div>
                        {event.title}
                        {event.featured && (
                          <Badge className="ml-2 bg-orange-500 text-white text-[10px]">Featured</Badge>
                        )}
                        {event.isPackage && (
                          <Badge className="ml-2 bg-emerald-500 text-white text-[10px]">Package</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{event.date}</TableCell>
                    <TableCell className="text-sm text-gray-600">{event.regCloseDate || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={event.status === 'upcoming' ? 'default' : 'secondary'}
                        className={event.status === 'upcoming' ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{event.priceRange || (event.basePrice ? `₱${event.basePrice.toLocaleString()}` : '-')}</TableCell>
                    <TableCell className="text-sm text-gray-600">{event._count?.registrations ?? 0}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/dashboard/events/${event.id}`)} title="View Details">
                          <Eye className="w-4 h-4 text-orange-500" />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(event)}>
                              <Pencil className="w-4 h-4 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDelete(event)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>{selectedEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>

            {/* Race Schedule */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700 mb-3">Race Schedule</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Race Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Race Time</Label>
                  <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Registration Close */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <p className="text-sm font-semibold text-blue-700 mb-3">Registration Deadline</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Registration Close Date</Label>
                  <Input type="date" value={form.regCloseDate} onChange={(e) => setForm({ ...form, regCloseDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Registration Close Time</Label>
                  <Input type="time" value={form.regCloseTime} onChange={(e) => setForm({ ...form, regCloseTime: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Registration Pricing */}
            <div className="border rounded-lg p-4 bg-orange-50">
              <p className="text-sm font-semibold text-orange-700 mb-3">Registration Pricing</p>

              {/* Registration Type Toggle */}
              <div className="flex items-center gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="regType"
                    checked={!form.isPackage}
                    onChange={() => setForm({ ...form, isPackage: false })}
                    className="text-orange-500"
                  />
                  <span className="text-sm font-medium">Standard Registration</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="regType"
                    checked={form.isPackage}
                    onChange={() => setForm({ ...form, isPackage: true })}
                    className="text-orange-500"
                  />
                  <span className="text-sm font-medium">Complete Package</span>
                </label>
              </div>

              {!form.isPackage ? (
                <>
                  {/* Standard Registration */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Registration Fee (₱)</Label>
                      <Input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })} placeholder="500" />
                    </div>
                    <div className="space-y-2">
                      <Label><span className="font-bold text-orange-700">Optional Add-on:</span> Finisher Shirt (₱)</Label>
                      <Input type="number" value={form.finisherShirtPrice} onChange={(e) => setForm({ ...form, finisherShirtPrice: Number(e.target.value) })} placeholder="500" />
                    </div>
                    <div className="space-y-2">
                      <Label><span className="font-bold text-orange-700">Optional Add-on:</span> Race Singlet (₱)</Label>
                      <Input type="number" value={form.singletPrice} onChange={(e) => setForm({ ...form, singletPrice: Number(e.target.value) })} placeholder="500" />
                    </div>
                  </div>

                  {/* Distance Pricing for Standard */}
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm font-semibold text-orange-700 mb-2">Distance Pricing</p>
                    <p className="text-xs text-gray-500 mb-3">Set the registration fee for each distance. If left empty, the default fee will be used.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedDistances.filter(d => d !== 'Other').map((dist) => {
                        const pricing = form.distancePricing ? (() => { try { return JSON.parse(form.distancePricing) } catch { return {} } })() : {}
                        return (
                          <div key={dist} className="space-y-1">
                            <Label className="text-xs">{dist} Fee (₱)</Label>
                            <Input
                              type="number"
                              value={pricing[dist] || ''}
                              onChange={(e) => {
                                const newPricing = { ...pricing, [dist]: Number(e.target.value) || 0 }
                                setForm({ ...form, distancePricing: JSON.stringify(newPricing) })
                              }}
                              placeholder={String(form.basePrice || 0)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Finisher Shirt Sizes */}
                  <div className="mt-4">
                    <div className="space-y-2">
                      <Label>Finisher Shirt Sizes</Label>
                      <div className="border rounded-lg p-3 bg-white space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {standardShirtSizes.map((size) => (
                            <label key={size} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={finisherShirtSelectedSizes.includes(size)}
                                onChange={() => toggleFinisherShirtSize(size)}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">{size}</span>
                            </label>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={finisherShirtSelectedSizes.includes('Other')}
                              onChange={(e) => handleFinisherShirtOtherCheck(e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm font-medium">Other</span>
                          </label>
                          {finisherShirtSelectedSizes.includes('Other') && (
                            <Input
                              value={finisherShirtOtherSize}
                              onChange={(e) => handleFinisherShirtOtherText(e.target.value)}
                              placeholder="Enter custom size"
                              className="flex-1 h-8 text-sm"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Singlet Sizes */}
                  <div className="mt-4">
                    <div className="space-y-2">
                      <Label>Race Singlet Sizes</Label>
                      <div className="border rounded-lg p-3 bg-white space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {standardShirtSizes.map((size) => (
                            <label key={size} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={singletSelectedSizes.includes(size)}
                                onChange={() => toggleSingletSize(size)}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">{size}</span>
                            </label>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={singletSelectedSizes.includes('Other')}
                              onChange={(e) => handleSingletOtherCheck(e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm font-medium">Other</span>
                          </label>
                          {singletSelectedSizes.includes('Other') && (
                            <Input
                              value={singletOtherSize}
                              onChange={(e) => handleSingletOtherText(e.target.value)}
                              placeholder="Enter custom size"
                              className="flex-1 h-8 text-sm"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {form.basePrice > 0 && (
                    <p className="text-xs text-orange-600 mt-3 font-medium">
                      Max total: ₱{([form.basePrice, form.finisherShirtPrice, form.singletPrice].reduce((a, b) => a + b, 0)).toLocaleString()} (with all add-ons)
                    </p>
                  )}
                </>
              ) : (
                <>
                  {/* Complete Package */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Package Fee (₱)</Label>
                      <Input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })} placeholder="500" />
                    </div>
                  </div>

                  {/* Distance Pricing for Package */}
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm font-semibold text-orange-700 mb-2">Distance Pricing</p>
                    <p className="text-xs text-gray-500 mb-3">Set the package fee for each distance. If left empty, the default fee will be used.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedDistances.filter(d => d !== 'Other').map((dist) => {
                        const pricing = form.distancePricing ? (() => { try { return JSON.parse(form.distancePricing) } catch { return {} } })() : {}
                        return (
                          <div key={dist} className="space-y-1">
                            <Label className="text-xs">{dist} Package (₱)</Label>
                            <Input
                              type="number"
                              value={pricing[dist] || ''}
                              onChange={(e) => {
                                const newPricing = { ...pricing, [dist]: Number(e.target.value) || 0 }
                                setForm({ ...form, distancePricing: JSON.stringify(newPricing) })
                              }}
                              placeholder={String(form.basePrice || 0)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Included Sizes (no prices) */}
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm font-semibold text-orange-700 mb-2">Included Sizes</p>
                    <p className="text-xs text-gray-500 mb-3">Select available sizes for items included in the package.</p>
                  </div>

                  {/* Finisher Shirt Sizes */}
                  <div className="mt-4">
                    <div className="space-y-2">
                      <Label>Finisher Shirt Sizes</Label>
                      <div className="border rounded-lg p-3 bg-white space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {standardShirtSizes.map((size) => (
                            <label key={size} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={finisherShirtSelectedSizes.includes(size)}
                                onChange={() => toggleFinisherShirtSize(size)}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">{size}</span>
                            </label>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={finisherShirtSelectedSizes.includes('Other')}
                              onChange={(e) => handleFinisherShirtOtherCheck(e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm font-medium">Other</span>
                          </label>
                          {finisherShirtSelectedSizes.includes('Other') && (
                            <Input
                              value={finisherShirtOtherSize}
                              onChange={(e) => handleFinisherShirtOtherText(e.target.value)}
                              placeholder="Enter custom size"
                              className="flex-1 h-8 text-sm"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Singlet Sizes */}
                  <div className="mt-4">
                    <div className="space-y-2">
                      <Label>Race Singlet Sizes</Label>
                      <div className="border rounded-lg p-3 bg-white space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {standardShirtSizes.map((size) => (
                            <label key={size} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={singletSelectedSizes.includes(size)}
                                onChange={() => toggleSingletSize(size)}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">{size}</span>
                            </label>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={singletSelectedSizes.includes('Other')}
                              onChange={(e) => handleSingletOtherCheck(e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm font-medium">Other</span>
                          </label>
                          {singletSelectedSizes.includes('Other') && (
                            <Input
                              value={singletOtherSize}
                              onChange={(e) => handleSingletOtherText(e.target.value)}
                              placeholder="Enter custom size"
                              className="flex-1 h-8 text-sm"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price Range</Label>
                <div className="h-10 px-3 flex items-center rounded-md border bg-gray-50 text-sm text-gray-700">
                  {form.priceRange ? (
                    form.priceRange
                  ) : (
                    <span className="text-gray-400">Set Registration Fee to auto-calculate</span>
                  )}
                </div>
                <input type="hidden" value={form.priceRange} />
              </div>
              <div className="space-y-2">
                <Label>Distances</Label>
                <div className="border rounded-lg p-3 bg-white space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {standardDistances.map((dist) => (
                      <label key={dist} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDistances.includes(dist)}
                          onChange={() => toggleDistance(dist)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{dist}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDistances.includes('Other')}
                        onChange={(e) => handleDistanceOtherCheck(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">Other</span>
                    </label>
                    {selectedDistances.includes('Other') && (
                      <Input
                        value={otherDistance}
                        onChange={(e) => handleDistanceOtherText(e.target.value)}
                        placeholder="Enter custom distance"
                        className="flex-1 h-8 text-sm"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <ImageUpload
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
              aspectRatio="16:9"
              label="Event Image"
            />
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={form.featured}
                onCheckedChange={(checked) => setForm({ ...form, featured: !!checked })}
              />
              <Label htmlFor="featured">Featured Event</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {selectedEvent ? 'Update Event' : 'Create Event'}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedEvent?.title}&quot;? This action cannot be undone and will also delete all associated race results and registrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

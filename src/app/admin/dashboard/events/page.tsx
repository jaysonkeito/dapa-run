'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Plus, Pencil, Trash2, Loader2, Eye, Download, X, PlusCircle, ChevronDown, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import ImageUpload from '@/components/ImageUpload'
import { generateCSV, formatDateForReport, formatPriceForReport } from '@/lib/report-utils'
import TimePicker from '@/components/TimePicker'
import TimeRangePicker from '@/components/TimeRangePicker'
import DatePicker from '@/components/DatePicker'

interface Event {
  id: string
  title: string
  date: string
  time: string
  timeEnd: string
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
  distanceInclusions: string
  isPackage: boolean
  _count?: { registrations: number }
}

const emptyEvent = {
  title: '',
  date: '',
  time: '',
  timeEnd: '',
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
  distanceInclusions: '',
  isPackage: false,
}

const standardInclusions = ['Race Bib', 'Finishers Medal', 'Post-Race Meal', 'Other']

const standardShirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
const standardSingletSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
const standardDistances = ['1K', '3K', '5K', '10K', '21K', '42K', '50K', '100K']

// Sort distances from shortest to longest
const sortDistances = (dists: string[]): string[] => {
  return [...dists].sort((a, b) => {
    const numA = parseInt(a.replace(/[^\d]/g, '')) || 0
    const numB = parseInt(b.replace(/[^\d]/g, '')) || 0
    return numA - numB
  })
}

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
  const [summaryOpen, setSummaryOpen] = useState(false)

  // Multi-select state for sizes and distances
  const [finisherShirtSelectedSizes, setFinisherShirtSelectedSizes] = useState<string[]>([])
  const [finisherShirtOtherSize, setFinisherShirtOtherSize] = useState('')
  const [singletSelectedSizes, setSingletSelectedSizes] = useState<string[]>([])
  const [singletOtherSize, setSingletOtherSize] = useState('')
  const [selectedDistances, setSelectedDistances] = useState<string[]>([])
  const [otherDistance, setOtherDistance] = useState('')
  const [otherInclusions, setOtherInclusions] = useState<Record<string, string>>({}) // { "3K": "Custom Item", ... }
  const [openInclusionDropdown, setOpenInclusionDropdown] = useState<string | null>(null) // which distance's dropdown is open

  // Helper to get distance prices from form
  const getDistancePrices = () => {
    const pricing = form.distancePricing ? (() => { try { return JSON.parse(form.distancePricing) } catch { return {} } })() : {}
    return Object.values(pricing) as number[]
  }

  // Helper to get max distance fee
  const getMaxDistanceFee = () => {
    const distPrices = getDistancePrices()
    if (distPrices.length > 0 && distPrices.some(p => p > 0)) {
      return Math.max(...distPrices)
    }
    return 0
  }

  // Auto-calculate price range
  useEffect(() => {
    const distPrices = getDistancePrices()

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
      // Standard: min distance fee to max distance fee + all add-ons
      const minBase = distPrices.length > 0 && distPrices.some(p => p > 0) ? Math.min(...distPrices.filter(p => p > 0)) : 0
      const maxBase = distPrices.length > 0 && distPrices.some(p => p > 0) ? Math.max(...distPrices) : 0
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
    setOtherInclusions({})
    setOpenInclusionDropdown(null)
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
    const hasOtherSShirt = sSizes.some(s => !standardSingletSizes.includes(s))
    const parsedSSizes = sSizes.filter(s => standardSingletSizes.includes(s))
    if (hasOtherSShirt) parsedSSizes.push('Other')
    setSingletSelectedSizes(parsedSSizes)
    setSingletOtherSize(sSizes.find(s => !standardSingletSizes.includes(s)) || '')

    // Parse distances
    const dists = event.distances ? event.distances.split(',').filter(Boolean) : []
    const hasOtherDist = dists.some(d => !standardDistances.includes(d))
    const parsedDists = dists.filter(d => standardDistances.includes(d))
    if (hasOtherDist) parsedDists.push('Other')
    setSelectedDistances(parsedDists)
    setOtherDistance(dists.find(d => !standardDistances.includes(d)) || '')

    // Parse inclusions
    let parsedOtherInclusions: Record<string, string> = {}
    if (event.distanceInclusions) {
      try {
        const inc: Record<string, string[]> = JSON.parse(event.distanceInclusions)
        Object.entries(inc).forEach(([dist, items]) => {
          const customItem = items.find(i => !standardInclusions.includes(i))
          if (customItem) {
            parsedOtherInclusions[dist] = customItem
          }
        })
      } catch {}
    }
    setOtherInclusions(parsedOtherInclusions)
    setOpenInclusionDropdown(null)

    setForm({
      title: event.title,
      date: event.date,
      time: event.time,
      timeEnd: event.timeEnd || '',
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
      distanceInclusions: event.distanceInclusions || '',
      isPackage: event.isPackage || false,
    })
    setDialogOpen(true)
  }

  const openDelete = (event: Event) => {
    setSelectedEvent(event)
    setDeleteDialogOpen(true)
  }

  const handleSave = async () => {
    // Validate required fields
    if (!form.title.trim()) {
      toast({ title: 'Validation Error', description: 'Title is required.', variant: 'destructive' })
      return
    }
    if (!form.date) {
      toast({ title: 'Validation Error', description: 'Race Date is required.', variant: 'destructive' })
      return
    }
    if (!form.time) {
      toast({ title: 'Validation Error', description: 'Race Start Time is required.', variant: 'destructive' })
      return
    }
    if (!form.timeEnd) {
      toast({ title: 'Validation Error', description: 'Race End Time is required.', variant: 'destructive' })
      return
    }
    if (!form.regCloseDate) {
      toast({ title: 'Validation Error', description: 'Registration Close Date is required.', variant: 'destructive' })
      return
    }
    if (!form.regCloseTime) {
      toast({ title: 'Validation Error', description: 'Registration Close Time is required.', variant: 'destructive' })
      return
    }

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

  // Helper to get inclusions for a specific distance
  const getInclusions = (dist: string): string[] => {
    if (!form.distanceInclusions) return []
    try {
      const inc: Record<string, string[]> = JSON.parse(form.distanceInclusions)
      return inc[dist] || []
    } catch {
      return []
    }
  }

  // Toggle an inclusion item for a distance
  const toggleInclusion = (dist: string, item: string) => {
    let current: Record<string, string[]> = {}
    try { current = JSON.parse(form.distanceInclusions || '{}') } catch {}
    const items = current[dist] || []
    let newItems: string[]
    if (item === 'Other') {
      // For "Other", check if there's already a custom item
      const existingCustom = items.find(i => !standardInclusions.includes(i))
      if (existingCustom) {
        // Remove custom item
        newItems = items.filter(i => standardInclusions.includes(i))
        setOtherInclusions(prev => {
          const copy = { ...prev }
          delete copy[dist]
          return copy
        })
      } else {
        // Add a placeholder custom item
        const customText = otherInclusions[dist] || ''
        newItems = [...items.filter(i => i !== 'Other')]
        if (customText) {
          newItems.push(customText)
        } else {
          newItems.push('Other') // placeholder until user types
        }
      }
    } else {
      if (items.includes(item)) {
        newItems = items.filter(i => i !== item)
      } else {
        // Also remove 'Other' placeholder if it exists when adding standard items
        newItems = [...items.filter(i => i !== 'Other'), item]
      }
    }
    current[dist] = newItems
    setForm(prev => ({ ...prev, distanceInclusions: JSON.stringify(current) }))
  }

  // Set custom "Other" inclusion text for a distance
  const setOtherInclusionText = (dist: string, text: string) => {
    setOtherInclusions(prev => ({ ...prev, [dist]: text }))
    // Update the inclusions data
    let current: Record<string, string[]> = {}
    try { current = JSON.parse(form.distanceInclusions || '{}') } catch {}
    const items = current[dist] || []
    // Replace 'Other' placeholder or existing custom item with the new text
    const hasOtherPlaceholder = items.includes('Other')
    const existingCustomIdx = items.findIndex(i => !standardInclusions.includes(i))
    let newItems: string[]
    if (hasOtherPlaceholder) {
      // Replace 'Other' placeholder with the custom text
      newItems = items.map(i => i === 'Other' ? text : i).filter(Boolean)
    } else if (existingCustomIdx >= 0) {
      // Replace existing custom item with new text
      newItems = items.map((i, idx) => idx === existingCustomIdx ? text : i).filter(Boolean)
    } else {
      // No existing custom, just add the text
      if (text) newItems = [...items, text]
      else newItems = [...items]
    }
    // Remove empty strings
    newItems = newItems.filter(i => i.trim() !== '')
    current[dist] = newItems
    setForm(prev => ({ ...prev, distanceInclusions: JSON.stringify(current) }))
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
            {/* Section 1: Title & Location */}
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

            {/* Section 2: Race Schedule */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700 mb-3">Race Schedule</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Race Date <span className="text-red-400">*</span></Label>
                  <DatePicker
                    value={form.date}
                    onChange={(val) => setForm({ ...form, date: val })}
                    placeholder="Select Race Date"
                    required
                    eventDates={events.map((e) => ({
                      date: e.date,
                      status: (e.status === 'upcoming' ? 'upcoming' : 'past') as 'upcoming' | 'past',
                      title: e.title,
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Race Time</Label>
                  <TimeRangePicker
                    startValue={form.time}
                    endValue={form.timeEnd}
                    onStartChange={(val) => setForm({ ...form, time: val })}
                    onEndChange={(val) => setForm({ ...form, timeEnd: val })}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Registration Deadline */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <p className="text-sm font-semibold text-blue-700 mb-3">Registration Deadline</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Registration Close Date <span className="text-red-400">*</span></Label>
                  <DatePicker
                    value={form.regCloseDate}
                    onChange={(val) => setForm({ ...form, regCloseDate: val })}
                    placeholder="Select Deadline Date"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Registration Close Time</Label>
                  <div className="flex justify-center">
                    <TimePicker
                      value={form.regCloseTime}
                      onChange={(val) => setForm({ ...form, regCloseTime: val })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Distance & Pricing */}
            <div className="border rounded-lg p-4 bg-orange-50">
              <p className="text-sm font-semibold text-orange-700 mb-3">Distance & Pricing</p>

              {/* Distances Sub-header */}
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Distances</p>

              {/* Distance Toggle Pills */}
              <div className="flex flex-wrap gap-2 mb-3">
                {[...standardDistances, 'Other'].map((dist) => {
                  const isSelected = selectedDistances.includes(dist)
                  const isOther = dist === 'Other'
                  return (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => {
                        if (isOther) {
                          handleDistanceOtherCheck(!selectedDistances.includes('Other'))
                        } else {
                          toggleDistance(dist)
                        }
                      }}
                      className={cn(
                        'inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border-2',
                        isSelected
                          ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:text-orange-600'
                      )}
                    >
                      {isOther && <PlusCircle className="w-3.5 h-3.5" />}
                      {dist}
                    </button>
                  )
                })}
              </div>

              {/* Other Distance Input */}
              {selectedDistances.includes('Other') && (
                <div className="mb-3">
                  <Input
                    value={otherDistance}
                    onChange={(e) => handleDistanceOtherText(e.target.value)}
                    placeholder="Enter custom distance (e.g., 15K)"
                    className="max-w-xs h-9 text-sm"
                  />
                </div>
              )}

              {/* Selected Distances as Removable Chips */}
              {selectedDistances.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {sortDistances(selectedDistances.filter(d => d !== 'Other')).map((dist) => (
                    <span
                      key={dist}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200"
                    >
                      {dist}
                      <button
                        type="button"
                        onClick={() => toggleDistance(dist)}
                        className="ml-0.5 text-orange-400 hover:text-orange-700 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {selectedDistances.includes('Other') && otherDistance && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                      {otherDistance}
                      <button
                        type="button"
                        onClick={() => handleDistanceOtherCheck(false)}
                        className="ml-0.5 text-orange-400 hover:text-orange-700 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Registration Fee Per Distance - Only shows when at least one distance is selected */}
              {selectedDistances.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-3">Registration Fee Per Distance</p>

                  {/* Distance Pricing Cards */}
                  <div className="space-y-3 mb-4">
                    {sortDistances(selectedDistances.filter(d => d !== 'Other')).map((dist) => {
                      const pricing = form.distancePricing ? (() => { try { return JSON.parse(form.distancePricing) } catch { return {} } })() : {}
                      const inclusions = getInclusions(dist)
                      const isDropdownOpen = openInclusionDropdown === dist
                      const hasOtherInclusion = inclusions.some(i => !standardInclusions.includes(i))
                      return (
                        <div key={dist} className="p-3 rounded-lg bg-white border border-orange-100">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-orange-600 text-white min-w-[48px]">
                              {dist}
                            </span>
                            <span className="text-sm font-semibold text-gray-500">₱</span>
                            <Input
                              type="number"
                              value={pricing[dist] || ''}
                              onChange={(e) => {
                                const newPricing = { ...pricing, [dist]: Number(e.target.value) || 0 }
                                setForm({ ...form, distancePricing: JSON.stringify(newPricing) })
                              }}
                              placeholder={form.isPackage ? String(form.basePrice || 0) : '0'}
                              className="flex-1 h-8 text-sm border-orange-200 focus:border-orange-400"
                            />
                          </div>
                          {/* Inclusions Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenInclusionDropdown(isDropdownOpen ? null : dist)}
                              className="flex items-center justify-between w-full px-3 py-1.5 text-xs rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <span className="text-gray-600 font-medium">
                                Inclusions{inclusions.length > 0 ? ` (${inclusions.length})` : ''}
                              </span>
                              <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', isDropdownOpen && 'rotate-180')} />
                            </button>
                            {isDropdownOpen && (
                              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 space-y-1">
                                {standardInclusions.map((item) => {
                                  const isOther = item === 'Other'
                                  // For "Other", check if there's a custom item or 'Other' placeholder in inclusions
                                  const isSelected = isOther
                                    ? (hasOtherInclusion || inclusions.includes('Other'))
                                    : inclusions.includes(item)
                                  return (
                                    <div key={item}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (isOther) {
                                            if (isSelected) {
                                              // Remove the custom item / 'Other' placeholder
                                              const filtered = inclusions.filter(i => standardInclusions.includes(i) && i !== 'Other')
                                              let current: Record<string, string[]> = {}
                                              try { current = JSON.parse(form.distanceInclusions || '{}') } catch {}
                                              current[dist] = filtered
                                              setForm(prev => ({ ...prev, distanceInclusions: JSON.stringify(current) }))
                                              setOtherInclusions(prev => {
                                                const copy = { ...prev }
                                                delete copy[dist]
                                                return copy
                                              })
                                            } else {
                                              toggleInclusion(dist, 'Other')
                                            }
                                          } else {
                                            toggleInclusion(dist, item)
                                          }
                                        }}
                                        className={cn(
                                          'flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs font-medium transition-colors',
                                          isSelected
                                            ? 'bg-orange-50 text-orange-700'
                                            : 'text-gray-600 hover:bg-gray-50'
                                        )}
                                      >
                                        <span className={cn(
                                          'flex items-center justify-center w-4 h-4 rounded border transition-colors',
                                          isSelected
                                            ? 'bg-orange-500 border-orange-500 text-white'
                                            : 'border-gray-300'
                                        )}>
                                          {isSelected && <Check className="w-3 h-3" />}
                                        </span>
                                        {item}
                                      </button>
                                      {/* "Other" custom input - show when Other is checked */}
                                      {isOther && isSelected && (
                                        <Input
                                          value={otherInclusions[dist] || ''}
                                          onChange={(e) => setOtherInclusionText(dist, e.target.value)}
                                          placeholder="Enter custom inclusion"
                                          className="mt-1 ml-6 h-7 text-xs max-w-[200px]"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                          {/* Show selected inclusions as tags */}
                          {inclusions.length > 0 && !isDropdownOpen && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {inclusions.map((inc, idx) => (
                                <span key={idx} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-600 border border-orange-100">
                                  {inc}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (standardInclusions.includes(inc)) {
                                        toggleInclusion(dist, inc)
                                      } else {
                                        // Remove custom item
                                        const filtered = inclusions.filter((_, i) => i !== idx)
                                        let current: Record<string, string[]> = {}
                                        try { current = JSON.parse(form.distanceInclusions || '{}') } catch {}
                                        current[dist] = filtered
                                        setForm(prev => ({ ...prev, distanceInclusions: JSON.stringify(current) }))
                                        setOtherInclusions(prev => {
                                          const copy = { ...prev }
                                          delete copy[dist]
                                          return copy
                                        })
                                      }
                                    }}
                                    className="ml-0.5 text-orange-400 hover:text-orange-700"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Package Registration Toggle */}
                  <div className="flex items-center justify-between py-3 border-t border-orange-200/60">
                    <div>
                      <span className="text-sm font-semibold text-gray-800">Package Registration</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isPackage: !form.isPackage })}
                      className={cn(
                        'relative w-11 h-6 rounded-full transition-colors duration-200',
                        form.isPackage ? 'bg-emerald-500' : 'bg-gray-300'
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
                          form.isPackage ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 -mt-1 mb-4">
                    {form.isPackage
                      ? 'Package Registration — Registration includes everything (no optional add-ons)'
                      : 'Non-Package Registration — Registration fee per distance, with optional add-ons'}
                  </p>

                  {!form.isPackage ? (
                    <>
                      {/* Standard Mode: Optional Add-ons */}
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Optional Add-ons</p>

                      {/* Finisher Shirt: Pill Sizes + Price */}
                      <div className="mb-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Finisher Shirt</Label>
                          <div className="flex flex-wrap gap-2">
                            {[...standardShirtSizes, 'Other'].map((size) => {
                              const isSelected = finisherShirtSelectedSizes.includes(size)
                              return (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => {
                                    if (size === 'Other') {
                                      handleFinisherShirtOtherCheck(!finisherShirtSelectedSizes.includes('Other'))
                                    } else {
                                      toggleFinisherShirtSize(size)
                                    }
                                  }}
                                  className={cn(
                                    'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border-2',
                                    isSelected
                                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                                      : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:text-orange-600'
                                  )}
                                >
                                  {size === 'Other' && <PlusCircle className="w-3 h-3" />}
                                  {size}
                                </button>
                              )
                            })}
                          </div>
                          {finisherShirtSelectedSizes.includes('Other') && (
                            <Input
                              value={finisherShirtOtherSize}
                              onChange={(e) => handleFinisherShirtOtherText(e.target.value)}
                              placeholder="Enter custom size"
                              className="max-w-xs h-8 text-sm"
                            />
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-500">₱</span>
                            <Input
                              type="number"
                              value={form.finisherShirtPrice || ''}
                              onChange={(e) => setForm({ ...form, finisherShirtPrice: Number(e.target.value) })}
                              placeholder="0"
                              className="max-w-[120px] h-8 text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Race Singlet: Pill Sizes + Price */}
                      <div className="mb-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Race Singlet</Label>
                          <div className="flex flex-wrap gap-2">
                            {[...standardSingletSizes, 'Other'].map((size) => {
                              const isSelected = singletSelectedSizes.includes(size)
                              return (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => {
                                    if (size === 'Other') {
                                      handleSingletOtherCheck(!singletSelectedSizes.includes('Other'))
                                    } else {
                                      toggleSingletSize(size)
                                    }
                                  }}
                                  className={cn(
                                    'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border-2',
                                    isSelected
                                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                                      : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:text-orange-600'
                                  )}
                                >
                                  {size === 'Other' && <PlusCircle className="w-3 h-3" />}
                                  {size}
                                </button>
                              )
                            })}
                          </div>
                          {singletSelectedSizes.includes('Other') && (
                            <Input
                              value={singletOtherSize}
                              onChange={(e) => handleSingletOtherText(e.target.value)}
                              placeholder="Enter custom size"
                              className="max-w-xs h-8 text-sm"
                            />
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-500">₱</span>
                            <Input
                              type="number"
                              value={form.singletPrice || ''}
                              onChange={(e) => setForm({ ...form, singletPrice: Number(e.target.value) })}
                              placeholder="0"
                              className="max-w-[120px] h-8 text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 italic">
                        Add-ons are not included in the registration fee. Participants can choose to add them during registration.
                      </p>

                      {/* Max total for Standard */}
                      {(getMaxDistanceFee() > 0 || form.finisherShirtPrice > 0 || form.singletPrice > 0) && (
                        <p className="text-xs text-orange-600 mt-2 font-medium">
                          Max total: ₱{(getMaxDistanceFee() + form.finisherShirtPrice + form.singletPrice).toLocaleString()} (highest distance fee + all add-ons)
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Package Mode: Package Fee + Included Sizes */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label>Package Fee (₱)</Label>
                          <Input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })} placeholder="500" />
                        </div>
                      </div>

                      {/* Included Sizes */}
                      <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-3">Included Sizes</p>

                      {/* Finisher Shirt Sizes - Pill Buttons */}
                      <div className="mb-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Finisher Shirt Sizes</Label>
                          <div className="flex flex-wrap gap-2">
                            {[...standardShirtSizes, 'Other'].map((size) => {
                              const isSelected = finisherShirtSelectedSizes.includes(size)
                              return (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => {
                                    if (size === 'Other') {
                                      handleFinisherShirtOtherCheck(!finisherShirtSelectedSizes.includes('Other'))
                                    } else {
                                      toggleFinisherShirtSize(size)
                                    }
                                  }}
                                  className={cn(
                                    'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border-2',
                                    isSelected
                                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                                      : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:text-orange-600'
                                  )}
                                >
                                  {size === 'Other' && <PlusCircle className="w-3 h-3" />}
                                  {size}
                                </button>
                              )
                            })}
                          </div>
                          {finisherShirtSelectedSizes.includes('Other') && (
                            <Input
                              value={finisherShirtOtherSize}
                              onChange={(e) => handleFinisherShirtOtherText(e.target.value)}
                              placeholder="Enter custom size"
                              className="max-w-xs h-8 text-sm"
                            />
                          )}
                        </div>
                      </div>

                      {/* Race Singlet Sizes - Pill Buttons */}
                      <div className="mb-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Race Singlet Sizes</Label>
                          <div className="flex flex-wrap gap-2">
                            {[...standardSingletSizes, 'Other'].map((size) => {
                              const isSelected = singletSelectedSizes.includes(size)
                              return (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => {
                                    if (size === 'Other') {
                                      handleSingletOtherCheck(!singletSelectedSizes.includes('Other'))
                                    } else {
                                      toggleSingletSize(size)
                                    }
                                  }}
                                  className={cn(
                                    'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border-2',
                                    isSelected
                                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                                      : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:text-orange-600'
                                  )}
                                >
                                  {size === 'Other' && <PlusCircle className="w-3 h-3" />}
                                  {size}
                                </button>
                              )
                            })}
                          </div>
                          {singletSelectedSizes.includes('Other') && (
                            <Input
                              value={singletOtherSize}
                              onChange={(e) => handleSingletOtherText(e.target.value)}
                              placeholder="Enter custom size"
                              className="max-w-xs h-8 text-sm"
                            />
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-emerald-600 italic">
                        Package includes all items. No additional add-ons needed during registration.
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Hidden price range auto-calc */}
              <input type="hidden" value={form.priceRange} />
            </div>

            {/* Section 5: Other Details */}
            <div className="space-y-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between h-10">
                    <span className="text-sm font-semibold text-gray-800">Featured Event</span>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, featured: !form.featured })}
                      className={cn(
                        'relative w-11 h-6 rounded-full transition-colors duration-200',
                        form.featured ? 'bg-emerald-500' : 'bg-gray-300'
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
                          form.featured ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* View Summary Button */}
            <Button
              variant="outline"
              onClick={() => setSummaryOpen(true)}
              className="w-full font-semibold"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Summary
            </Button>

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

      {/* Summary Dialog */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Event Summary</DialogTitle>
          <div className="space-y-3 mt-4 text-sm">
            <div><span className="font-semibold">Title:</span> {form.title || '—'}</div>
            <div><span className="font-semibold">Location:</span> {form.location || '—'}</div>
            <div><span className="font-semibold">Race Date:</span> {form.date || '—'}</div>
            <div><span className="font-semibold">Race Time:</span> {form.time && form.timeEnd ? `${form.time} – ${form.timeEnd}` : '—'}</div>
            <div><span className="font-semibold">Reg. Close:</span> {form.regCloseDate || '—'}{form.regCloseTime ? ` ${form.regCloseTime}` : ''}</div>
            <div><span className="font-semibold">Distances:</span> {form.distances || '—'}</div>
            <div><span className="font-semibold">Type:</span> {form.isPackage ? 'Package' : 'Standard'}</div>
            {form.isPackage && form.basePrice > 0 && <div><span className="font-semibold">Package Fee:</span> ₱{form.basePrice.toLocaleString()}</div>}
            {form.distancePricing && (() => {
              try {
                const p = JSON.parse(form.distancePricing)
                return sortDistances(Object.keys(p)).map((dist) => (
                  <div key={dist}><span className="font-semibold">{dist}:</span> ₱{(p[dist] as number).toLocaleString()}</div>
                ))
              } catch { return null }
            })()}
            {!form.isPackage && (form.finisherShirtPrice > 0 || form.singletPrice > 0) && (
              <div>
                <span className="font-semibold">Add-ons:</span>{' '}
                {form.finisherShirtPrice > 0 && `Finisher Shirt ₱${form.finisherShirtPrice.toLocaleString()}`}
                {form.finisherShirtPrice > 0 && form.singletPrice > 0 && ', '}
                {form.singletPrice > 0 && `Race Singlet ₱${form.singletPrice.toLocaleString()}`}
              </div>
            )}
            {form.distanceInclusions && (() => {
              try {
                const inc: Record<string, string[]> = JSON.parse(form.distanceInclusions)
                const entries = Object.entries(inc).filter(([, items]) => items.length > 0)
                if (entries.length === 0) return null
                return (
                  <div>
                    <span className="font-semibold">Inclusions:</span>
                    <div className="ml-4 mt-1">
                      {entries.map(([dist, items]) => (
                        <div key={dist} className="text-xs text-gray-600">{dist}: {items.join(', ')}</div>
                      ))}
                    </div>
                  </div>
                )
              } catch { return null }
            })()}
            <div><span className="font-semibold">Price Range:</span> {form.priceRange || '—'}</div>
            <div><span className="font-semibold">Status:</span> {form.status}</div>
            <div><span className="font-semibold">Featured:</span> {form.featured ? 'Yes' : 'No'}</div>
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

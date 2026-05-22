'use client'

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
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
import { Loader2, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { generateCSV, formatDateForReport, formatPriceForReport } from '@/lib/report-utils'

type RegistrationType = 'online' | 'onsite'

interface CombinedRegistration {
  id: string
  type: RegistrationType
  name: string
  email: string | null
  phone: string | null
  eventTitle: string
  eventId: string
  distance: string
  finisherShirtSize: string | null
  singletSize: string | null
  totalAmount: number
  paymentMethod?: string
  staffName?: string | null
  createdAt: string
}

type FilterType = 'all' | 'online' | 'onsite'

interface Event {
  id: string
  title: string
}

export default function AdminRegistrationsPage() {
  const { toast } = useToast()
  const [combinedRegs, setCombinedRegs] = useState<CombinedRegistration[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEvent, setFilterEvent] = useState<string>('all')
  const [regType, setRegType] = useState<FilterType>('all')

  const fetchData = async () => {
    try {
      const [regRes, eventsRes] = await Promise.all([
        fetch(filterEvent && filterEvent !== 'all' ? `/api/admin/registrations?eventId=${filterEvent}` : '/api/admin/registrations'),
        fetch('/api/admin/events'),
      ])
      const regData = await regRes.json()
      const eventsData = await eventsRes.json()
      setEvents(eventsData)

      // Combine online and on-site registrations
      const onlineRegs: CombinedRegistration[] = (regData.registrations || []).map((reg: Record<string, unknown>) => ({
        id: reg.id as string,
        type: 'online' as RegistrationType,
        name: (reg.user as Record<string, unknown>)?.name as string || 'Unknown',
        email: (reg.user as Record<string, unknown>)?.email as string || null,
        phone: (reg.user as Record<string, unknown>)?.phone as string || null,
        eventTitle: (reg.event as Record<string, unknown>)?.title as string || 'Unknown Event',
        eventId: reg.eventId as string,
        distance: reg.distance as string,
        finisherShirtSize: reg.finisherShirtSize as string | null,
        singletSize: reg.singletSize as string | null,
        totalAmount: reg.totalAmount as number,
        createdAt: reg.createdAt as string,
      }))

      const onsiteRegs: CombinedRegistration[] = (regData.onsiteRegistrations || []).map((reg: Record<string, unknown>) => ({
        id: reg.id as string,
        type: 'onsite' as RegistrationType,
        name: reg.participantName as string || 'Unknown',
        email: reg.participantEmail as string || null,
        phone: reg.participantPhone as string || null,
        eventTitle: (reg.event as Record<string, unknown>)?.title as string || 'Unknown Event',
        eventId: reg.eventId as string,
        distance: reg.distance as string,
        finisherShirtSize: reg.finisherShirtSize as string | null,
        singletSize: reg.singletSize as string | null,
        totalAmount: reg.amountPaid as number,
        paymentMethod: reg.paymentMethod as string,
        staffName: reg.staffName as string | null,
        createdAt: reg.createdAt as string,
      }))

      // Combine and sort by date descending
      const combined = [...onlineRegs, ...onsiteRegs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setCombinedRegs(combined)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [filterEvent])

  const filteredRegs = useMemo(() => {
    if (regType === 'all') return combinedRegs
    return combinedRegs.filter((r) => r.type === regType)
  }, [combinedRegs, regType])

  const counts = useMemo(() => ({
    all: combinedRegs.length,
    online: combinedRegs.filter((r) => r.type === 'online').length,
    onsite: combinedRegs.filter((r) => r.type === 'onsite').length,
  }), [combinedRegs])

  const handleGenerateReport = () => {
    const headers = ['Name', 'Email', 'Phone', 'Type', 'Event', 'Distance', 'Finisher Shirt', 'Singlet', 'Amount', 'Payment Method', 'Staff', 'Date']
    const rows = filteredRegs.map((reg) => [
      reg.name,
      reg.email || '—',
      reg.phone || '—',
      reg.type === 'online' ? 'Online' : 'On-site',
      reg.eventTitle,
      reg.distance,
      reg.finisherShirtSize || '—',
      reg.singletSize || '—',
      formatPriceForReport(reg.totalAmount),
      reg.paymentMethod || '—',
      reg.staffName || '—',
      formatDateForReport(reg.createdAt),
    ])
    generateCSV(headers, rows, 'dapa-run-registrations-report')
    toast({ title: 'Report Generated', description: 'Registrations report has been downloaded.' })
  }

  // Determine which columns to show based on filter
  const showTypeCol = regType === 'all'
  const showPhoneCol = regType === 'all' || regType === 'onsite'
  const showPaymentCol = regType === 'all' || regType === 'onsite'
  const showStaffCol = regType === 'all' || regType === 'onsite'

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Registrations</h1>
          <p className="text-gray-500 mt-1">View all event registrations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleGenerateReport} variant="outline" className="font-semibold">
            <Download className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Select value={filterEvent} onValueChange={setFilterEvent}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Registration Type Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {(['all', 'online', 'onsite'] as FilterType[]).map((type) => (
          <button
            key={type}
            onClick={() => setRegType(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              regType === type
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {type === 'all' ? 'All' : type === 'online' ? 'Online' : 'On-site'}
            <span className="ml-1.5 text-xs opacity-75">
              ({counts[type]})
            </span>
          </button>
        ))}
      </div>

      {/* Combined Registrations Table */}
      <div className="bg-white rounded-xl shadow-md border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {showTypeCol && <TableHead>Type</TableHead>}
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                {showPhoneCol && <TableHead>Phone</TableHead>}
                <TableHead>Event</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Finisher Shirt</TableHead>
                <TableHead>Singlet</TableHead>
                <TableHead>Amount</TableHead>
                {showPaymentCol && <TableHead>Payment Method</TableHead>}
                {showStaffCol && <TableHead>Staff</TableHead>}
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredRegs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-gray-400">
                    No registrations found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRegs.map((reg) => (
                  <TableRow key={`${reg.type}-${reg.id}`}>
                    {showTypeCol && (
                      <TableCell>
                        <Badge className={reg.type === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
                          {reg.type === 'online' ? 'Online' : 'On-site'}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{reg.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{reg.email || '—'}</TableCell>
                    {showPhoneCol && (
                      <TableCell className="text-sm text-gray-600">{reg.phone || '—'}</TableCell>
                    )}
                    <TableCell className="text-sm">{reg.eventTitle}</TableCell>
                    <TableCell>
                      <Badge className="bg-orange-500 text-white">{reg.distance}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {reg.finisherShirtSize ? (
                        <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">Size: {reg.finisherShirtSize}</Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {reg.singletSize ? (
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50">Size: {reg.singletSize}</Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      ₱{(reg.totalAmount ?? 0).toLocaleString()}
                    </TableCell>
                    {showPaymentCol && (
                      <TableCell>
                        {reg.paymentMethod ? (
                          <Badge variant="outline" className="capitalize text-xs">{reg.paymentMethod}</Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                    )}
                    {showStaffCol && (
                      <TableCell className="text-sm text-gray-600">{reg.staffName || '—'}</TableCell>
                    )}
                    <TableCell className="text-sm text-gray-600">
                      {new Date(reg.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

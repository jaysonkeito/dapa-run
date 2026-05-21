'use client'

import { useEffect, useState } from 'react'
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
import { Loader2 } from 'lucide-react'

interface Registration {
  id: string
  userId: string
  eventId: string
  distance: string
  createdAt: string
  user: { id: string; name: string; email: string; phone: string | null }
  event: { id: string; title: string; date: string }
}

interface Event {
  id: string
  title: string
}

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEvent, setFilterEvent] = useState<string>('all')

  const fetchData = async () => {
    try {
      const [regRes, eventsRes] = await Promise.all([
        fetch(filterEvent && filterEvent !== 'all' ? `/api/admin/registrations?eventId=${filterEvent}` : '/api/admin/registrations'),
        fetch('/api/admin/events'),
      ])
      const regData = await regRes.json()
      const eventsData = await eventsRes.json()
      setRegistrations(regData)
      setEvents(eventsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [filterEvent])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Registrations</h1>
          <p className="text-gray-500 mt-1">View all event registrations</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Filter by event:</span>
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

      <div className="bg-white rounded-xl shadow-md border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Registration Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading...
                  </TableCell>
                </TableRow>
              ) : registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-400">No registrations found.</TableCell>
                </TableRow>
              ) : (
                registrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">{reg.user?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-sm text-gray-600">{reg.user?.email || '—'}</TableCell>
                    <TableCell className="text-sm">{reg.event?.title || 'Unknown Event'}</TableCell>
                    <TableCell>
                      <Badge className="bg-orange-500 text-white">{reg.distance}</Badge>
                    </TableCell>
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

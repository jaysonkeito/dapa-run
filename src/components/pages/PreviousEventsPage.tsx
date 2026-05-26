'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { type EventData } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Calendar,
  MapPin,
  Search,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function PreviousEventsPage() {
  const { setCurrentPage, setSelectedResultEvent } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [allEvents, setAllEvents] = useState<EventData[]>([]) // for calendar

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events?status=past')
        if (res.ok) {
          const data = await res.json()
          const mapped: EventData[] = data.map((e: Record<string, unknown>) => ({
            id: e.id as string,
            title: e.title as string,
            date: e.date as string,
            time: e.time as string,
            location: e.location as string,
            priceRange: e.priceRange as string,
            image: e.image as string,
            distances: (e.distances as string).split(','),
            description: e.description as string,
            status: e.status as 'upcoming' | 'past',
            featured: e.featured as boolean,
          }))
          setEvents(mapped)
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  // Fetch ALL events (both upcoming and past) for calendar
  useEffect(() => {
    async function fetchAllEvents() {
      try {
        const [upcomingRes, pastRes] = await Promise.all([
          fetch('/api/events?status=upcoming'),
          fetch('/api/events?status=past')
        ])
        const upcoming = upcomingRes.ok ? await upcomingRes.json() : []
        const past = pastRes.ok ? await pastRes.json() : []
        const all = [...upcoming, ...past].map((e: Record<string, unknown>) => ({
          id: e.id as string,
          title: e.title as string,
          date: e.date as string,
          time: e.time as string,
          timeEnd: (e as Record<string, unknown>).timeEnd as string || '',
          location: e.location as string,
          priceRange: e.priceRange as string,
          image: e.image as string,
          distances: (e.distances as string).split(','),
          description: e.description as string,
          status: e.status as 'upcoming' | 'past',
          featured: e.featured as boolean,
        }))
        setAllEvents(all)
      } catch (error) {
        console.error('Failed to fetch calendar events:', error)
      }
    }
    fetchAllEvents()
  }, [])

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleViewResults = (eventId: string) => {
    setSelectedResultEvent(eventId)
    setCurrentPage('results')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-gray-900 to-gray-800 py-16 sm:py-20">
        <div className="absolute inset-0 opacity-20">
          <img src="/hero-banner.png" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4"
          >
            Previous Events
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-300 text-lg max-w-2xl mx-auto"
          >
            Relive the excitement of our past races. Check out the highlights and race results from our previous events.
          </motion.p>
        </div>
      </section>

      {/* Search & Calendar */}
      <section className="bg-white border-b sticky top-[120px] sm:top-[132px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search past events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setCalendarOpen(true)} className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendar
            </Button>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No events found.</p>
              <Button variant="outline" onClick={() => setSearchQuery('')} className="mt-4">
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <Badge className="absolute top-3 right-3 bg-gray-700 text-white text-xs">
                        Completed
                      </Badge>
                      <div className="absolute bottom-3 left-3 flex gap-2">
                        {event.distances.map((d) => (
                          <Badge key={d} variant="secondary" className="bg-white/90 text-gray-800 font-semibold text-xs">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-bold text-gray-900 mb-3 group-hover:text-orange-500 transition-colors">
                        {event.title}
                      </h3>
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-orange-400" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="w-3.5 h-3.5 text-orange-400" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>
                      <Button
                        onClick={() => handleViewResults(event.id)}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md"
                      >
                        <Trophy className="w-4 h-4 mr-2" />
                        View Race Results
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Calendar Dialog */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogTitle>Events Calendar</DialogTitle>
          <div className="mt-4">
            <CalendarView
              events={allEvents}
              onEventClick={(event) => {
                setCalendarOpen(false)
                if (event.status === 'past') {
                  handleViewResults(event.id)
                } else {
                  setCurrentPage('upcoming')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface CalendarEvent extends EventData {
  timeEnd?: string
}

function CalendarView({ events, onEventClick }: { events: CalendarEvent[], onEventClick: (e: CalendarEvent) => void }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))
  const goToThisMonth = () => setCurrentMonth(new Date())

  // Parse event dates and group by date string
  const eventsByDate: Record<string, CalendarEvent[]> = {}
  events.forEach(event => {
    let dateStr = ''
    try {
      const d = new Date(event.date)
      if (!isNaN(d.getTime())) {
        dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      }
    } catch {}
    if (!dateStr && event.date) {
      dateStr = event.date
    }
    if (dateStr) {
      if (!eventsByDate[dateStr]) eventsByDate[dateStr] = []
      eventsByDate[dateStr].push(event)
    }
  })

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Format time for display
  const formatTimeRange = (event: CalendarEvent) => {
    const start = event.time || ''
    const end = event.timeEnd || ''
    if (start && end) {
      return `${start} - ${end}`
    }
    return start
  }

  // Convert time to lowercase am/pm for display
  const formatTimeShort = (timeStr: string) => {
    if (!timeStr) return ''
    return timeStr.replace(/\s*(AM|PM)/i, (match) => match.toLowerCase())
  }

  return (
    <div>
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-gray-900">{monthName}</h3>
          <button
            onClick={goToThisMonth}
            className="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            This Month
          </button>
        </div>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-600 font-medium">Upcoming Event</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <span className="text-xs text-gray-600 font-medium">Past Event</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-xs text-gray-600 font-medium">Today</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className="bg-gray-50 text-center text-xs font-semibold text-gray-500 py-3 uppercase tracking-wider">
            {day}
          </div>
        ))}

        {/* Empty cells for days before the 1st */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-gray-50 min-h-[100px]" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayEvents = eventsByDate[dateStr] || []
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
          const hasEvents = dayEvents.length > 0

          return (
            <div
              key={day}
              className={`bg-white min-h-[100px] p-2 transition-colors ${
                hasEvents ? 'cursor-pointer hover:bg-orange-50/50' : ''
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-sm font-medium ${
                  isToday
                    ? 'bg-orange-500 text-white w-7 h-7 rounded-full flex items-center justify-center'
                    : hasEvents
                      ? 'text-gray-900 font-bold'
                      : 'text-gray-500'
                }`}>
                  {day}
                </span>
                {hasEvents && !isToday && (
                  <div className={`w-2 h-2 rounded-full ${
                    dayEvents[0].status === 'upcoming' ? 'bg-emerald-500' : 'bg-gray-400'
                  }`} />
                )}
              </div>

              {/* Event indicators in cell */}
              {dayEvents.map(event => (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={`w-full text-left rounded-md px-2 py-1.5 mt-1 transition-all hover:scale-[1.02] ${
                    event.status === 'upcoming'
                      ? 'bg-emerald-50 border border-emerald-200 hover:border-emerald-400'
                      : 'bg-gray-50 border border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className={`text-[10px] font-medium ${
                    event.status === 'upcoming' ? 'text-emerald-600' : 'text-gray-500'
                  }`}>
                    {formatTimeShort(formatTimeRange(event))}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-800 truncate leading-tight">
                    {event.title}
                  </div>
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

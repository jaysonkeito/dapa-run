'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { previousEvents as fallbackEvents, type EventData } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Calendar,
  MapPin,
  Search,
  Trophy,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function PreviousEventsPage() {
  const { setCurrentPage, setSelectedResultEvent } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [events, setEvents] = useState<EventData[]>(fallbackEvents)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events?status=past')
        if (res.ok) {
          const data = await res.json()
          if (data.length > 0) {
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
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
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

      {/* Search */}
      <section className="bg-white border-b sticky top-[120px] sm:top-[132px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search past events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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
    </div>
  )
}

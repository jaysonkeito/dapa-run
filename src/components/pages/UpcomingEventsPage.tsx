'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useStore } from '@/store/useStore'
import { type EventData } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  MapPin,
  Clock,
  Route,
  Star,
  ArrowRight,
  Search,
  Filter,
  Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import CountdownTimer from '@/components/CountdownTimer'

interface EventApiData extends EventData {
  regCloseDate?: string
  regCloseTime?: string
  basePrice?: number
  finisherShirtPrice?: number
  singletPrice?: number
  finisherShirtSizes?: string | null
  singletSizes?: string | null
  distancePricing?: string
  isPackage?: boolean
}

export default function UpcomingEventsPage() {
  const { data: session } = useSession()
  const { setAuthModalOpen, setAuthModalTab } = useStore()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDistance, setSelectedDistance] = useState<string>('all')
  const [events, setEvents] = useState<EventApiData[]>([])
  const [loading, setLoading] = useState(true)
  const [regDialogOpen, setRegDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventApiData | null>(null)
  const [regDistance, setRegDistance] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  // Add-on state
  const [availFinisherShirt, setAvailFinisherShirt] = useState(false)
  const [finisherShirtSize, setFinisherShirtSize] = useState('')
  const [availSinglet, setAvailSinglet] = useState(false)
  const [singletSize, setSingletSize] = useState('')

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events?status=upcoming')
        if (res.ok) {
          const data = await res.json()
          const mapped: EventApiData[] = data.map((e: Record<string, unknown>) => ({
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
            regCloseDate: (e.regCloseDate as string) || '',
            regCloseTime: (e.regCloseTime as string) || '',
            basePrice: (e.basePrice as number) || 0,
            finisherShirtPrice: (e.finisherShirtPrice as number) || 0,
            singletPrice: (e.singletPrice as number) || 0,
            finisherShirtSizes: (e.finisherShirtSizes as string | null) || null,
            singletSizes: (e.singletSizes as string | null) || null,
            distancePricing: (e.distancePricing as string) || '',
            isPackage: (e.isPackage as boolean) || false,
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

  const distances = ['all', '3K', '5K', '10K', '21K', '25K', '42K', '50K', '100K']

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDistance =
      selectedDistance === 'all' || event.distances.includes(selectedDistance)
    return matchesSearch && matchesDistance
  })

  const handleRegisterClick = (event: EventApiData) => {
    if (!session?.user) {
      setAuthModalTab('login')
      setAuthModalOpen(true)
      toast({
        title: 'Login Required',
        description: 'Please login or create an account to register for events.',
      })
      return
    }
    setSelectedEvent(event)
    setRegDistance(event.distances[0])
    setAvailFinisherShirt(false)
    setFinisherShirtSize('')
    setAvailSinglet(false)
    setSingletSize('')
    setRegDialogOpen(true)
  }

  // Calculate total amount
  const totalAmount = useMemo(() => {
    if (!selectedEvent) return 0
    const pricing = selectedEvent.distancePricing ? (() => { try { return JSON.parse(selectedEvent.distancePricing) } catch { return {} } })() : {}
    const distancePrice = (pricing[regDistance] as number) || selectedEvent.basePrice || 0

    if (selectedEvent.isPackage) {
      return distancePrice // Package includes everything
    }

    let total = distancePrice
    if (availFinisherShirt) total += selectedEvent.finisherShirtPrice || 0
    if (availSinglet) total += selectedEvent.singletPrice || 0
    return total
  }, [selectedEvent, regDistance, availFinisherShirt, availSinglet])

  const finisherSizes = useMemo(() => {
    if (!selectedEvent?.finisherShirtSizes) return []
    return selectedEvent.finisherShirtSizes.split(',').map(s => s.trim()).filter(Boolean)
  }, [selectedEvent])

  const singletSizesList = useMemo(() => {
    if (!selectedEvent?.singletSizes) return []
    return selectedEvent.singletSizes.split(',').map(s => s.trim()).filter(Boolean)
  }, [selectedEvent])

  const handleRegister = async () => {
    if (!selectedEvent || !regDistance) return

    // For package, sizes are included but may need selection
    if (selectedEvent.isPackage) {
      if (finisherSizes.length > 0 && !finisherShirtSize) {
        toast({ title: 'Missing Size', description: 'Please select a finisher shirt size.', variant: 'destructive' })
        return
      }
      if (singletSizesList.length > 0 && !singletSize) {
        toast({ title: 'Missing Size', description: 'Please select a singlet size.', variant: 'destructive' })
        return
      }
    } else {
      if (availFinisherShirt && !finisherShirtSize) {
        toast({ title: 'Missing Size', description: 'Please select a finisher shirt size.', variant: 'destructive' })
        return
      }
      if (availSinglet && !singletSize) {
        toast({ title: 'Missing Size', description: 'Please select a singlet size.', variant: 'destructive' })
        return
      }
    }

    setRegLoading(true)
    try {
      const res = await fetch('/api/auth/event-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          distance: regDistance,
          finisherShirtSize: (selectedEvent.isPackage && finisherSizes.length > 0) ? finisherShirtSize : (availFinisherShirt ? finisherShirtSize : null),
          singletSize: (selectedEvent.isPackage && singletSizesList.length > 0) ? singletSize : (availSinglet ? singletSize : null),
          totalAmount,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Registration Failed', description: data.error || 'Something went wrong.', variant: 'destructive' })
      } else {
        toast({ title: 'Registered!', description: `You have registered for ${selectedEvent.title} (${regDistance}). Total: ₱${totalAmount.toLocaleString()}` })
        setRegDialogOpen(false)
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
    } finally {
      setRegLoading(false)
    }
  }

  // Get distance-specific price for display
  const getDistancePrice = (event: EventApiData, distance: string): number => {
    const pricing = event.distancePricing ? (() => { try { return JSON.parse(event.distancePricing) } catch { return {} } })() : {}
    return (pricing[distance] as number) || event.basePrice || 0
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
            Upcoming Events
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-300 text-lg max-w-2xl mx-auto"
          >
            Find your next race and register today. From fun runs to ultra marathons, we have something for every runner.
          </motion.p>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="bg-white border-b sticky top-[120px] sm:top-[132px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              {distances.map((dist) => (
                <button
                  key={dist}
                  onClick={() => setSelectedDistance(dist)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedDistance === dist
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {dist === 'all' ? 'All' : dist}
                </button>
              ))}
            </div>
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
              <p className="text-gray-500 text-lg">No events found matching your criteria.</p>
              <Button
                variant="outline"
                onClick={() => { setSearchQuery(''); setSelectedDistance('all') }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group">
                    <div className="grid grid-cols-1 lg:grid-cols-3">
                      <div className="relative h-56 lg:h-auto lg:min-h-[280px] overflow-hidden">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        {event.featured && (
                          <Badge className="absolute top-4 left-4 bg-orange-500 text-white font-bold">
                            Featured
                          </Badge>
                        )}
                        {event.isPackage && (
                          <Badge className="absolute top-4 right-4 bg-emerald-500 text-white font-bold">
                            Complete Package
                          </Badge>
                        )}
                        <div className="absolute bottom-4 left-4 flex gap-2">
                          {event.distances.map((d) => (
                            <Badge key={d} variant="secondary" className="bg-white/90 text-gray-800 font-semibold text-xs">
                              {d}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <CardContent className="lg:col-span-2 p-6 sm:p-8 flex flex-col justify-center">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-orange-500 transition-colors mb-4">
                              {event.title}
                            </h3>
                            <div className="space-y-2.5">
                              <div className="flex items-center gap-3 text-gray-600">
                                <Calendar className="w-4 h-4 text-orange-500 shrink-0" />
                                <span className="text-sm">{event.date} • {event.time}</span>
                              </div>
                              <div className="flex items-center gap-3 text-gray-600">
                                <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                                <span className="text-sm">{event.location}</span>
                              </div>
                              <div className="flex items-center gap-3 text-gray-700 font-semibold">
                                <Star className="w-4 h-4 text-orange-500 shrink-0" />
                                <span className="text-sm">{event.priceRange}</span>
                              </div>
                            </div>
                            <p className="text-gray-500 text-sm mt-4 leading-relaxed">
                              {event.description}
                            </p>
                            <CountdownTimer targetDate={event.regCloseDate || event.date} />
                          </div>
                          <Button
                            onClick={() => handleRegisterClick(event)}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-200 shrink-0"
                          >
                            Register Now
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Registration Dialog */}
      <Dialog open={regDialogOpen} onOpenChange={setRegDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogTitle>Register for Event</DialogTitle>
          {selectedEvent && (
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="font-bold text-gray-900">{selectedEvent.title}</h3>
                <p className="text-sm text-gray-500">{selectedEvent.date} • {selectedEvent.time}</p>
                <p className="text-sm text-gray-500">{selectedEvent.location}</p>
              </div>

              {/* Distance Selector */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">Select Distance</p>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.distances.map((d) => (
                    <button
                      key={d}
                      onClick={() => setRegDistance(d)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        regDistance === d
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Display based on registration type */}
              {selectedEvent.isPackage ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">Complete Package</span>
                    <span className="text-sm font-semibold text-gray-900">₱{totalAmount.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-500">Includes registration, finisher shirt & race singlet</p>
                  {/* Show size selectors directly (no checkbox needed) */}
                  {finisherSizes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Finisher Shirt Size</p>
                      <Select value={finisherShirtSize} onValueChange={setFinisherShirtSize}>
                        <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                        <SelectContent>
                          {finisherSizes.map((size) => (
                            <SelectItem key={size} value={size}>{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {singletSizesList.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Race Singlet Size</p>
                      <Select value={singletSize} onValueChange={setSingletSize}>
                        <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                        <SelectContent>
                          {singletSizesList.map((size) => (
                            <SelectItem key={size} value={size}>{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Registration Fee */}
                  {(getDistancePrice(selectedEvent, regDistance) ?? 0) > 0 && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Registration Fee</span>
                      <span className="text-sm font-semibold text-gray-900">₱{getDistancePrice(selectedEvent, regDistance).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Finisher Shirt Add-on */}
                  {(selectedEvent.finisherShirtPrice ?? 0) > 0 && (
                    <div className="border rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="finisher-shirt"
                            checked={availFinisherShirt}
                            onCheckedChange={(checked) => {
                              setAvailFinisherShirt(!!checked)
                              if (!checked) setFinisherShirtSize('')
                            }}
                          />
                          <label htmlFor="finisher-shirt" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Avail Finisher Shirt
                          </label>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">+₱{(selectedEvent.finisherShirtPrice ?? 0).toLocaleString()}</span>
                      </div>
                      {availFinisherShirt && finisherSizes.length > 0 && (
                        <Select value={finisherShirtSize} onValueChange={setFinisherShirtSize}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            {finisherSizes.map((size) => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Singlet Add-on */}
                  {(selectedEvent.singletPrice ?? 0) > 0 && (
                    <div className="border rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="singlet"
                            checked={availSinglet}
                            onCheckedChange={(checked) => {
                              setAvailSinglet(!!checked)
                              if (!checked) setSingletSize('')
                            }}
                          />
                          <label htmlFor="singlet" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Avail Singlet
                          </label>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">+₱{(selectedEvent.singletPrice ?? 0).toLocaleString()}</span>
                      </div>
                      {availSinglet && singletSizesList.length > 0 && (
                        <Select value={singletSize} onValueChange={setSingletSize}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            {singletSizesList.map((size) => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Total Amount */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Total Amount</span>
                  <span className="text-lg font-bold text-orange-600">₱{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={handleRegister}
                disabled={regLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg"
              >
                {regLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    Confirm Registration — ₱{totalAmount.toLocaleString()}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Calendar, MapPin, Clock, DollarSign, Users, UserPlus, Loader2, Shirt, Trophy } from 'lucide-react'
import CountdownTimer from '@/components/CountdownTimer'

interface Registration {
  id: string
  distance: string
  finisherShirtSize: string | null
  singletSize: string | null
  totalAmount: number
  createdAt: string
  user: { id: string; name: string; email: string }
}

interface OnsiteReg {
  id: string
  participantName: string
  participantEmail: string | null
  participantPhone: string | null
  distance: string
  paymentMethod: string
  amountPaid: number
  finisherShirtSize: string | null
  singletSize: string | null
  staffName: string | null
  createdAt: string
}

interface RaceResult {
  id: string
  distance: string
  finishers: string
}

interface EventDetail {
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
  registrations: Registration[]
  onsiteRegistrations: OnsiteReg[]
  results: RaceResult[]
}

type RegTab = 'all' | 'online' | 'onsite'

function formatPrice(amount: number): string {
  return `₱${amount.toLocaleString()}`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A'
  return dateStr
}

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [regTab, setRegTab] = useState<RegTab>('all')

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/admin/events/${eventId}/detail`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setEvent(data)
      } catch (error) {
        console.error('Failed to fetch event:', error)
      } finally {
        setLoading(false)
      }
    }
    if (eventId) fetchEvent()
  }, [eventId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Event not found.</p>
        <Button onClick={() => router.push('/admin/dashboard/events')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
        </Button>
      </div>
    )
  }

  // Group registrations by distance
  const distanceGroups: Record<string, Registration[]> = {}
  event.registrations.forEach((reg) => {
    if (!distanceGroups[reg.distance]) distanceGroups[reg.distance] = []
    distanceGroups[reg.distance].push(reg)
  })

  // Group onsite registrations by distance
  const onsiteDistanceGroups: Record<string, OnsiteReg[]> = {}
  event.onsiteRegistrations.forEach((reg) => {
    if (!onsiteDistanceGroups[reg.distance]) onsiteDistanceGroups[reg.distance] = []
    onsiteDistanceGroups[reg.distance].push(reg)
  })

  // Combine all registrations for "All" tab
  const allDistanceGroups: Record<string, { type: string; data: Registration | OnsiteReg }[]> = {}
  // Add online registrations
  Object.entries(distanceGroups).forEach(([distance, regs]) => {
    if (!allDistanceGroups[distance]) allDistanceGroups[distance] = []
    regs.forEach((reg) => {
      allDistanceGroups[distance].push({ type: 'online', data: reg })
    })
  })
  // Add onsite registrations
  Object.entries(onsiteDistanceGroups).forEach(([distance, regs]) => {
    if (!allDistanceGroups[distance]) allDistanceGroups[distance] = []
    regs.forEach((reg) => {
      allDistanceGroups[distance].push({ type: 'onsite', data: reg })
    })
  })

  const regCloseDateTime = event.regCloseDate
    ? `${event.regCloseDate} ${event.regCloseTime || '11:59 PM'}`
    : ''

  const totalOnlineRegs = event.registrations.length
  const totalOnsiteRegs = event.onsiteRegistrations.length
  const totalRegs = totalOnlineRegs + totalOnsiteRegs
  const totalRevenue = event.registrations.reduce((sum, r) => sum + (r.totalAmount || 0), 0) +
    event.onsiteRegistrations.reduce((sum, r) => sum + (r.amountPaid || 0), 0)

  const isPast = event.status === 'past'

  // Parse race results for past events
  interface Finisher {
    rank: number
    bib: string
    name: string
    time: string
    gender: string
  }

  const parsedResults: Record<string, Finisher[]> = {}
  if (isPast && event.results) {
    event.results.forEach((result) => {
      try {
        const finishers = JSON.parse(result.finishers)
        if (Array.isArray(finishers) && finishers.length > 0) {
          parsedResults[result.distance] = finishers
        }
      } catch {
        // ignore parse errors
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push('/admin/dashboard/events')} className="text-gray-500 hover:text-orange-500">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{event.title}</h1>
              <Badge className={event.status === 'upcoming' ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'}>
                {event.status}
              </Badge>
              {event.featured && (
                <Badge className="bg-orange-500 text-white">Featured</Badge>
              )}
            </div>
            <p className="text-gray-500 mt-1">Event Details & Registrations</p>
          </div>
        </div>
      </div>

      {/* Event Image */}
      {event.image && event.image !== '/hero-banner.png' && (
        <div className="rounded-xl overflow-hidden shadow-md max-h-64">
          <img src={event.image} alt={event.title} className="w-full h-64 object-cover" />
        </div>
      )}

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Race Date</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(event.date)}</p>
                <p className="text-xs text-gray-500">{event.time}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Reg. Closes</p>
                <p className="text-sm font-semibold text-gray-900">{event.regCloseDate ? formatDate(event.regCloseDate) : 'Not set'}</p>
                <p className="text-xs text-gray-500">{event.regCloseTime || ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Location</p>
                <p className="text-sm font-semibold text-gray-900">{event.location}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Total Revenue</p>
                <p className="text-sm font-bold text-orange-600">{formatPrice(totalRevenue)}</p>
                <p className="text-xs text-gray-500">{totalRegs} registrations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Countdown Timer */}
      {event.status === 'upcoming' && regCloseDateTime && (
        <Card className="border-0 shadow-md bg-gradient-to-r from-orange-50 to-red-50">
          <CardContent className="p-6">
            <CountdownTimer targetDate={regCloseDateTime} label="Registration Closes In" />
          </CardContent>
        </Card>
      )}

      {/* Pricing Breakdown */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-orange-500" />
            Registration Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Base Registration</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(event.basePrice)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Finisher Shirt</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{event.finisherShirtPrice ? formatPrice(event.finisherShirtPrice) : 'N/A'}</p>
              {event.finisherShirtSizes && (
                <p className="text-xs text-gray-400 mt-1">Sizes: {event.finisherShirtSizes}</p>
              )}
            </div>
            <div className="bg-emerald-50 rounded-lg p-4 text-center">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Singlet</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{event.singletPrice ? formatPrice(event.singletPrice) : 'N/A'}</p>
              {event.singletSizes && (
                <p className="text-xs text-gray-400 mt-1">Sizes: {event.singletSizes}</p>
              )}
            </div>
          </div>
          {event.basePrice > 0 && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              Maximum total with all add-ons: <span className="font-bold text-orange-600">{formatPrice(event.basePrice + (event.finisherShirtPrice || 0) + (event.singletPrice || 0))}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Distances & Description */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">Distances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {event.distances.split(',').map((d) => (
                <Badge key={d.trim()} className="bg-orange-500 text-white px-3 py-1 text-sm">
                  {d.trim()}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{event.description || 'No description provided.'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Registrations Card with Toggle */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              Registrations ({totalOnlineRegs} online, {totalOnsiteRegs} on-site)
            </CardTitle>
            {/* Toggle Tabs */}
            <div className="flex items-center gap-2">
              {(['all', 'online', 'onsite'] as RegTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRegTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    regTab === tab
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab === 'all' ? `All (${totalRegs})` : tab === 'online' ? `Online (${totalOnlineRegs})` : `On-site (${totalOnsiteRegs})`}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {totalRegs === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No registrations yet.</p>
          ) : regTab === 'onsite' ? (
            // On-site Only
            event.onsiteRegistrations.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No on-site registrations.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Finisher Shirt</TableHead>
                      <TableHead>Singlet</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {event.onsiteRegistrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{reg.participantName}</p>
                            {reg.participantEmail && <p className="text-xs text-gray-400">{reg.participantEmail}</p>}
                          </div>
                        </TableCell>
                        <TableCell><Badge className="bg-orange-500 text-white text-xs">{reg.distance}</Badge></TableCell>
                        <TableCell>
                          {reg.finisherShirtSize ? (
                            <Badge className="bg-purple-100 text-purple-700 text-xs"><Shirt className="w-3 h-3 mr-1" />{reg.finisherShirtSize}</Badge>
                          ) : (
                            <span className="text-gray-300 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {reg.singletSize ? (
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs"><Shirt className="w-3 h-3 mr-1" />{reg.singletSize}</Badge>
                          ) : (
                            <span className="text-gray-300 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 capitalize">{reg.paymentMethod}</TableCell>
                        <TableCell className="font-semibold text-orange-600">{formatPrice(reg.amountPaid)}</TableCell>
                        <TableCell className="text-xs text-gray-400">{new Date(reg.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : regTab === 'online' ? (
            // Online Only - grouped by distance
            event.registrations.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No online registrations.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(distanceGroups).map(([distance, regs]) => (
                  <div key={distance}>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Badge className="bg-orange-500 text-white">{distance}</Badge>
                      <span className="text-gray-400">({regs.length} runner{regs.length !== 1 ? 's' : ''})</span>
                    </h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Finisher Shirt</TableHead>
                            <TableHead>Singlet</TableHead>
                            <TableHead>Total Paid</TableHead>
                            <TableHead>Registered</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {regs.map((reg) => (
                            <TableRow key={reg.id}>
                              <TableCell className="font-medium">{reg.user.name}</TableCell>
                              <TableCell className="text-sm text-gray-500">{reg.user.email}</TableCell>
                              <TableCell>
                                {reg.finisherShirtSize ? (
                                  <Badge className="bg-purple-100 text-purple-700 text-xs"><Shirt className="w-3 h-3 mr-1" />{reg.finisherShirtSize}</Badge>
                                ) : (
                                  <span className="text-gray-300 text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {reg.singletSize ? (
                                  <Badge className="bg-emerald-100 text-emerald-700 text-xs"><Shirt className="w-3 h-3 mr-1" />{reg.singletSize}</Badge>
                                ) : (
                                  <span className="text-gray-300 text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="font-semibold text-orange-600">{reg.totalAmount ? formatPrice(reg.totalAmount) : '-'}</TableCell>
                              <TableCell className="text-xs text-gray-400">{new Date(reg.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // All - show combined by distance
            Object.keys(allDistanceGroups).length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No registrations yet.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(allDistanceGroups).map(([distance, entries]) => (
                  <div key={distance}>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Badge className="bg-orange-500 text-white">{distance}</Badge>
                      <span className="text-gray-400">({entries.length} registration{entries.length !== 1 ? 's' : ''})</span>
                    </h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Finisher Shirt</TableHead>
                            <TableHead>Singlet</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {entries.map((entry, idx) => {
                            const isOnline = entry.type === 'online'
                            const reg = entry.data
                            return (
                              <TableRow key={`${entry.type}-${idx}`}>
                                <TableCell>
                                  <Badge className={isOnline ? 'bg-blue-100 text-blue-700 text-xs' : 'bg-emerald-100 text-emerald-700 text-xs'}>
                                    {isOnline ? 'Online' : 'On-site'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {isOnline ? (entry.data as Registration).user.name : (entry.data as OnsiteReg).participantName}
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                  {isOnline ? (entry.data as Registration).user.email : ((entry.data as OnsiteReg).participantEmail || '—')}
                                </TableCell>
                                <TableCell>
                                  {reg.finisherShirtSize ? (
                                    <Badge className="bg-purple-100 text-purple-700 text-xs"><Shirt className="w-3 h-3 mr-1" />{reg.finisherShirtSize}</Badge>
                                  ) : (
                                    <span className="text-gray-300 text-sm">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {reg.singletSize ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 text-xs"><Shirt className="w-3 h-3 mr-1" />{reg.singletSize}</Badge>
                                  ) : (
                                    <span className="text-gray-300 text-sm">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="font-semibold text-orange-600">
                                  {isOnline ? formatPrice((entry.data as Registration).totalAmount || 0) : formatPrice((entry.data as OnsiteReg).amountPaid || 0)}
                                </TableCell>
                                <TableCell className="text-xs text-gray-400">
                                  {new Date(reg.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Race Results for Past Events */}
      {isPast && Object.keys(parsedResults).length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Race Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(parsedResults).map(([distance, finishers]) => (
                <div key={distance}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Badge className="bg-orange-500 text-white">{distance}</Badge>
                    <span className="text-gray-400">({finishers.length} finisher{finishers.length !== 1 ? 's' : ''})</span>
                  </h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Bib #</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Gender</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {finishers.map((f: Finisher, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                f.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                                f.rank === 2 ? 'bg-gray-100 text-gray-600' :
                                f.rank === 3 ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-50 text-gray-400'
                              }`}>
                                {f.rank}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">{f.bib || '—'}</TableCell>
                            <TableCell className="font-medium text-gray-900">{f.name}</TableCell>
                            <TableCell className="text-sm text-gray-600 font-mono">{f.time}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs capitalize">{f.gender || '—'}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

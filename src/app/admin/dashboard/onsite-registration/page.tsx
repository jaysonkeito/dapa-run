'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  UserPlus,
  Loader2,
  Search,
  Banknote,
  Smartphone,
  CreditCard,
  Printer,
  CheckCircle2,
  ClipboardList,
  Download,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { generateCSV, formatDateForReport, formatPriceForReport } from '@/lib/report-utils'

interface Event {
  id: string
  title: string
  date: string
  distances: string
  status: string
  basePrice?: number
  finisherShirtPrice?: number
  singletPrice?: number
  finisherShirtSizes?: string | null
  singletSizes?: string | null
  distancePricing?: string
  isPackage?: boolean
}

interface OnSiteRegistration {
  id: string
  eventId: string
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
  event: { title: string; date: string }
}

type PaymentMethod = 'cash' | 'gcash' | 'card'

const paymentMethodConfig: Record<PaymentMethod, { label: string; icon: React.ReactNode; color: string }> = {
  cash: { label: 'Cash', icon: <Banknote className="w-4 h-4" />, color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
  gcash: { label: 'GCash', icon: <Smartphone className="w-4 h-4" />, color: 'bg-blue-500 hover:bg-blue-600 text-white' },
  card: { label: 'Card', icon: <CreditCard className="w-4 h-4" />, color: 'bg-violet-500 hover:bg-violet-600 text-white' },
}

const emptyForm = {
  eventId: '',
  participantName: '',
  participantEmail: '',
  participantPhone: '',
  distance: '',
  paymentMethod: 'cash' as PaymentMethod,
  amountPaid: '',
  availFinisherShirt: false,
  finisherShirtSize: '',
  availSinglet: false,
  singletSize: '',
}

export default function OnSiteRegistrationPage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  // Form state
  const [form, setForm] = useState(emptyForm)
  const [events, setEvents] = useState<Event[]>([])
  const [availableDistances, setAvailableDistances] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Registrations list state
  const [registrations, setRegistrations] = useState<OnSiteRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [lastRegistration, setLastRegistration] = useState<OnSiteRegistration | null>(null)

  // Fetch upcoming events
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events?status=upcoming')
      const data = await res.json()
      setEvents(data)
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }, [])

  // Fetch on-site registrations
  const fetchRegistrations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/onsite-registration')
      const data = await res.json()
      setRegistrations(data)
    } catch (error) {
      console.error('Failed to fetch registrations:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    fetchRegistrations()
  }, [fetchEvents, fetchRegistrations])

  // When event changes, update available distances
  useEffect(() => {
    if (form.eventId) {
      const selectedEv = events.find((e) => e.id === form.eventId)
      if (selectedEv?.distances) {
        const distances = selectedEv.distances.split(',').map((d) => d.trim()).filter(Boolean)
        setAvailableDistances(distances)
        if (form.distance && !distances.includes(form.distance)) {
          setForm((prev) => ({ ...prev, distance: '' }))
        }
      } else {
        setAvailableDistances([])
        setForm((prev) => ({ ...prev, distance: '' }))
      }
    } else {
      setAvailableDistances([])
      setForm((prev) => ({ ...prev, distance: '' }))
    }
  }, [form.eventId, events])

  const selectedEvent = events.find((e) => e.id === form.eventId)

  // Get available sizes from the selected event
  const finisherSizes = useMemo(() => {
    if (!selectedEvent?.finisherShirtSizes) return []
    return selectedEvent.finisherShirtSizes.split(',').map(s => s.trim()).filter(Boolean)
  }, [selectedEvent])

  const singletSizesList = useMemo(() => {
    if (!selectedEvent?.singletSizes) return []
    return selectedEvent.singletSizes.split(',').map(s => s.trim()).filter(Boolean)
  }, [selectedEvent])

  // Calculate total amount
  const calculatedTotal = useMemo(() => {
    const pricing = selectedEvent?.distancePricing ? (() => { try { return JSON.parse(selectedEvent.distancePricing) } catch { return {} } })() : {}
    const distancePrice = (pricing[form.distance] as number) || selectedEvent?.basePrice || 0

    if (selectedEvent?.isPackage) {
      return distancePrice
    }

    let total = distancePrice
    if (form.availFinisherShirt) total += selectedEvent?.finisherShirtPrice || 0
    if (form.availSinglet) total += selectedEvent?.singletPrice || 0
    return total
  }, [selectedEvent, form.distance, form.availFinisherShirt, form.availSinglet])

  const handleRegister = async () => {
    if (!form.eventId) {
      toast({ title: 'Missing Field', description: 'Please select an event.', variant: 'destructive' })
      return
    }
    if (!form.participantName.trim()) {
      toast({ title: 'Missing Field', description: 'Participant name is required.', variant: 'destructive' })
      return
    }
    if (!form.distance) {
      toast({ title: 'Missing Field', description: 'Please select a distance.', variant: 'destructive' })
      return
    }
    if (form.availFinisherShirt && !form.finisherShirtSize) {
      toast({ title: 'Missing Size', description: 'Please select a finisher shirt size.', variant: 'destructive' })
      return
    }
    if (form.availSinglet && !form.singletSize) {
      toast({ title: 'Missing Size', description: 'Please select a singlet size.', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const staffName = (session?.user as Record<string, unknown>)?.name as string | undefined
      const amountToPay = form.amountPaid ? Number(form.amountPaid) : calculatedTotal

      const res = await fetch('/api/admin/onsite-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: form.eventId,
          participantName: form.participantName.trim(),
          participantEmail: form.participantEmail.trim() || null,
          participantPhone: form.participantPhone.trim() || null,
          distance: form.distance,
          paymentMethod: form.paymentMethod,
          amountPaid: amountToPay,
          finisherShirtSize: form.availFinisherShirt ? form.finisherShirtSize : null,
          singletSize: form.availSinglet ? form.singletSize : null,
          staffName: staffName || null,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Registration failed')
      }

      const newRegistration = await res.json()
      setLastRegistration(newRegistration)
      setConfirmDialogOpen(true)

      // Reset form for next participant
      setForm({
        ...emptyForm,
        eventId: form.eventId,
        paymentMethod: form.paymentMethod,
      })

      // Refresh registrations list
      fetchRegistrations()

      toast({
        title: 'Registration Successful',
        description: `${newRegistration.participantName} has been registered for ${newRegistration.event?.title}.`,
      })
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'Something went wrong.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrintSlip = () => {
    const reg = lastRegistration
    if (!reg) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Registration Confirmation</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 400px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #f97316; }
          .logo { font-size: 28px; font-weight: 800; color: #f97316; letter-spacing: 1px; }
          .subtitle { font-size: 12px; color: #6b7280; margin-top: 4px; text-transform: uppercase; letter-spacing: 2px; }
          .title { text-align: center; font-size: 16px; font-weight: 700; margin-bottom: 20px; color: #1f2937; background: #fff7ed; padding: 8px; border-radius: 6px; }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
          .label { color: #6b7280; font-size: 13px; }
          .value { color: #1f2937; font-size: 14px; font-weight: 600; text-align: right; }
          .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 2px dashed #e5e7eb; }
          .footer p { font-size: 11px; color: #9ca3af; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">DAPA RUN</div>
          <div class="subtitle">On-site Registration</div>
        </div>
        <div class="title">Confirmation Slip</div>
        <div class="row"><span class="label">Event</span><span class="value">${reg.event?.title || ''}</span></div>
        <div class="row"><span class="label">Participant</span><span class="value">${reg.participantName}</span></div>
        ${reg.participantEmail ? `<div class="row"><span class="label">Email</span><span class="value">${reg.participantEmail}</span></div>` : ''}
        ${reg.participantPhone ? `<div class="row"><span class="label">Phone</span><span class="value">${reg.participantPhone}</span></div>` : ''}
        <div class="row"><span class="label">Distance</span><span class="value">${reg.distance}</span></div>
        ${reg.finisherShirtSize ? `<div class="row"><span class="label">Finisher Shirt</span><span class="value">Size: ${reg.finisherShirtSize}</span></div>` : ''}
        ${reg.singletSize ? `<div class="row"><span class="label">Singlet</span><span class="value">Size: ${reg.singletSize}</span></div>` : ''}
        <div class="row"><span class="label">Payment Method</span><span class="value">${reg.paymentMethod?.toUpperCase()}</span></div>
        <div class="row"><span class="label">Amount Paid</span><span class="value">₱${reg.amountPaid?.toLocaleString() || '0'}</span></div>
        <div class="row"><span class="label">Date/Time</span><span class="value">${new Date(reg.createdAt).toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
        ${reg.staffName ? `<div class="row"><span class="label">Registered By</span><span class="value">${reg.staffName}</span></div>` : ''}
        <div class="footer">
          <p>Present this slip at the registration desk.<br/>Thank you for joining DAPA RUN!</p>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank', 'width=500,height=600')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const handleGenerateReport = () => {
    const headers = ['Participant Name', 'Email', 'Phone', 'Event', 'Distance', 'Finisher Shirt', 'Singlet', 'Payment Method', 'Amount Paid', 'Staff', 'Date']
    const rows = registrations.map((reg) => [
      reg.participantName,
      reg.participantEmail || '—',
      reg.participantPhone || '—',
      reg.event?.title || 'Unknown',
      reg.distance,
      reg.finisherShirtSize || '—',
      reg.singletSize || '—',
      reg.paymentMethod,
      formatPriceForReport(reg.amountPaid),
      reg.staffName || '—',
      formatDateForReport(reg.createdAt),
    ])
    generateCSV(headers, rows, 'dapa-run-onsite-registrations-report')
    toast({ title: 'Report Generated', description: 'On-site registrations report has been downloaded.' })
  }

  // Filter registrations by search
  const filteredRegistrations = registrations.filter((reg) =>
    reg.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Top Section - Registration Form */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">On-site Registration</CardTitle>
              <CardDescription>Register walk-in participants for events</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Event Select */}
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="event-select" className="text-sm font-medium">
                Event <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.eventId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, eventId: value, distance: '', availFinisherShirt: false, finisherShirtSize: '', availSinglet: false, singletSize: '' }))}
              >
                <SelectTrigger id="event-select" className="w-full">
                  <SelectValue placeholder="Select an event..." />
                </SelectTrigger>
                <SelectContent>
                  {events.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">No upcoming events</div>
                  ) : (
                    events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        <div className="flex items-center gap-2">
                          <span>{event.title}</span>
                          <span className="text-gray-400 text-xs">— {event.date}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Participant Name */}
            <div className="space-y-2">
              <Label htmlFor="participant-name" className="text-sm font-medium">
                Participant Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="participant-name"
                placeholder="Full name"
                value={form.participantName}
                onChange={(e) => setForm((prev) => ({ ...prev, participantName: e.target.value }))}
              />
            </div>

            {/* Participant Email */}
            <div className="space-y-2">
              <Label htmlFor="participant-email" className="text-sm font-medium">
                Participant Email <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="participant-email"
                type="email"
                placeholder="email@example.com"
                value={form.participantEmail}
                onChange={(e) => setForm((prev) => ({ ...prev, participantEmail: e.target.value }))}
              />
            </div>

            {/* Participant Phone */}
            <div className="space-y-2">
              <Label htmlFor="participant-phone" className="text-sm font-medium">
                Participant Phone <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="participant-phone"
                type="tel"
                placeholder="09XX XXX XXXX"
                value={form.participantPhone}
                onChange={(e) => setForm((prev) => ({ ...prev, participantPhone: e.target.value }))}
              />
            </div>

            {/* Distance Select */}
            <div className="space-y-2">
              <Label htmlFor="distance-select" className="text-sm font-medium">
                Distance <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.distance}
                onValueChange={(value) => setForm((prev) => ({ ...prev, distance: value }))}
                disabled={!form.eventId || availableDistances.length === 0}
              >
                <SelectTrigger id="distance-select">
                  <SelectValue placeholder={!form.eventId ? 'Select event first' : 'Select distance'} />
                </SelectTrigger>
                <SelectContent>
                  {availableDistances.map((dist) => (
                    <SelectItem key={dist} value={dist}>
                      {dist}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method Toggle */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Method</Label>
              <div className="flex gap-2">
                {(Object.keys(paymentMethodConfig) as PaymentMethod[]).map((method) => {
                  const config = paymentMethodConfig[method]
                  const isSelected = form.paymentMethod === method
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, paymentMethod: method }))}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                        isSelected
                          ? `${config.color} border-transparent shadow-md`
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {config.icon}
                      {config.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Amount Paid */}
            <div className="space-y-2">
              <Label htmlFor="amount-paid" className="text-sm font-medium">
                Amount Paid (₱) {calculatedTotal > 0 && <span className="text-gray-400 font-normal">Suggested: ₱{calculatedTotal.toLocaleString()}</span>}
              </Label>
              <Input
                id="amount-paid"
                type="number"
                min="0"
                step="1"
                placeholder={calculatedTotal > 0 ? String(calculatedTotal) : "0"}
                value={form.amountPaid}
                onChange={(e) => setForm((prev) => ({ ...prev, amountPaid: e.target.value }))}
              />
            </div>
          </div>

          {/* Add-ons / Package Section */}
          {selectedEvent && (
            <div className="mt-4 border rounded-lg p-4 bg-orange-50/50 space-y-4">
              <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">
                {selectedEvent.isPackage ? 'Package Details' : 'Optional Add-ons'}
              </h3>

              {/* Show distance price */}
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">
                  {selectedEvent.isPackage ? 'Complete Package' : 'Registration Fee'} ({form.distance})
                </span>
                <span className="text-sm font-semibold text-gray-900">₱{calculatedTotal.toLocaleString()}</span>
              </div>

              {selectedEvent.isPackage ? (
                // Package: show sizes without checkboxes
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {finisherSizes.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm">Finisher Shirt Size</Label>
                      <Select value={form.finisherShirtSize} onValueChange={(v) => setForm(prev => ({ ...prev, finisherShirtSize: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                        <SelectContent>
                          {finisherSizes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {singletSizesList.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm">Race Singlet Size</Label>
                      <Select value={form.singletSize} onValueChange={(v) => setForm(prev => ({ ...prev, singletSize: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                        <SelectContent>
                          {singletSizesList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ) : (
                // Standard: show add-ons with checkboxes + prices
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(selectedEvent.finisherShirtPrice ?? 0) > 0 && (
                    <div className="border rounded-lg p-3 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="onsite-finisher-shirt"
                            checked={form.availFinisherShirt}
                            onCheckedChange={(checked) => {
                              setForm(prev => ({ ...prev, availFinisherShirt: !!checked, finisherShirtSize: '' }))
                            }}
                          />
                          <label htmlFor="onsite-finisher-shirt" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Avail Finisher Shirt
                          </label>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">+₱{selectedEvent.finisherShirtPrice?.toLocaleString()}</span>
                      </div>
                      {form.availFinisherShirt && finisherSizes.length > 0 && (
                        <Select value={form.finisherShirtSize} onValueChange={(v) => setForm(prev => ({ ...prev, finisherShirtSize: v }))}>
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

                  {(selectedEvent.singletPrice ?? 0) > 0 && (
                    <div className="border rounded-lg p-3 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="onsite-singlet"
                            checked={form.availSinglet}
                            onCheckedChange={(checked) => {
                              setForm(prev => ({ ...prev, availSinglet: !!checked, singletSize: '' }))
                            }}
                          />
                          <label htmlFor="onsite-singlet" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Avail Singlet
                          </label>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">+₱{selectedEvent.singletPrice?.toLocaleString()}</span>
                      </div>
                      {form.availSinglet && singletSizesList.length > 0 && (
                        <Select value={form.singletSize} onValueChange={(v) => setForm(prev => ({ ...prev, singletSize: v }))}>
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
                </div>
              )}

              {calculatedTotal > 0 && (
                <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border">
                  <span className="text-sm font-semibold text-gray-700">Calculated Total</span>
                  <span className="text-lg font-bold text-orange-600">₱{calculatedTotal.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Selected Event Info */}
          {selectedEvent && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Badge className="bg-orange-500 text-white text-[10px]">Selected Event</Badge>
                <span className="font-medium text-gray-900">{selectedEvent.title}</span>
                <span className="text-gray-400">—</span>
                <span className="text-gray-500">{selectedEvent.date}</span>
                <span className="text-gray-400">—</span>
                <span className="text-gray-500">{selectedEvent.distances}</span>
              </div>
            </div>
          )}

          {/* Register Button */}
          <div className="mt-6 flex items-center gap-3">
            <Button
              onClick={handleRegister}
              disabled={submitting}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-orange-500/25 px-8"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register Participant
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setForm(emptyForm)}
              className="text-gray-600"
            >
              Clear Form
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section - Recent On-site Registrations */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Recent On-site Registrations</CardTitle>
                <CardDescription>
                  {registrations.length} total registration{registrations.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleGenerateReport} variant="outline" size="sm" className="font-semibold">
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by participant name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Finisher Shirt</TableHead>
                  <TableHead>Singlet</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Staff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading registrations...
                    </TableCell>
                  </TableRow>
                ) : filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                      {searchQuery ? 'No registrations match your search.' : 'No on-site registrations yet.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <TableRow key={reg.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{reg.participantName}</div>
                          {reg.participantEmail && (
                            <div className="text-xs text-gray-500">{reg.participantEmail}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{reg.event?.title || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{reg.event?.date || ''}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-orange-500 text-white text-xs">{reg.distance}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {reg.finisherShirtSize ? (
                          <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50 text-xs">Size: {reg.finisherShirtSize}</Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {reg.singletSize ? (
                          <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 text-xs">Size: {reg.singletSize}</Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${
                            reg.paymentMethod === 'cash'
                              ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                              : reg.paymentMethod === 'gcash'
                              ? 'border-blue-300 text-blue-700 bg-blue-50'
                              : 'border-violet-300 text-violet-700 bg-violet-50'
                          }`}
                        >
                          {reg.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        ₱{reg.amountPaid?.toLocaleString() || '0'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(reg.createdAt).toLocaleDateString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        <div className="text-xs text-gray-400">
                          {new Date(reg.createdAt).toLocaleTimeString('en-PH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {reg.staffName || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <DialogTitle className="text-xl">Registration Successful!</DialogTitle>
              <DialogDescription className="mt-1">
                The participant has been registered on-site.
              </DialogDescription>
            </div>
          </DialogHeader>

          {lastRegistration && (
            <div className="mt-4 border rounded-xl p-5 bg-gray-50 space-y-3">
              {/* DAPA RUN Header */}
              <div className="text-center pb-3 border-b">
                <div className="text-xl font-extrabold text-orange-500 tracking-wide">DAPA RUN</div>
                <div className="text-[10px] uppercase tracking-[3px] text-gray-400 mt-0.5">On-site Registration</div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Event</span>
                  <span className="text-sm font-semibold text-gray-900 text-right">{lastRegistration.event?.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Participant</span>
                  <span className="text-sm font-semibold text-gray-900">{lastRegistration.participantName}</span>
                </div>
                {lastRegistration.participantEmail && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Email</span>
                    <span className="text-sm font-medium text-gray-700">{lastRegistration.participantEmail}</span>
                  </div>
                )}
                {lastRegistration.participantPhone && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Phone</span>
                    <span className="text-sm font-medium text-gray-700">{lastRegistration.participantPhone}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Distance</span>
                  <Badge className="bg-orange-500 text-white">{lastRegistration.distance}</Badge>
                </div>
                {lastRegistration.finisherShirtSize && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Finisher Shirt</span>
                    <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">Size: {lastRegistration.finisherShirtSize}</Badge>
                  </div>
                )}
                {lastRegistration.singletSize && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Singlet</span>
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50">Size: {lastRegistration.singletSize}</Badge>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Payment Method</span>
                  <Badge
                    variant="outline"
                    className={`capitalize ${
                      lastRegistration.paymentMethod === 'cash'
                        ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                        : lastRegistration.paymentMethod === 'gcash'
                        ? 'border-blue-300 text-blue-700 bg-blue-50'
                        : 'border-violet-300 text-violet-700 bg-violet-50'
                    }`}
                  >
                    {lastRegistration.paymentMethod}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Amount Paid</span>
                  <span className="text-sm font-bold text-gray-900">₱{lastRegistration.amountPaid?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Date/Time</span>
                  <span className="text-sm font-medium text-gray-700">
                    {new Date(lastRegistration.createdAt).toLocaleString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {lastRegistration.staffName && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Registered By</span>
                    <span className="text-sm font-medium text-gray-700">{lastRegistration.staffName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={handlePrintSlip}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Confirmation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

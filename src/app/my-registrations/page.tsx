'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Download,
  ClipboardList,
  Loader2,
  Calendar,
  MapPin,
  CreditCard,
  Package,
  AlertCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Registration {
  id: string
  eventId: string
  distance: string
  finisherShirtSize: string | null
  singletSize: string | null
  totalAmount: number
  paymentStatus: string
  paymentMethod: string | null
  paymentReference: string | null
  paidAt: string | null
  createdAt: string
  event: {
    title: string
    date: string
    location: string
    image: string
  }
}

export default function MyRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRegistrations() {
      try {
        const res = await fetch('/api/user/registrations')
        if (res.ok) {
          const data = await res.json()
          setRegistrations(data.registrations || [])
        }
      } catch {
        // use empty
      } finally {
        setLoading(false)
      }
    }
    fetchRegistrations()
  }, [])

  const handleDownloadReceipt = (registrationId: string) => {
    window.open(`/receipt?id=${registrationId}`, '_blank')
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
      refunded: 'bg-gray-100 text-gray-700 border-gray-200',
    }
    return styles[status] || 'bg-gray-100 text-gray-700'
  }

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return 'N/A'
    const labels: Record<string, string> = {
      gcash: 'GCash',
      maya: 'Maya',
      grabpay: 'GrabPay',
      cash: 'Cash',
    }
    return labels[method] || method.toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href="/" className="text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl font-bold text-gray-900">My Registrations</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {registrations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center"
          >
            <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Registrations Yet</h3>
            <p className="text-gray-500 mb-6">
              You haven&apos;t registered for any events yet. Browse upcoming events to get started!
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold"
            >
              Browse Events
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {registrations.map((reg, index) => (
              <motion.div
                key={reg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Event Image */}
                  <div className="sm:w-48 h-32 sm:h-auto shrink-0">
                    <img
                      src={reg.event.image}
                      alt={reg.event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Registration Details */}
                  <div className="flex-1 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-2">
                        <h3 className="font-bold text-gray-900 text-lg">{reg.event.title}</h3>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(reg.event.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {reg.event.location}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge className="bg-orange-500 text-white">{reg.distance}</Badge>
                          {reg.finisherShirtSize && (
                            <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">
                              Finisher: {reg.finisherShirtSize}
                            </Badge>
                          )}
                          {reg.singletSize && (
                            <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50">
                              Singlet: {reg.singletSize}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-gray-900">
                          ₱{reg.totalAmount.toLocaleString()}
                        </p>
                        <Badge className={getPaymentStatusBadge(reg.paymentStatus)} variant="outline">
                          {reg.paymentStatus}
                        </Badge>
                      </div>
                    </div>

                    {/* Footer with payment info and actions */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          {getPaymentMethodLabel(reg.paymentMethod)}
                        </span>
                        {reg.paidAt && (
                          <span className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            Paid {new Date(reg.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {reg.paymentStatus === 'paid' && (
                        <Button
                          onClick={() => handleDownloadReceipt(reg.id)}
                          size="sm"
                          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-md"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download Receipt
                        </Button>
                      )}

                      {reg.paymentStatus === 'pending' && (
                        <div className="flex items-center gap-1 text-amber-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          Payment pending verification
                        </div>
                      )}

                      {reg.paymentStatus === 'failed' && (
                        <div className="flex items-center gap-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          Payment failed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

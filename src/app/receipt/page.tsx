'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Download, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

function ReceiptContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [registrationInfo, setRegistrationInfo] = useState<{
    eventName: string
    distance: string
    totalAmount: number
  } | null>(null)

  useEffect(() => {
    async function fetchReceipt() {
      if (!id) {
        setError('No registration ID provided')
        setLoading(false)
        return
      }

      try {
        // Fetch registration details
        const detailRes = await fetch(`/api/payment/status?ref=${id}&type=registration`)
        if (detailRes.ok) {
          const detailData = await detailRes.json()
          if (detailData.paymentStatus !== 'paid') {
            setError('Payment has not been confirmed yet. Receipt will be available after payment is verified.')
            setLoading(false)
            return
          }
          setRegistrationInfo({
            eventName: detailData.eventName || 'Event',
            distance: detailData.distance || '',
            totalAmount: detailData.totalAmount || 0,
          })
        }

        // Build receipt download URL
        const url = `/api/receipt?id=${encodeURIComponent(id)}`
        setReceiptUrl(url)
      } catch {
        setError('Failed to load receipt')
      } finally {
        setLoading(false)
      }
    }

    fetchReceipt()
  }, [id])

  const handleDownload = () => {
    if (!receiptUrl) return
    const link = document.createElement('a')
    link.href = receiptUrl
    link.download = `DAPA-RUN-Receipt-${id?.substring(0, 8).toUpperCase() || 'UNKNOWN'}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading receipt...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Receipt Unavailable</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold"
          >
            Return to Home
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <h1 className="text-xl font-bold text-gray-900">Official Receipt</h1>
          </div>
          <Button
            onClick={handleDownload}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Download JPG
          </Button>
        </div>
      </div>

      {/* Receipt preview */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Receipt image */}
          {receiptUrl && (
            <div className="p-4 flex justify-center bg-gray-50">
              <img
                src={receiptUrl}
                alt="Official Receipt"
                className="max-w-full h-auto rounded-lg shadow-md"
              />
            </div>
          )}

          {/* Action section */}
          <div className="p-6 border-t bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm text-gray-500">
                  Present this receipt to the staff/organizer to claim your race kit on event day.
                </p>
                {id && (
                  <p className="text-xs text-gray-400 mt-1">
                    Registration ID: {id.substring(0, 8).toUpperCase()}
                  </p>
                )}
              </div>
              <Button
                onClick={handleDownload}
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg w-full sm:w-auto"
              >
                <Download className="w-5 h-5 mr-2" />
                Download as JPG
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function ReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <ReceiptContent />
    </Suspense>
  )
}

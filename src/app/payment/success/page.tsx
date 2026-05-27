'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowRight, Loader2, ShoppingBag, Download, Receipt, ClipboardList } from 'lucide-react'
import { motion } from 'framer-motion'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')
  const type = searchParams.get('type') || 'registration'
  const [checking, setChecking] = useState(true)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [paymentFailed, setPaymentFailed] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [orderInfo, setOrderInfo] = useState<{
    orderNumber?: string
    totalAmount?: number
    paymentMethod?: string
  }>({})

  const checkPayment = useCallback(async () => {
    if (!ref) {
      setChecking(false)
      return
    }
    try {
      const res = await fetch(`/api/payment/status?ref=${ref}&type=${type}`)
      if (res.ok) {
        const data = await res.json()
        if (data.paymentStatus === 'paid') {
          setPaymentConfirmed(true)
          setChecking(false)
          return
        }
        if (data.paymentStatus === 'failed') {
          setPaymentFailed(true)
          setChecking(false)
          return
        }
        if (type === 'merch') {
          setOrderInfo({
            orderNumber: data.orderNumber,
            totalAmount: data.totalAmount,
            paymentMethod: data.paymentMethod,
          })
        }
      }
    } catch {
      // Continue retrying
    }

    // If still pending after check, retry up to 5 times with delays
    // The status API now has PayMongo fallback verification built in
    setRetryCount(prev => {
      const next = prev + 1
      if (next < 5) {
        // Will trigger another check via useEffect
        return next
      }
      // Max retries reached, stop checking
      setChecking(false)
      return next
    })
  }, [ref, type])

  useEffect(() => {
    if (!ref) {
      setChecking(false)
      return
    }

    // Initial check immediately
    checkPayment()
  }, [ref]) // eslint-disable-line react-hooks/exhaustive-deps

  // Retry with delays
  useEffect(() => {
    if (retryCount > 0 && retryCount < 5 && checking) {
      const delay = retryCount * 3000 // 3s, 6s, 9s, 12s
      const timer = setTimeout(() => {
        checkPayment()
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [retryCount, checking, checkPayment])

  const isMerch = type === 'merch'

  const handleDownloadReceipt = async () => {
    if (!ref) return
    try {
      const res = await fetch(`/api/receipt?id=${ref}`)
      if (!res.ok) {
        alert('Unable to download receipt. Please make sure payment is confirmed.')
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `DAPA-RUN-Receipt-${ref.substring(0, 8).toUpperCase()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Failed to download receipt. Please try again.')
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isMerch ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-gradient-to-br from-green-50 to-emerald-50'}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {checking ? (
          <div className="py-8">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Verifying payment...</p>
            <p className="text-sm text-gray-400 mt-2">Checking with payment provider</p>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              {paymentFailed ? (
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-4xl">✕</span>
                </div>
              ) : (
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              )}
            </motion.div>

            {paymentFailed ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Failed
                </h1>
                <p className="text-gray-500 mb-4">
                  Your payment could not be processed. Please try again.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Successful!
                </h1>

                {isMerch ? (
                  <>
                    <p className="text-gray-500 mb-2">
                      Your order has been confirmed.
                    </p>
                    {orderInfo.orderNumber && (
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Order: {orderInfo.orderNumber}
                      </p>
                    )}
                    {orderInfo.totalAmount && (
                      <p className="text-sm font-semibold text-orange-600 mb-2">
                        Total: ₱{orderInfo.totalAmount.toLocaleString()}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 mb-2">
                      Your registration has been confirmed.
                    </p>
                  </>
                )}

                {paymentConfirmed && (
                  <p className="text-sm text-green-600 font-medium mb-4">
                    Payment verified and confirmed
                  </p>
                )}
                {!paymentConfirmed && ref && (
                  <p className="text-sm text-amber-600 mb-4">
                    Payment is being processed. You will receive a confirmation shortly.
                  </p>
                )}
              </>
            )}

            {ref && (
              <p className="text-xs text-gray-400 mb-6">
                Reference: {ref}
              </p>
            )}

            {/* Receipt download for registration payments */}
            {!isMerch && paymentConfirmed && ref && (
              <div className="mb-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 mb-2 justify-center">
                  <Receipt className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-orange-800">Download Your Receipt</span>
                </div>
                <p className="text-xs text-orange-600 mb-3">
                  Present this receipt to the staff/organizer to claim your race kit
                </p>
                <Button
                  onClick={handleDownloadReceipt}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt (JPG)
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {!isMerch && (
                <Button
                  onClick={() => window.location.href = '/my-registrations'}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg"
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  View My Registrations
                </Button>
              )}
              <Button
                onClick={() => window.location.href = '/'}
                variant={isMerch ? 'default' : 'outline'}
                className={isMerch ? 'w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg' : 'w-full font-semibold'}
              >
                Return to Home
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              {isMerch && (
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="w-full font-semibold"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Button>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  )
}

'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowRight, RotateCcw, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

function PaymentFailedContent() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        >
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Failed
        </h1>
        <p className="text-gray-500 mb-2">
          Your payment could not be processed. Please try again or choose a different payment method.
        </p>

        {ref && (
          <p className="text-xs text-gray-400 mb-6">
            Reference: {ref}
          </p>
        )}

        <div className="space-y-3">
          <Button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg"
          >
            Try Again
            <RotateCcw className="w-4 h-4 ml-2" />
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full font-semibold"
          >
            Return to Home
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  )
}

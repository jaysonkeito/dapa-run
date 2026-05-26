'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  CreditCard,
  Loader2,
  Banknote,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

type PaymentMethod = 'gcash' | 'maya' | 'grabpay' | null
type CheckoutStep = 'cart' | 'payment'

const PAYMENT_METHOD_CONFIG = {
  gcash: {
    label: 'GCash',
    color: 'text-blue-600',
    selectedBg: 'bg-blue-50',
    selectedBorder: 'border-blue-500',
    description: 'Pay with GCash e-wallet',
  },
  maya: {
    label: 'Maya',
    color: 'text-purple-600',
    selectedBg: 'bg-purple-50',
    selectedBorder: 'border-purple-500',
    description: 'Pay with Maya e-wallet',
  },
  grabpay: {
    label: 'GrabPay',
    color: 'text-green-600',
    selectedBg: 'bg-green-50',
    selectedBorder: 'border-green-500',
    description: 'Pay with GrabPay',
  },
} as const

function PaymentMethodIcon({ method, className }: { method: keyof typeof PAYMENT_METHOD_CONFIG, className?: string }) {
  switch (method) {
    case 'gcash':
      return (
        <div className={`flex items-center justify-center ${className || 'w-10 h-10'}`}>
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-black text-xs tracking-tight shadow-sm">
            GC
          </div>
        </div>
      )
    case 'maya':
      return (
        <div className={`flex items-center justify-center ${className || 'w-10 h-10'}`}>
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-black text-xs tracking-tight shadow-sm">
            MY
          </div>
        </div>
      )
    case 'grabpay':
      return (
        <div className={`flex items-center justify-center ${className || 'w-10 h-10'}`}>
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-black text-xs tracking-tight shadow-sm">
            GP
          </div>
        </div>
      )
  }
}

export default function CartPage() {
  const { data: session } = useSession()
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal, setCurrentPage, setAuthModalOpen, setAuthModalTab } = useStore()
  const { toast } = useToast()
  const total = cartTotal()

  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(null)
  const [loading, setLoading] = useState(false)

  const handleProceedToPayment = () => {
    if (!session?.user) {
      setAuthModalTab('login')
      setAuthModalOpen(true)
      toast({
        title: 'Login Required',
        description: 'Please login or create an account to proceed to checkout.',
      })
      return
    }

    if (cart.length === 0) {
      toast({
        title: 'Cart Empty',
        description: 'Add items to your cart before checkout.',
        variant: 'destructive',
      })
      return
    }

    if (total < 100) {
      toast({
        title: 'Minimum Order',
        description: 'Minimum order amount for online payment is ₱100.',
        variant: 'destructive',
      })
      return
    }

    setCheckoutStep('payment')
  }

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      toast({
        title: 'Select Payment Method',
        description: 'Please choose a payment method to continue.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/merch-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size || null,
          })),
          totalAmount: total,
          paymentMethod: selectedPaymentMethod,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: 'Checkout Failed',
          description: data.error || 'Something went wrong.',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      // Redirect to PayMongo checkout page
      window.location.href = data.checkoutUrl
    } catch {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-gray-900 to-gray-800 py-16 sm:py-20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4"
          >
            {checkoutStep === 'cart' ? 'Shopping Cart' : 'Checkout'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-300 text-lg"
          >
            {checkoutStep === 'cart'
              ? (cart.length > 0 ? `${cart.length} item${cart.length > 1 ? 's' : ''} in your cart` : 'Your cart is empty')
              : 'Choose your payment method'}
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 sm:py-12 bg-gray-50 min-h-[50vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {cart.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-8">Looks like you haven&apos;t added any items yet. Browse our merchandise to find gear you&apos;ll love!</p>
              <Button
                onClick={() => setCurrentPage('merchandise')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Shop Merchandise
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Step Indicator */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  checkoutStep === 'cart'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-orange-100 text-orange-600'
                }`}>
                  <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px]">1</span>
                  Cart
                </div>
                <div className="w-6 h-0.5 bg-gray-200" />
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  checkoutStep === 'payment'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px]">2</span>
                  Payment
                </div>
              </div>

              {checkoutStep === 'cart' && (
                <>
                  {/* Cart Items */}
                  <div className="space-y-4">
                    <AnimatePresence>
                      {cart.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card className="overflow-hidden border-0 shadow-md">
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex gap-4">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h3 className="font-bold text-gray-900 text-sm sm:text-base">{item.name}</h3>
                                      <p className="text-xs text-gray-400 capitalize">{item.category}</p>
                                      {item.size && (
                                        <p className="text-xs text-orange-500 font-medium">Size: {item.size}</p>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => removeFromCart(item.id)}
                                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="w-8 text-center font-semibold text-gray-900">{item.quantity}</span>
                                      <button
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="font-bold text-orange-600">
                                      ₱{(item.price * item.quantity).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Order Summary */}
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                          <span className="text-gray-900 font-semibold">₱{total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Shipping</span>
                          <span className="text-green-600 font-semibold">Free</span>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between">
                            <span className="text-gray-900 font-bold text-lg">Total</span>
                            <span className="text-orange-600 font-black text-lg">₱{total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 space-y-3">
                        <Button
                          onClick={handleProceedToPayment}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-200 py-6 text-base"
                        >
                          <CreditCard className="w-5 h-5 mr-2" />
                          Proceed to Checkout
                        </Button>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentPage('merchandise')}
                            className="flex-1 font-semibold"
                          >
                            Continue Shopping
                          </Button>
                          <Button
                            variant="outline"
                            onClick={clearCart}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 font-semibold"
                          >
                            Clear Cart
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {checkoutStep === 'payment' && (
                <>
                  {/* Order Review (compact) */}
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Order Review</h3>
                        <button
                          onClick={() => setCheckoutStep('cart')}
                          className="text-sm text-orange-500 hover:text-orange-600 font-semibold"
                        >
                          Edit Cart
                        </button>
                      </div>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                              <p className="text-xs text-gray-500">
                                {item.size ? `Size: ${item.size}` : item.category}
                                {' · '}Qty: {item.quantity}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 shrink-0">
                              ₱{(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t mt-4 pt-4">
                        <div className="flex justify-between">
                          <span className="text-gray-900 font-bold text-lg">Total</span>
                          <span className="text-orange-600 font-black text-lg">₱{total.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Method Selection */}
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Payment Method</h3>
                      <p className="text-sm text-gray-500 mb-4">Choose your preferred e-wallet</p>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {(['gcash', 'maya', 'grabpay'] as const).map((method) => {
                          const config = PAYMENT_METHOD_CONFIG[method]
                          const isSelected = selectedPaymentMethod === method
                          return (
                            <button
                              key={method}
                              onClick={() => setSelectedPaymentMethod(method)}
                              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                                isSelected
                                  ? `${config.selectedBorder} ${config.selectedBg} shadow-sm`
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <PaymentMethodIcon method={method} className="w-12 h-12" />
                              <span className={`text-sm font-bold ${isSelected ? config.color : 'text-gray-600'}`}>
                                {config.label}
                              </span>
                              {isSelected && (
                                <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {/* Payment Info */}
                      {selectedPaymentMethod && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4"
                        >
                          <p className="text-xs text-blue-700">
                            <span className="font-semibold">Note:</span> You will be redirected to {PAYMENT_METHOD_CONFIG[selectedPaymentMethod].label}&apos;s payment page to complete your transaction securely.
                          </p>
                        </motion.div>
                      )}

                      {/* Security Badge */}
                      <div className="flex items-center gap-2 text-gray-400 mb-4">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-xs">Payments are processed securely via PayMongo</span>
                      </div>

                      {/* Live Payment Notice */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-xs text-blue-700">
                          <span className="font-semibold">Secure Payment:</span> You will be charged the exact amount shown. Please ensure your e-wallet has sufficient balance before proceeding.
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Button
                          onClick={handlePayment}
                          disabled={loading || !selectedPaymentMethod}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-200 py-6 text-base"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : selectedPaymentMethod ? (
                            <>
                              Pay with {PAYMENT_METHOD_CONFIG[selectedPaymentMethod].label} — ₱{total.toLocaleString()}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          ) : (
                            <>
                              Select Payment Method
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => setCheckoutStep('cart')}
                          variant="outline"
                          className="w-full font-semibold"
                          disabled={loading}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

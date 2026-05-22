'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  Plus,
  Minus,
  X,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Loader2,
  Receipt,
  Printer,
  CheckCircle2,
  Package,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Types
interface MerchProduct {
  id: string
  name: string
  price: number
  image: string
  category: string
  description: string
  sizes: string | null
  badge: string | null
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  size: string
  image: string
  category: string
}

interface ReceiptData {
  orderNumber: string
  date: string
  time: string
  items: { name: string; size: string; price: number; quantity: number }[]
  total: number
  paymentMethod: string
  customerName: string
  staffName: string
}

const categoryColors: Record<string, string> = {
  shoes: 'bg-orange-500 text-white',
  apparel: 'bg-purple-500 text-white',
  accessories: 'bg-emerald-500 text-white',
}

const categoryLabels: Record<string, string> = {
  shoes: 'Shoes',
  apparel: 'Apparel',
  accessories: 'Accessories',
}

const categories = [
  { value: 'all', label: 'All' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'apparel', label: 'Apparel' },
  { value: 'accessories', label: 'Accessories' },
]

const paymentMethods = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'gcash', label: 'GCash', icon: Smartphone },
  { value: 'card', label: 'Card', icon: CreditCard },
] as const

function formatPrice(amount: number): string {
  return `₱${amount.toLocaleString()}`
}

export default function POSPage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  // Product state
  const [products, setProducts] = useState<MerchProduct[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('Walk-in Customer')
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')

  // Dialog state
  const [sizeDialogOpen, setSizeDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<MerchProduct | null>(null)
  const [selectedSize, setSelectedSize] = useState('')

  // Receipt state
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  // Loading state
  const [completingSale, setCompletingSale] = useState(false)

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/merchandise')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' })
    } finally {
      setProductsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Filtered products
  const filteredProducts = products.filter((product) => {
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Add to cart
  const handleAddProduct = (product: MerchProduct) => {
    if (product.sizes) {
      setSelectedProduct(product)
      setSelectedSize('')
      setSizeDialogOpen(true)
    } else {
      addToCart(product, '')
    }
  }

  const addToCart = (product: MerchProduct, size: string) => {
    const cartKey = `${product.id}-${size}`
    setCart((prev) => {
      const existing = prev.find((item) => `${item.id}-${item.size}` === cartKey)
      if (existing) {
        return prev.map((item) =>
          `${item.id}-${item.size}` === cartKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          size,
          image: product.image,
          category: product.category,
        },
      ]
    })
    toast({ title: 'Added', description: `${product.name}${size ? ` (${size})` : ''} added to cart` })
  }

  const confirmSizeSelection = () => {
    if (!selectedProduct || !selectedSize) return
    addToCart(selectedProduct, selectedSize)
    setSizeDialogOpen(false)
    setSelectedProduct(null)
    setSelectedSize('')
  }

  // Cart operations
  const updateQuantity = (id: string, size: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id && item.size === size
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (id: string, size: string) => {
    setCart((prev) => prev.filter((item) => !(item.id === id && item.size === size)))
  }

  const clearCart = () => {
    setCart([])
  }

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Complete sale
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast({ title: 'Empty Cart', description: 'Add items to cart before completing sale', variant: 'destructive' })
      return
    }

    setCompletingSale(true)
    try {
      const payload = {
        items: cart.map((item) => ({
          itemId: item.id,
          quantity: item.quantity,
          size: item.size || undefined,
        })),
        paymentMethod,
        customerName: customerName || 'Walk-in Customer',
        staffName: (session?.user as Record<string, unknown>)?.name as string || undefined,
      }

      const res = await fetch('/api/admin/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to complete sale')
      }

      const order = await res.json()

      // Build receipt data
      const now = new Date()
      setReceiptData({
        orderNumber: order.orderNumber,
        date: now.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }),
        time: now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
        items: cart.map((item) => ({
          name: item.name,
          size: item.size,
          price: item.price,
          quantity: item.quantity,
        })),
        total: subtotal,
        paymentMethod: paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1),
        customerName: customerName || 'Walk-in Customer',
        staffName: (session?.user as Record<string, unknown>)?.name as string || 'Staff',
      })

      setReceiptDialogOpen(true)
      clearCart()
      setCustomerName('Walk-in Customer')
      setPaymentMethod('cash')

      toast({ title: 'Sale Complete!', description: `Order ${order.orderNumber} created successfully` })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong'
      toast({ title: 'Sale Failed', description: message, variant: 'destructive' })
    } finally {
      setCompletingSale(false)
    }
  }

  // Print receipt
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
      {/* LEFT: Product Grid (60%) */}
      <div className="flex-1 lg:w-[60%] flex flex-col min-h-0">
        {/* Header with Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-gray-200"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                categoryFilter === cat.value
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.label}
              <span className="ml-1.5 text-xs opacity-75">
                ({cat.value === 'all' ? products.length : products.filter((p) => p.category === cat.value).length})
              </span>
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          {productsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Loading products...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No products found</p>
                <p className="text-gray-300 text-xs mt-1">Try adjusting your search or category filter</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="group overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all duration-200 cursor-pointer bg-white"
                >
                  <div className="relative">
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = '/merch-banner.png'
                        }}
                      />
                    </div>
                    {product.badge && (
                      <Badge className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] px-1.5 py-0.5">
                        {product.badge}
                      </Badge>
                    )}
                    <Badge
                      className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 ${
                        categoryColors[product.category] || 'bg-gray-500 text-white'
                      }`}
                    >
                      {categoryLabels[product.category] || product.category}
                    </Badge>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-gray-900 truncate">{product.name}</h3>
                    <p className="text-orange-600 font-bold text-lg mt-1">{formatPrice(product.price)}</p>
                    <Button
                      onClick={() => handleAddProduct(product)}
                      className="w-full mt-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-xs h-8"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Order Cart (40%) */}
      <div className="lg:w-[40%] flex flex-col min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Cart Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-600" />
            <h2 className="font-bold text-gray-900">Current Transaction</h2>
            {totalItems > 0 && (
              <Badge className="bg-orange-500 text-white text-[10px] px-1.5">{totalItems}</Badge>
            )}
          </div>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs h-7"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-full py-12">
              <div className="text-center">
                <ShoppingCart className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No items yet</p>
                <p className="text-gray-300 text-xs mt-1">Click &quot;Add&quot; on a product to start</p>
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {cart.map((item) => (
                <div
                  key={`${item.id}-${item.size}`}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = '/merch-banner.png'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        {item.size && (
                          <span className="text-[10px] text-gray-400 font-medium">Size: {item.size}</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="w-6 h-6 flex-shrink-0 text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.size, -1)}
                          className="w-6 h-6 rounded-md border-gray-200 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.size, 1)}
                          className="w-6 h-6 rounded-md border-gray-200 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{formatPrice(item.price)} each</p>
                        <p className="text-sm font-bold text-orange-600">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        <div className="border-t border-gray-100 bg-white p-4 space-y-3">
          {/* Subtotal */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
            <span className="text-xl font-bold text-gray-900">{formatPrice(subtotal)}</span>
          </div>

          <Separator />

          {/* Customer Name */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Customer Name</label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in Customer"
              className="h-8 text-sm border-gray-200"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                const isActive = paymentMethod === method.value
                return (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                      isActive
                        ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-gray-400'}`} />
                    {method.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Complete Sale Button */}
          <Button
            onClick={handleCompleteSale}
            disabled={cart.length === 0 || completingSale}
            className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-base shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {completingSale ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Complete Sale — {formatPrice(subtotal)}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Size Selector Dialog */}
      <Dialog open={sizeDialogOpen} onOpenChange={setSizeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Select Size — {selectedProduct?.name}</DialogTitle>
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-3">
              This item has multiple sizes. Please select one:
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedProduct?.sizes?.split(',').map((size) => {
                const trimmedSize = size.trim()
                const isActive = selectedSize === trimmedSize
                return (
                  <button
                    key={trimmedSize}
                    onClick={() => setSelectedSize(trimmedSize)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                      isActive
                        ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                    }`}
                  >
                    {trimmedSize}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={confirmSizeSelection}
                disabled={!selectedSize}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold flex-1"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add to Cart
              </Button>
              <Button variant="outline" onClick={() => setSizeDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">Sale Receipt</DialogTitle>
          <div className="mt-2">
            {/* Receipt Content */}
            <div id="receipt-print" className="bg-white p-6 rounded-lg max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center overflow-hidden">
                    <img src="/dapa-run-logo.png" alt="DAPA RUN" className="w-full h-full object-cover" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">DAPA RUN</h2>
                </div>
                <p className="text-xs text-gray-400">Official Receipt</p>
              </div>

              <Separator className="mb-4" />

              {/* Order Info */}
              <div className="space-y-1 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order #</span>
                  <span className="font-mono font-bold text-gray-900">{receiptData?.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-900">{receiptData?.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time</span>
                  <span className="text-gray-900">{receiptData?.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer</span>
                  <span className="text-gray-900">{receiptData?.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cashier</span>
                  <span className="text-gray-900">{receiptData?.staffName}</span>
                </div>
              </div>

              <Separator className="mb-4" />

              {/* Items Table */}
              <div className="mb-4">
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 text-xs font-medium text-gray-500 mb-2 pb-1 border-b">
                  <span>Item</span>
                  <span className="text-center w-8">Qty</span>
                  <span className="text-right w-16">Amount</span>
                </div>
                {receiptData?.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_auto_auto] gap-x-3 text-sm py-1.5 border-b border-gray-50">
                    <div className="min-w-0">
                      <p className="text-gray-900 truncate">{item.name}</p>
                      {item.size && <p className="text-[10px] text-gray-400">Size: {item.size}</p>}
                    </div>
                    <span className="text-gray-600 text-center w-8">{item.quantity}</span>
                    <span className="text-gray-900 font-medium text-right w-16">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <Separator className="mb-4" />

              {/* Total */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-bold text-gray-900">TOTAL</span>
                <span className="text-2xl font-bold text-orange-600">{formatPrice(receiptData?.total || 0)}</span>
              </div>

              <Separator className="mb-4" />

              {/* Payment Method */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">Payment Method</span>
                <div className="flex items-center gap-1.5">
                  {receiptData?.paymentMethod === 'Cash' && <Banknote className="w-4 h-4 text-gray-600" />}
                  {receiptData?.paymentMethod === 'GCash' && <Smartphone className="w-4 h-4 text-gray-600" />}
                  {receiptData?.paymentMethod === 'Card' && <CreditCard className="w-4 h-4 text-gray-600" />}
                  <span className="text-sm font-medium text-gray-900">{receiptData?.paymentMethod}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-6 pt-4 border-t border-dashed border-gray-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Receipt className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-semibold text-gray-600">Thank you for your purchase!</span>
                </div>
                <p className="text-[10px] text-gray-400">DAPA RUN — Run with Purpose</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="flex-1"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Receipt
              </Button>
              <Button
                onClick={() => setReceiptDialogOpen(false)}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  )
}

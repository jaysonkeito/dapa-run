'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useStore } from '@/store/useStore'
import { inventory as fallbackMerch, type MerchItem } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart,
  Filter,
  Eye,
  Loader2,
  Zap,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

interface DbMerchItem {
  id: string
  name: string
  price: number
  image: string
  category: string
  description: string
  sizes: string | null
  badge: string | null
  stock: number
  soldCount: number
}

export default function InventoryPage() {
  const { addToCart, setAuthModalOpen, setAuthModalTab, setPendingCartItem, setPendingBuyNow, buyNow } = useStore()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<DbMerchItem | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [items, setItems] = useState<DbMerchItem[]>(fallbackMerch.map(m => ({
    ...m,
    sizes: m.sizes?.join(',') || null,
    badge: m.badge || null,
    stock: 100,
    soldCount: 0,
  })))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMerch() {
      try {
        const res = await fetch('/api/inventory')
        if (res.ok) {
          const data = await res.json()
          if (data.length > 0) setItems(data)
        }
      } catch (error) {
        console.error('Failed to fetch inventory:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchMerch()
  }, [])

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'shoes', label: 'Running Shoes' },
    { value: 'apparel', label: 'Apparel' },
    { value: 'accessories', label: 'Accessories' },
  ]

  const filteredItems = items.filter(
    (item) => selectedCategory === 'all' || item.category === selectedCategory
  )

  const getSizes = (item: DbMerchItem): string[] => {
    if (!item.sizes) return []
    return item.sizes.split(',').filter(Boolean)
  }

  const handleAddToCart = (item: DbMerchItem, size?: string) => {
    if (!session?.user) {
      // Not logged in - set pending item and show login modal
      setPendingCartItem({
        id: size ? `${item.id}-${size}` : item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        size: size,
        category: item.category,
      })
      setPendingBuyNow(false)
      setAuthModalTab('login')
      setAuthModalOpen(true)
      return
    }

    addToCart({
      id: size ? `${item.id}-${size}` : item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      size: size,
      category: item.category,
    })
    toast({
      title: 'Added to Cart!',
      description: `${item.name}${size ? ` (${size})` : ''} has been added to your cart.`,
    })
    setSelectedProduct(null)
    setSelectedSize('')
  }

  const handleBuyNow = (item: DbMerchItem, size?: string) => {
    if (!session?.user) {
      // Not logged in - set pending item with buyNow flag and show login modal
      setPendingCartItem({
        id: size ? `${item.id}-${size}` : item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        size: size,
        category: item.category,
      })
      setPendingBuyNow(true)
      setAuthModalTab('login')
      setAuthModalOpen(true)
      return
    }

    buyNow({
      id: size ? `${item.id}-${size}` : item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      size: size,
      category: item.category,
    })
    toast({
      title: 'Buy Now!',
      description: `${item.name}${size ? ` (${size})` : ''} added. Redirecting to cart...`,
    })
    setSelectedProduct(null)
    setSelectedSize('')
  }

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-gray-900 to-gray-800 py-16 sm:py-20">
        <div className="absolute inset-0 opacity-30">
          <img src="/merch-banner.png" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4"
          >
            Merchandise
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-300 text-lg max-w-2xl mx-auto"
          >
            Gear up with premium running shoes, apparel, and accessories from DAPA RUN.
          </motion.p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="bg-white border-b sticky top-[120px] sm:top-[132px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 overflow-x-auto">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading inventory...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item, i) => {
                const sizes = getSizes(item)
                const isOutOfStock = item.stock === 0
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group h-full flex flex-col">
                      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {item.badge && (
                          <Badge className="absolute top-3 left-3 bg-orange-500 text-white font-bold text-xs">
                            {item.badge}
                          </Badge>
                        )}
                        {isOutOfStock && (
                          <Badge className="absolute top-3 right-3 bg-red-500 text-white font-bold text-xs">
                            Out of Stock
                          </Badge>
                        )}
                        <button
                          onClick={() => {
                            setSelectedProduct(item)
                            setSelectedSize(sizes[0] || '')
                          }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                        >
                          <Eye className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                      <CardContent className="p-5 flex flex-col flex-1">
                        <div className="flex-1">
                          <Badge variant="outline" className="text-xs mb-2 capitalize text-orange-500 border-orange-200">
                            {item.category}
                          </Badge>
                          <h3 className="font-bold text-gray-900 mb-1 group-hover:text-orange-500 transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-gray-500 text-sm line-clamp-2 mb-3">{item.description}</p>
                          {item.soldCount > 0 && (
                            <p className="text-xs text-gray-400 mb-2">{item.soldCount} sold</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-lg font-bold text-orange-600">
                            ₱{item.price.toLocaleString()}
                          </span>
                          {isOutOfStock ? (
                            <Badge className="bg-red-100 text-red-600 border-red-200">Out of Stock</Badge>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={() => {
                                  if (sizes.length > 0) {
                                    setSelectedProduct(item)
                                    setSelectedSize(sizes[0])
                                  } else {
                                    handleAddToCart(item)
                                  }
                                }}
                                size="sm"
                                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md"
                              >
                                <ShoppingCart className="w-4 h-4 mr-1" />
                                Add
                              </Button>
                              <Button
                                onClick={() => {
                                  if (sizes.length > 0) {
                                    setSelectedProduct(item)
                                    setSelectedSize(sizes[0])
                                  } else {
                                    handleBuyNow(item)
                                  }
                                }}
                                size="sm"
                                variant="outline"
                                className="border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold"
                              >
                                <Zap className="w-4 h-4 mr-1" />
                                Buy
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => { if (!open) setSelectedProduct(null) }}>
        <DialogContent className="max-w-lg">
          <DialogTitle className="sr-only">{selectedProduct?.name}</DialogTitle>
          {selectedProduct && (
            <div>
              <div className="h-64 rounded-lg overflow-hidden mb-4">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <Badge variant="outline" className="text-xs mb-2 capitalize text-orange-500 border-orange-200">
                    {selectedProduct.category}
                  </Badge>
                  {selectedProduct.badge && (
                    <Badge className="ml-2 bg-orange-500 text-white text-xs">{selectedProduct.badge}</Badge>
                  )}
                  <h2 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h2>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    ₱{selectedProduct.price.toLocaleString()}
                  </p>
                  {selectedProduct.soldCount > 0 && (
                    <p className="text-sm text-gray-400 mt-1">{selectedProduct.soldCount} sold</p>
                  )}
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{selectedProduct.description}</p>

                {getSizes(selectedProduct).length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Select Size</p>
                    <div className="flex flex-wrap gap-2">
                      {getSizes(selectedProduct).map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                            selectedSize === size
                              ? 'border-orange-500 bg-orange-50 text-orange-600'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProduct.stock === 0 ? (
                  <Badge className="w-full justify-center bg-red-100 text-red-600 py-3 text-base">Out of Stock</Badge>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAddToCart(selectedProduct, selectedSize)}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart
                    </Button>
                    <Button
                      onClick={() => handleBuyNow(selectedProduct, selectedSize)}
                      variant="outline"
                      className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50 font-bold"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Buy Now
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

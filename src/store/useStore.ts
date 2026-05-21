'use client'

import { create } from 'zustand'

export type Page = 'home' | 'upcoming' | 'previous' | 'results' | 'merchandise' | 'cart'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  size?: string
  category: string
}

interface StoreState {
  currentPage: Page
  setCurrentPage: (page: Page) => void
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  cartCount: () => number
  cartTotal: () => number
  selectedResultEvent: string | null
  setSelectedResultEvent: (eventId: string | null) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  contactModalOpen: boolean
  setContactModalOpen: (open: boolean) => void
  authModalOpen: boolean
  setAuthModalOpen: (open: boolean) => void
  authModalTab: 'login' | 'register'
  setAuthModalTab: (tab: 'login' | 'register') => void
}

export const useStore = create<StoreState>((set, get) => ({
  currentPage: 'home',
  setCurrentPage: (page) => set({ currentPage: page, mobileMenuOpen: false }),
  cart: [],
  addToCart: (item) => {
    const { cart } = get()
    const existing = cart.find((c) => c.id === item.id && c.size === item.size)
    if (existing) {
      set({
        cart: cart.map((c) =>
          c.id === item.id && c.size === item.size
            ? { ...c, quantity: c.quantity + 1 }
            : c
        ),
      })
    } else {
      set({ cart: [...cart, { ...item, quantity: 1 }] })
    }
  },
  removeFromCart: (id) => {
    set({ cart: get().cart.filter((c) => c.id !== id) })
  },
  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      set({ cart: get().cart.filter((c) => c.id !== id) })
    } else {
      set({
        cart: get().cart.map((c) => (c.id === id ? { ...c, quantity } : c)),
      })
    }
  },
  clearCart: () => set({ cart: [] }),
  cartCount: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),
  cartTotal: () =>
    get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  selectedResultEvent: null,
  setSelectedResultEvent: (eventId) => set({ selectedResultEvent: eventId }),
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  contactModalOpen: false,
  setContactModalOpen: (open) => set({ contactModalOpen: open }),
  authModalOpen: false,
  setAuthModalOpen: (open) => set({ authModalOpen: open }),
  authModalTab: 'login',
  setAuthModalTab: (tab) => set({ authModalTab: tab }),
}))

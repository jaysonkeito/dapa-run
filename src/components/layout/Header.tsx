'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useStore, type Page } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import {
  Menu,
  ShoppingCart,
  Phone,
  X,
  ChevronRight,
  LogOut,
  User,
  Shield,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const navItems: { label: string; page: Page }[] = [
  { label: 'Homepage', page: 'home' },
  { label: 'Upcoming Events', page: 'upcoming' },
  { label: 'Previous Events', page: 'previous' },
  { label: 'Race Results', page: 'results' },
  { label: 'Merchandise', page: 'merchandise' },
]

export default function Header() {
  const { data: session } = useSession()
  const { currentPage, setCurrentPage, cartCount, contactModalOpen, setContactModalOpen, mobileMenuOpen, setMobileMenuOpen, setAuthModalOpen, setAuthModalTab } = useStore()
  const count = cartCount()
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [siteSettings, setSiteSettings] = useState({ siteNameSuffix: 'Dumaguete', siteTitle: 'DAPA RUN - Dumaguete' })
  const [contactSettings, setContactSettings] = useState({ site_phone: '', site_email: '', site_address: '', site_maps_embed: '', site_facebook: '' })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setSiteSettings((prev) => ({
          ...prev,
          siteNameSuffix: data.site_name_suffix || data.siteNameSuffix || prev.siteNameSuffix,
          siteTitle: data.siteTitle || data.site_title || prev.siteTitle,
        }))
        setContactSettings((prev) => ({
          ...prev,
          site_phone: data.site_phone || prev.site_phone,
          site_email: data.site_email || prev.site_email,
          site_address: data.site_address || prev.site_address,
          site_maps_embed: data.site_maps_embed || data.siteMapsEmbed || prev.site_maps_embed,
          site_facebook: data.site_facebook || prev.site_facebook,
        }))
      })
      .catch(() => { /* use default */ })
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (page: Page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300',
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg'
            : 'bg-white shadow-sm'
        )}
      >
        {/* Top Header Bar - Logo left, CTA right */}
        <div className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              {/* Logo */}
              <button
                onClick={() => handleNavClick('home')}
                className="flex items-center gap-3 group"
              >
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:shadow-orange-200 transition-all duration-300 group-hover:scale-105 overflow-hidden">
                  <img src="/dapa-run-logo.png" alt="DAPA RUN" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-2xl font-black tracking-tight text-gray-900 group-hover:text-orange-600 transition-colors">
                    DAPA RUN
                  </span>
                  <span className="text-xs sm:text-[20px] font-light tracking-[0.15em] text-gray-400 -mt-1" style={{ letterSpacing: '0.15em' }}>
                    {siteSettings.siteNameSuffix}
                  </span>
                </div>
              </button>

              {/* Right side - Contact CTA + Cart (desktop) */}
              <div className="hidden md:flex items-center gap-4">
                {mounted && session?.user ? (
                  <div className="flex items-center gap-3">
                    {(session.user as Record<string, unknown>)?.role === 'admin' || (session.user as Record<string, unknown>)?.role === 'staff' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = '/admin/dashboard'}
                        className="border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold"
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        Dashboard
                      </Button>
                    ) : (session.user as Record<string, unknown>)?.role === 'developer' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = '/admin/dev-dashboard'}
                        className="border-teal-500 text-teal-600 hover:bg-teal-50 font-semibold"
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        Dev Panel
                      </Button>
                    ) : null}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-orange-600" />
                      </div>
                      <span className="font-medium text-gray-700">{session.user.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { signOut({ redirect: false }).then(() => { window.location.href = '/' }) }}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => { setAuthModalTab('login'); setAuthModalOpen(true) }}
                    variant="outline"
                    size="sm"
                    className="border-orange-500 text-orange-500 hover:bg-orange-50 font-semibold"
                  >
                    <User className="w-4 h-4 mr-1" />
                    Login
                  </Button>
                )}
                <Button
                  onClick={() => setContactModalOpen(true)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all duration-300 hover:scale-105"
                >
                  Contact Us
                </Button>
              </div>

              {/* Mobile - Cart + Menu */}
              <div className="flex items-center gap-2 md:hidden">
                {mounted && session?.user && (
                  <span className="text-xs font-medium text-gray-600 max-w-[80px] truncate">{session.user.name}</span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleNavClick('cart')}
                  className="relative"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                      {count}
                    </span>
                  )}
                </Button>
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 p-0">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <div className="flex flex-col h-full">
                      <div className="p-6 border-b bg-gradient-to-r from-orange-500 to-orange-600">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                            <img src="/dapa-run-logo.png" alt="DAPA RUN" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h2 className="text-white font-bold text-lg">DAPA RUN</h2>
                            <p className="text-white/70 text-xs sm:text-[20px] font-light tracking-[0.15em]">{siteSettings.siteNameSuffix}</p>
                          </div>
                        </div>
                      </div>
                      <nav className="flex-1 py-4">
                        {navItems.map((item) => (
                          <button
                            key={item.page}
                            onClick={() => handleNavClick(item.page)}
                            className={cn(
                              'w-full flex items-center justify-between px-6 py-4 text-left transition-all duration-200',
                              currentPage === item.page
                                ? 'bg-orange-50 text-orange-600 font-semibold border-r-4 border-orange-500'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-orange-500'
                            )}
                          >
                            <span>{item.label}</span>
                            <ChevronRight className={cn(
                              'w-4 h-4 transition-transform',
                              currentPage === item.page ? 'text-orange-500' : 'text-gray-400'
                            )} />
                          </button>
                        ))}
                      </nav>
                      <div className="p-6 border-t space-y-3">
                        <Button
                          onClick={() => { handleNavClick('cart'); setMobileMenuOpen(false) }}
                          variant="outline"
                          className="w-full border-orange-500 text-orange-500 hover:bg-orange-50 font-semibold relative"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Cart
                          {count > 0 && (
                            <span className="ml-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {count}
                            </span>
                          )}
                        </Button>
                        {mounted && session?.user ? (
                          <div className="space-y-2">
                            {(session.user as Record<string, unknown>)?.role === 'admin' || (session.user as Record<string, unknown>)?.role === 'staff' ? (
                              <Button
                                onClick={() => { window.location.href = '/admin/dashboard'; setMobileMenuOpen(false) }}
                                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Dashboard
                              </Button>
                            ) : (session.user as Record<string, unknown>)?.role === 'developer' ? (
                              <Button
                                onClick={() => { window.location.href = '/admin/dev-dashboard'; setMobileMenuOpen(false) }}
                                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Dev Panel
                              </Button>
                            ) : null}
                            <Button
                              onClick={() => { signOut({ redirect: false }).then(() => { window.location.href = '/' }); setMobileMenuOpen(false) }}
                              variant="outline"
                              className="w-full font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                            >
                              <LogOut className="w-4 h-4 mr-2" />
                              Logout ({session.user.name})
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => { setAuthModalTab('login'); setAuthModalOpen(true); setMobileMenuOpen(false) }}
                            variant="outline"
                            className="w-full border-orange-500 text-orange-500 hover:bg-orange-50 font-semibold"
                          >
                            <User className="w-4 h-4 mr-2" />
                            Login / Register
                          </Button>
                        )}
                        <Button
                          onClick={() => { setContactModalOpen(true); setMobileMenuOpen(false) }}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Contact Us
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Bar (Desktop) */}
        <nav className="hidden md:block border-b border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12">
              <div className="flex items-center gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => handleNavClick(item.page)}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 relative',
                      currentPage === item.page
                        ? 'text-orange-600 font-semibold'
                        : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50'
                    )}
                  >
                    {item.label}
                    {currentPage === item.page && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-orange-500 rounded-full"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavClick('cart')}
                className="relative text-gray-600 hover:text-orange-500"
              >
                <ShoppingCart className="w-5 h-5 mr-1" />
                <span className="text-sm">
                  {count > 0 ? `${count} item${count > 1 ? 's' : ''}` : 'Cart'}
                </span>
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {count}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Contact Modal */}
      <AnimatePresence>
        {contactModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setContactModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 relative">
                <button
                  onClick={() => setContactModalOpen(false)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl">Get In Touch</h3>
                    <p className="text-white/80 text-sm">We&apos;d love to hear from you</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {contactSettings.site_phone && (
                  <div className="bg-orange-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">Phone</p>
                    <p className="text-gray-900 font-semibold">{contactSettings.site_phone}</p>
                  </div>
                )}
                {contactSettings.site_email && (
                  <div className="bg-orange-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">Email</p>
                    <p className="text-gray-900 font-semibold">{contactSettings.site_email}</p>
                  </div>
                )}
                {contactSettings.site_address && (
                  <div className="bg-orange-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">Address</p>
                    <p className="text-gray-900 font-semibold">{contactSettings.site_address}</p>
                  </div>
                )}
                {contactSettings.site_maps_embed && (
                  <div className="bg-orange-50 rounded-xl p-4 overflow-hidden">
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">Location Map</p>
                    <iframe
                      src={contactSettings.site_maps_embed}
                      width="100%"
                      height="150"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="rounded-lg mt-2"
                    />
                  </div>
                )}
                {contactSettings.site_facebook && (
                  <div className="bg-orange-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">Social Media</p>
                    <div className="flex gap-3 mt-2">
                      <a href={contactSettings.site_facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold hover:bg-orange-600 transition-colors">FB</a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

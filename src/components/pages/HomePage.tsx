'use client'

import { useStore } from '@/store/useStore'
import { upcomingEvents as fallbackUpcoming, stats } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChevronRight,
  MapPin,
  Calendar,
  Trophy,
  Users,
  Route,
  Map,
  ArrowRight,
  Star,
  Clock,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import CountdownTimer from '@/components/CountdownTimer'

interface DbEvent {
  id: string
  title: string
  date: string
  time: string
  location: string
  priceRange: string
  image: string
  distances: string
  description: string
  status: string
  featured?: boolean
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          let start = 0
          const duration = 2000
          const step = (timestamp: number) => {
            if (!start) start = timestamp
            const progress = Math.min((timestamp - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) {
              requestAnimationFrame(step)
            }
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, hasAnimated])

  return (
    <div ref={ref}>
      <span className="text-3xl sm:text-4xl font-black text-white">
        {count.toLocaleString()}{suffix}
      </span>
    </div>
  )
}

const statIcons = [Trophy, Users, Route, Map]

export default function HomePage() {
  const { setCurrentPage } = useStore()
  const [upcomingEvents, setUpcomingEvents] = useState<DbEvent[]>(fallbackUpcoming.map(e => ({
    ...e,
    distances: e.distances.join(','),
  })))
  const [siteSettings, setSiteSettings] = useState({
    heroHeading: '',
    heroDescription: '',
    featuredHeading: 'Featured Event',
    featuredSubheading: "Don't miss our upcoming race",
    upcomingHeading: 'Upcoming Events',
    upcomingSubheading: 'Find your next race',
    merchHeading: 'Shop Merch',
    merchSubheading: 'Gear up for your next run',
    merchBannerHeading: 'New Collection Available',
    merchBannerDescription: 'Check out our latest running gear — from professional racing shoes to performance apparel and accessories.',
    ctaHeading: 'Ready to Run?',
    ctaDescription: "Join thousands of runners who have made DAPA RUN their go-to race organizer. Whether you're a beginner or a seasoned runner, we have an event for you.",
  })

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events?status=upcoming')
        if (res.ok) {
          const data = await res.json()
          if (data.length > 0) setUpcomingEvents(data)
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
      }
    }
    fetchEvents()
  }, [])

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setSiteSettings(prev => ({
          ...prev,
          heroHeading: data.site_hero_heading || data.heroHeading || '',
          heroDescription: data.site_hero_description || data.heroDescription || '',
          featuredHeading: data.site_featured_heading || data.siteFeaturedHeading || prev.featuredHeading,
          featuredSubheading: data.site_featured_subheading || data.siteFeaturedSubheading || prev.featuredSubheading,
          upcomingHeading: data.site_upcoming_heading || data.siteUpcomingHeading || prev.upcomingHeading,
          upcomingSubheading: data.site_upcoming_subheading || data.siteUpcomingSubheading || prev.upcomingSubheading,
          merchHeading: data.site_merch_heading || data.siteMerchHeading || prev.merchHeading,
          merchSubheading: data.site_merch_subheading || data.siteMerchSubheading || prev.merchSubheading,
          merchBannerHeading: data.site_merch_banner_heading || data.siteMerchBannerHeading || prev.merchBannerHeading,
          merchBannerDescription: data.site_merch_banner_description || data.siteMerchBannerDescription || prev.merchBannerDescription,
          ctaHeading: data.site_cta_heading || data.siteCtaHeading || prev.ctaHeading,
          ctaDescription: data.site_cta_description || data.siteCtaDescription || prev.ctaDescription,
        }))
      })
      .catch(() => {})
  }, [])

  const featuredEvent = upcomingEvents[0]

  // Split heading for gradient effect on last word
  const headingWords = siteSettings.heroHeading.split(' ')
  const lastWord = headingWords.pop() || ''
  const firstPart = headingWords.join(' ')

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <img
            src="/hero-banner.png"
            alt="DAPA RUN"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 mb-6 px-4 py-1.5 text-sm font-medium">
                🏃 Next Event: {featuredEvent?.date}
              </Badge>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight mb-6"
            >
              {firstPart}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">{lastWord}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-8 max-w-2xl"
            >
              {siteSettings.heroDescription}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Button
                onClick={() => setCurrentPage('upcoming')}
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105 text-base px-8"
              >
                Register Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => setCurrentPage('results')}
                variant="outline"
                size="lg"
                className="border-orange-400/60 text-orange-300 hover:bg-orange-500/20 hover:text-white hover:border-orange-400 font-semibold text-base px-8 transition-all duration-200"
              >
                View Race Results
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Event */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{siteSettings.featuredHeading}</h2>
              <p className="text-gray-500 mt-1">{siteSettings.featuredSubheading}</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => setCurrentPage('upcoming')}
              className="text-orange-500 hover:text-orange-600 font-semibold"
            >
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          {featuredEvent && (
            <Card className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="relative h-64 lg:h-auto">
                  <img
                    src={featuredEvent.image}
                    alt={featuredEvent.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-4 left-4 bg-orange-500 text-white font-bold">
                    Featured
                  </Badge>
                </div>
                <CardContent className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                    {featuredEvent.title}
                  </h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Calendar className="w-5 h-5 text-orange-500" />
                      <span>{featuredEvent.date} • {featuredEvent.time}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <MapPin className="w-5 h-5 text-orange-500" />
                      <span>{featuredEvent.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Route className="w-5 h-5 text-orange-500" />
                      <span>{featuredEvent.distances.split(',').join(' • ')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-900 font-semibold">
                      <Star className="w-5 h-5 text-orange-500" />
                      <span>{featuredEvent.priceRange}</span>
                    </div>
                  </div>
                  <p className="text-gray-500 leading-relaxed mb-6">
                    {featuredEvent.description}
                  </p>
                  <CountdownTimer targetDate={featuredEvent.date} />
                  <Button
                    onClick={() => setCurrentPage('upcoming')}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-200 w-fit"
                  >
                    Register Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => {
              const Icon = statIcons[i]
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  <p className="text-orange-100 text-sm mt-2 font-medium">{stat.label}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Upcoming Events Preview */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{siteSettings.upcomingHeading}</h2>
              <p className="text-gray-500 mt-1">{siteSettings.upcomingSubheading}</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => setCurrentPage('upcoming')}
              className="text-orange-500 hover:text-orange-600 font-semibold"
            >
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.slice(0, 3).map((event, i) => {
              const distances = event.distances.split(',').filter(Boolean)
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer"
                    onClick={() => setCurrentPage('upcoming')}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <Badge className="bg-orange-500 text-white font-semibold">
                          {distances[0]} – {distances[distances.length - 1]}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-bold text-gray-900 group-hover:text-orange-500 transition-colors mb-2">
                        {event.title}
                      </h3>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-orange-400" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="w-3.5 h-3.5 text-orange-400" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Clock className="w-3.5 h-3.5 text-orange-400" />
                          <span>{event.priceRange}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Merchandise Preview */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{siteSettings.merchHeading}</h2>
              <p className="text-gray-500 mt-1">{siteSettings.merchSubheading}</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => setCurrentPage('merchandise')}
              className="text-orange-500 hover:text-orange-600 font-semibold"
            >
              Shop All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 p-8 sm:p-12">
            <img
              src="/merch-banner.png"
              alt="Merchandise"
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
            <div className="relative">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                {siteSettings.merchBannerHeading}
              </h3>
              <p className="text-gray-300 mb-6 max-w-lg">
                {siteSettings.merchBannerDescription}
              </p>
              <Button
                onClick={() => setCurrentPage('merchandise')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-500/25"
              >
                Shop Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              {siteSettings.ctaHeading}
            </h2>
            <p className="text-gray-500 mb-8">
              {siteSettings.ctaDescription}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => setCurrentPage('upcoming')}
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-xl shadow-orange-200"
              >
                Browse Events
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => setCurrentPage('results')}
                variant="outline"
                size="lg"
                className="border-orange-500 text-orange-500 hover:bg-orange-50 font-semibold"
              >
                Check Results
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

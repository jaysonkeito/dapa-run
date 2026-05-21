'use client'

import { useStore } from '@/store/useStore'
import { upcomingEvents } from '@/lib/data'

export default function Footer() {
  const { setCurrentPage } = useStore()

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center overflow-hidden">
                <img src="/dapa-run-logo.png" alt="DAPA RUN" className="w-[85%] h-[85%] object-contain" />
              </div>
              <div>
                <h3 className="text-xl font-bold">DAPA RUN</h3>
                <p className="text-gray-400 text-xs tracking-widest uppercase">Run With Purpose</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Philippines&apos; premier running event organizer. We create unforgettable race experiences that inspire and challenge runners of all levels.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-orange-400 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: 'Upcoming Events', page: 'upcoming' as const },
                { label: 'Previous Events', page: 'previous' as const },
                { label: 'Race Results', page: 'results' as const },
                { label: 'Merchandise', page: 'merchandise' as const },
              ].map((link) => (
                <li key={link.page}>
                  <button
                    onClick={() => { setCurrentPage(link.page); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className="text-gray-400 hover:text-orange-400 text-sm transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Upcoming Event */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-orange-400 mb-4">Next Event</h4>
            {upcomingEvents[0] && (
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-white">{upcomingEvents[0].title}</p>
                <p className="text-xs text-gray-400 mt-1">{upcomingEvents[0].date}</p>
                <p className="text-xs text-gray-400">{upcomingEvents[0].location}</p>
                <button
                  onClick={() => { setCurrentPage('upcoming'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className="mt-3 text-orange-400 text-xs font-semibold hover:text-orange-300 transition-colors"
                >
                  Register Now →
                </button>
              </div>
            )}
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-orange-400 mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>0975 180 8990</li>
              <li>hello@daparun.com</li>
              <li>Banilad, Dumaguete City</li>
              <li>6200 Negros Oriental</li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="https://web.facebook.com/blackandblues.eshop" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-800 hover:bg-orange-500 flex items-center justify-center text-gray-400 hover:text-white text-xs font-bold cursor-pointer transition-all">
                FB
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 DAPA RUN. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <span className="hover:text-orange-400 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-orange-400 cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

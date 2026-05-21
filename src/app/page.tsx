'use client'

import { useStore } from '@/store/useStore'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import HomePage from '@/components/pages/HomePage'
import UpcomingEventsPage from '@/components/pages/UpcomingEventsPage'
import PreviousEventsPage from '@/components/pages/PreviousEventsPage'
import RaceResultsPage from '@/components/pages/RaceResultsPage'
import MerchandisePage from '@/components/pages/MerchandisePage'
import CartPage from '@/components/pages/CartPage'
import UserAuthModal from '@/components/auth/UserAuthModal'
import { motion, AnimatePresence } from 'framer-motion'

const pageComponents = {
  home: HomePage,
  upcoming: UpcomingEventsPage,
  previous: PreviousEventsPage,
  results: RaceResultsPage,
  merchandise: MerchandisePage,
  cart: CartPage,
}

export default function Home() {
  const { currentPage } = useStore()
  const PageComponent = pageComponents[currentPage]

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <PageComponent />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <UserAuthModal />
    </div>
  )
}

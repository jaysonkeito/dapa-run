'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'

const INACTIVITY_TIMEOUT = 15 * 60 * 1000 // 15 minutes
const WARNING_TIMEOUT = 14 * 60 * 1000 // 14 minutes (1 minute before logout)

export default function InactivityHandler() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const hasWarnedRef = useRef(false)

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timerRef.current) clearTimeout(timerRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)
    hasWarnedRef.current = false

    // Set warning timer (14 min)
    warningRef.current = setTimeout(() => {
      if (session?.user) {
        hasWarnedRef.current = true
        toast({
          title: 'Session Expiring Soon',
          description: 'You will be logged out in 1 minute due to inactivity. Move your mouse or press a key to stay logged in.',
          duration: 30000,
        })
      }
    }, WARNING_TIMEOUT)

    // Set logout timer (15 min)
    timerRef.current = setTimeout(() => {
      if (session?.user) {
        signOut({ redirect: false }).then(() => {
          toast({
            title: 'Session Expired',
            description: 'You have been logged out due to 15 minutes of inactivity.',
            duration: 5000,
          })
          window.location.href = '/'
        })
      }
    }, INACTIVITY_TIMEOUT)
  }, [session, toast])

  useEffect(() => {
    if (!session?.user) {
      // Not logged in, clear timers
      if (timerRef.current) clearTimeout(timerRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
      return
    }

    // Activity events to track
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']

    // Initial timer
    resetTimer()

    // Add event listeners
    const handleActivity = () => {
      resetTimer()
    }

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      // Cleanup
      if (timerRef.current) clearTimeout(timerRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [session, resetTimer])

  // This component doesn't render anything
  return null
}

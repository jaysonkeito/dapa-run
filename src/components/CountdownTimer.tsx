'use client'

import { useState, useEffect, useMemo } from 'react'

interface CountdownTimerProps {
  targetDate: string
  label?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function parseDateString(dateStr: string): Date | null {
  // Try standard parsing first
  const d = new Date(dateStr)
  if (!isNaN(d.getTime())) return d

  // Try parsing formats like "July 19, 2026"
  const parsed = Date.parse(dateStr)
  if (!isNaN(parsed)) return new Date(parsed)

  return null
}

function calculateTimeLeft(target: Date): { timeLeft: TimeLeft; ended: boolean } {
  const now = new Date()
  const difference = target.getTime() - now.getTime()

  if (difference <= 0) {
    return { timeLeft: { days: 0, hours: 0, minutes: 0, seconds: 0 }, ended: true }
  }

  return {
    timeLeft: {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    },
    ended: false,
  }
}

export default function CountdownTimer({ targetDate, label = 'Registration Closes In' }: CountdownTimerProps) {
  const target = useMemo(() => parseDateString(targetDate), [targetDate])
  const isInvalidDate = target === null

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => {
    if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return calculateTimeLeft(target).timeLeft
  })
  const [ended, setEnded] = useState(() => {
    if (!target) return true
    return calculateTimeLeft(target).ended
  })

  useEffect(() => {
    if (!target) return

    const tick = () => {
      const result = calculateTimeLeft(target)
      setTimeLeft(result.timeLeft)
      setEnded(result.ended)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [target])

  if (ended || isInvalidDate) {
    return (
      <div className="mt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</p>
        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-sm font-semibold">
          Event Ended
        </span>
      </div>
    )
  }

  const units = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hrs' },
    { value: timeLeft.minutes, label: 'Min' },
    { value: timeLeft.seconds, label: 'Sec' },
  ]

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</p>
      <div className="flex items-center gap-1.5">
        {units.map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-1.5">
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg px-2.5 py-1.5 min-w-[44px] text-center shadow-sm">
                <span className="text-base sm:text-lg font-bold font-mono">
                  {String(unit.value).padStart(2, '0')}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium mt-0.5">{unit.label}</span>
            </div>
            {i < units.length - 1 && (
              <span className="text-orange-400 font-bold text-lg -mt-4">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

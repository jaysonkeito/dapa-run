'use client'

import { useState, useEffect } from 'react'

interface TimePickerProps {
  value: string // Format: "HH:MM AM" or "HH:MM PM" or empty
  onChange: (value: string) => void
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  // Parse the value
  const parseValue = (val: string) => {
    if (!val) return { hour: '', minute: '', period: 'AM' }
    const parts = val.trim().split(/[:\s]+/)
    if (parts.length >= 3) {
      return { hour: parts[0], minute: parts[1], period: parts[2] }
    }
    // Fallback: try HH:MM 24h format
    if (val.includes(':')) {
      const [h, m] = val.split(':')
      const hourNum = parseInt(h)
      if (!isNaN(hourNum)) {
        const period = hourNum >= 12 ? 'PM' : 'AM'
        const hour12 = hourNum === 0 ? '12' : hourNum > 12 ? String(hourNum - 12) : String(hourNum)
        return { hour: hour12, minute: m || '', period }
      }
    }
    return { hour: '', minute: '', period: 'AM' }
  }

  const parsed = parseValue(value)
  const [hour, setHour] = useState(parsed.hour)
  const [minute, setMinute] = useState(parsed.minute)
  const [period, setPeriod] = useState(parsed.period)
  const [hourTouched, setHourTouched] = useState(!!parsed.hour)
  const [minuteTouched, setMinuteTouched] = useState(!!parsed.minute)

  // Sync with external value changes (e.g., edit mode)
  useEffect(() => {
    const p = parseValue(value)
    setHour(p.hour)
    setMinute(p.minute)
    setPeriod(p.period)
    setHourTouched(!!p.hour)
    setMinuteTouched(!!p.minute)
  }, [value])

  const handleChange = (newHour: string, newMinute: string, newPeriod: string) => {
    setHour(newHour)
    setMinute(newMinute)
    setPeriod(newPeriod)
    if (newHour && newMinute && newPeriod) {
      onChange(`${newHour}:${newMinute} ${newPeriod}`)
    } else if (!newHour && !newMinute) {
      onChange('')
    }
  }

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1))
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

  // Determine text color: gray when placeholder is showing, dark when value selected
  const hourColor = hour ? 'text-gray-900' : 'text-gray-400'
  const minuteColor = minute ? 'text-gray-900' : 'text-gray-400'

  return (
    <div className="flex items-center gap-1">
      <select
        value={hour}
        onChange={(e) => {
          setHourTouched(true)
          handleChange(e.target.value, minute, period)
        }}
        className={`w-[65px] h-9 rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${hourColor}`}
      >
        {/* Only show "HH" placeholder when no value has been selected yet */}
        {!hourTouched && <option value="" disabled>HH</option>}
        {hours.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-gray-400 font-bold">:</span>
      <select
        value={minute}
        onChange={(e) => {
          setMinuteTouched(true)
          handleChange(hour, e.target.value, period)
        }}
        className={`w-[65px] h-9 rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${minuteColor}`}
      >
        {/* Only show "MM" placeholder when no value has been selected yet */}
        {!minuteTouched && <option value="" disabled>MM</option>}
        {minutes.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select
        value={period}
        onChange={(e) => handleChange(hour, minute, e.target.value)}
        className="w-[65px] h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}

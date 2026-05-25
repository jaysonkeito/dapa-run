'use client'

import { useState, useMemo, useRef, useEffect, type ComponentProps } from 'react'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { DayButton as RDPDayButton } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EventDateInfo {
  date: string // Format: "YYYY-MM-DD"
  status: 'upcoming' | 'past'
  title?: string
}

interface DatePickerProps {
  value: string // Format: "YYYY-MM-DD" or empty
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  eventDates?: EventDateInfo[]
}

function EventDayButton({
  className,
  day,
  modifiers,
  eventDatesMap,
  showLegend,
  ...props
}: ComponentProps<typeof RDPDayButton> & {
  eventDatesMap: Map<string, EventDateInfo>
  showLegend?: boolean
}) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const dateKey = format(day.date, 'yyyy-MM-dd')
  const eventInfo = eventDatesMap.get(dateKey)
  const [showTooltip, setShowTooltip] = useState(false)

  // Check if today
  const today = new Date()
  const isToday = day.date.toDateString() === today.toDateString()

  return (
    <div className="relative">
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        data-day={day.date.toLocaleDateString()}
        data-selected-single={
          modifiers.selected &&
          !modifiers.range_start &&
          !modifiers.range_end &&
          !modifiers.range_middle
        }
        data-range-start={modifiers.range_start}
        data-range-end={modifiers.range_end}
        data-range-middle={modifiers.range_middle}
        className={cn(
          'flex aspect-square size-auto w-full min-w-[--cell-size] flex-col gap-1 leading-none font-medium group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] text-sm',
          'data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground',
          'data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground',
          'data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground',
          'data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground',
          'data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md',
          // Color coding for event dates (only when showLegend is true)
          showLegend && eventInfo?.status === 'upcoming' && !modifiers.selected && 'bg-emerald-50 hover:bg-emerald-100',
          showLegend && eventInfo?.status === 'past' && !modifiers.selected && 'bg-gray-100 text-gray-400',
          // Today always highlighted in orange
          isToday && !modifiers.selected && 'ring-2 ring-orange-400 bg-orange-50 text-orange-700 font-bold',
          className
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        {...props}
      >
        {day.date.getDate()}
        {/* Dot indicators for event dates (only when showLegend) */}
        {showLegend && eventInfo && !modifiers.selected && (
          <span
            className={cn(
              'absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full',
              eventInfo.status === 'upcoming' ? 'bg-emerald-500' : 'bg-gray-400'
            )}
          />
        )}
      </Button>
      {showTooltip && eventInfo?.title && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded shadow-lg whitespace-nowrap pointer-events-none">
          {eventInfo.title}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  )
}

export default function DatePicker({ value, onChange, placeholder = 'Select date', required = false, eventDates }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  // Parse value to Date object for calendar
  const selectedDate = value ? new Date(value + 'T00:00:00') : undefined

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const formatted = format(date, 'yyyy-MM-dd')
      onChange(formatted)
      setOpen(false)
    }
  }

  // Format display date nicely
  const displayDate = selectedDate
    ? format(selectedDate, 'MMMM d, yyyy')
    : ''

  // Build a lookup map for event dates
  const eventDatesMap = useMemo(() => {
    if (!eventDates) return new Map<string, EventDateInfo>()
    const map = new Map<string, EventDateInfo>()
    eventDates.forEach(ed => {
      map.set(ed.date, ed)
    })
    return map
  }, [eventDates])

  const hasEventDates = eventDates && eventDates.length > 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500',
            'hover:border-gray-400 transition-colors',
            !displayDate && 'text-gray-400'
          )}
        >
          <span className={displayDate ? 'text-gray-900' : 'text-gray-400'}>
            {displayDate || placeholder}
          </span>
          <CalendarIcon className="ml-2 h-4 w-4 text-gray-400 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="relative">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            initialFocus
            className="[--cell-size:40px] sm:[--cell-size:44px]"
            components={{
              DayButton: (props) => (
                <EventDayButton {...props} eventDatesMap={eventDatesMap} showLegend={hasEventDates} />
              ),
            }}
          />
          {/* Legend - only show when eventDates are provided (Race Date) */}
          {hasEventDates && (
            <div className="flex items-center gap-3 px-3 pb-3 pt-1 border-t">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-gray-500">Upcoming</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-[10px] text-gray-500">Past</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-[10px] text-gray-500">Today</span>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export type { EventDateInfo }

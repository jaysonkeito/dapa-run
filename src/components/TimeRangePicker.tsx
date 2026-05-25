'use client'
import TimePicker from './TimePicker'

interface TimeRangePickerProps {
  startValue: string
  endValue: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
}

export default function TimeRangePicker({ startValue, endValue, onStartChange, onEndChange }: TimeRangePickerProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <TimePicker value={startValue} onChange={onStartChange} />
      <span className="text-xs text-gray-500 font-medium">to</span>
      <TimePicker value={endValue} onChange={onEndChange} />
    </div>
  )
}

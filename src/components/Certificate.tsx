'use client'

import { Award } from 'lucide-react'

interface CertificateProps {
  runnerName: string
  eventName: string
  distance: string
  time: string
  bib: string
  gender: string
  genderRank: number
  overallRank: number
  eventDate: string
  eventLocation: string
}

export default function Certificate({
  runnerName,
  eventName,
  distance,
  time,
  bib,
  gender,
  genderRank,
  overallRank,
  eventDate,
  eventLocation,
}: CertificateProps) {
  // Format the date nicely
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00')
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // Get ordinal suffix for day
  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
  }

  // Format date for the award line
  const formatAwardDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00')
      const day = getOrdinal(d.getDate())
      const month = d.toLocaleDateString('en-US', { month: 'long' })
      const year = d.getFullYear()
      return `${day} day of ${month}, ${year}`
    } catch {
      return dateStr
    }
  }

  return (
    <div className="relative w-full max-w-[800px] mx-auto bg-white aspect-[8.5/11] flex flex-col items-center justify-center p-12 print:p-8" id="e-certificate">
      {/* Outer decorative border */}
      <div className="absolute inset-4 border-4 border-double border-orange-300 rounded-sm" />
      {/* Inner border */}
      <div className="absolute inset-6 border border-orange-200 rounded-sm" />

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-3 border-l-3 border-orange-500" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-3 border-r-3 border-orange-500" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-3 border-l-3 border-orange-500" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-3 border-r-3 border-orange-500" />

      {/* Content */}
      <div className="relative z-10 text-center space-y-4">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <Award className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-black tracking-wider text-orange-600" style={{ fontFamily: 'Georgia, serif' }}>
              DAPA RUN
            </h1>
            <Award className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-sm font-semibold text-gray-500 tracking-widest uppercase">Dumaguete</p>
        </div>

        {/* Event Name */}
        <h2 className="text-xl font-bold text-gray-800 tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
          {eventName}
        </h2>

        {/* Certificate Title */}
        <div className="py-2">
          <h3 className="text-2xl font-bold text-orange-600 tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
            Finisher E-Certificate
          </h3>
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent mx-auto mt-2" />
        </div>

        {/* Certification Text */}
        <p className="text-sm text-gray-600 tracking-wide">This certifies that</p>

        {/* Runner Name */}
        <h2 className="text-3xl font-bold text-gray-900 tracking-wide py-1" style={{ fontFamily: 'Georgia, serif' }}>
          {runnerName}
        </h2>

        <p className="text-sm text-gray-600 tracking-wide">has successfully completed the</p>

        {/* Distance Category */}
        <h3 className="text-xl font-bold text-orange-600" style={{ fontFamily: 'Georgia, serif' }}>
          {distance} Category
        </h3>

        <p className="text-sm text-gray-600 tracking-wide">with an official time of</p>

        {/* Time */}
        <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
          {time}
        </h3>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mt-4 max-w-sm mx-auto">
          <div className="text-left text-gray-500">Race Bib No.</div>
          <div className="text-left font-semibold text-gray-800">{bib}</div>
          <div className="text-left text-gray-500">Gender</div>
          <div className="text-left font-semibold text-gray-800 capitalize">{gender}</div>
          <div className="text-left text-gray-500">Category</div>
          <div className="text-left font-semibold text-gray-800">{distance}</div>
          <div className="text-left text-gray-500">Gender Rank</div>
          <div className="text-left font-semibold text-gray-800">{genderRank > 0 ? `#${genderRank}` : '—'}</div>
          <div className="text-left text-gray-500">Overall Rank</div>
          <div className="text-left font-semibold text-gray-800">{overallRank > 0 ? `#${overallRank}` : '—'}</div>
        </div>

        {/* Award Line */}
        <div className="mt-6 pt-4 border-t border-orange-200">
          <p className="text-xs text-gray-500 tracking-wide">
            Awarded this {formatAwardDate(eventDate)} at {eventLocation}
          </p>
        </div>
      </div>
    </div>
  )
}

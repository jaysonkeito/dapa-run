'use client'

import { useState, useMemo, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { raceResults as fallbackResults, type RaceResultData } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Trophy,
  ChevronDown,
  ChevronUp,
  Share2,
  ArrowLeft,
  Medal,
  Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

function FinisherRow({ finisher }: { finisher: { rank: number; bib: string; name: string; time: string } }) {
  const medalColors: Record<number, string> = {
    1: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    2: 'bg-gradient-to-br from-gray-300 to-gray-500',
    3: 'bg-gradient-to-br from-orange-400 to-orange-700',
  }
  return (
    <div className={cn(
      'flex items-center gap-4 py-3 px-4 rounded-lg transition-colors',
      finisher.rank <= 3 ? 'bg-orange-50/60' : 'hover:bg-gray-50'
    )}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0',
        medalColors[finisher.rank] || 'bg-gray-200 text-gray-600'
      )}>
        {finisher.rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{finisher.name}</p>
        <p className="text-xs text-gray-400">Bib #{finisher.bib}</p>
      </div>
      <div className="text-right">
        <p className="font-mono font-bold text-gray-900 text-sm">{finisher.time}</p>
      </div>
    </div>
  )
}

export default function RaceResultsPage() {
  const { selectedResultEvent, setSelectedResultEvent } = useStore()
  const [selectedDistance, setSelectedDistance] = useState<string>('all')
  const [results, setResults] = useState<RaceResultData[]>(fallbackResults)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch('/api/results')
        if (res.ok) {
          const data = await res.json()
          if (data.length > 0) {
            const mapped: RaceResultData[] = data.map((r: Record<string, unknown>) => {
              const event = r.event as Record<string, unknown>
              let finishersArr: RaceResultData['finishers'] = []
              try {
                finishersArr = JSON.parse(r.finishers as string)
              } catch { /* use empty */ }
              return {
                id: r.id as string,
                eventId: r.eventId as string,
                eventName: event?.title as string || 'Unknown Event',
                eventDate: event?.date as string || '',
                distance: r.distance as string,
                finishers: finishersArr,
              }
            })
            setResults(mapped)
          }
        }
      } catch (error) {
        console.error('Failed to fetch results:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [])

  // Group results by event
  const resultsByEvent = useMemo(() => results.reduce((acc, result) => {
    if (!acc[result.eventId]) {
      acc[result.eventId] = {
        eventName: result.eventName,
        eventDate: result.eventDate,
        results: [],
      }
    }
    acc[result.eventId].results.push(result)
    return acc
  }, {} as Record<string, { eventName: string; eventDate: string; results: typeof results }>), [results])

  // If a specific event is selected, filter to that
  const filteredEvents = selectedResultEvent
    ? { [selectedResultEvent]: resultsByEvent[selectedResultEvent] }
    : resultsByEvent

  // Compute initial expanded sections based on selected event
  const initialExpanded = useMemo(() => {
    if (selectedResultEvent) {
      const eventResults = resultsByEvent[selectedResultEvent]
      if (eventResults) {
        const expanded: Record<string, boolean> = {}
        eventResults.results.forEach((r) => {
          expanded[`${r.id}-male`] = true
          expanded[`${r.id}-female`] = true
        })
        return expanded
      }
    }
    return {}
  }, [selectedResultEvent, resultsByEvent])

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(initialExpanded)

  // Reset expanded sections when selectedResultEvent changes
  const prevSelectedRef = useState(selectedResultEvent)
  if (prevSelectedRef[0] !== selectedResultEvent) {
    prevSelectedRef[1](selectedResultEvent)
    setExpandedSections(initialExpanded)
  }

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-gray-900 to-gray-800 py-16 sm:py-20">
        <div className="absolute inset-0 opacity-20">
          <img src="/hero-banner.png" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4"
          >
            Race Results
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-300 text-lg max-w-2xl mx-auto"
          >
            Check out the official results and top finishers from our past events.
          </motion.p>
        </div>
      </section>

      {/* Results */}
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading results...</p>
            </div>
          ) : (
            <>
              {selectedResultEvent && (
                <Button
                  variant="ghost"
                  onClick={() => { setSelectedResultEvent(null); setExpandedSections({}) }}
                  className="mb-6 text-orange-500 hover:text-orange-600 font-semibold"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All Results
                </Button>
              )}

              {Object.entries(filteredEvents).map(([eventId, eventData]) => (
                <div key={eventId} className="mb-8">
                  <Card className="overflow-hidden border-0 shadow-lg">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold">{eventData.eventName}</h2>
                          <p className="text-orange-100 text-sm mt-1">{eventData.eventDate}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                          <Share2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Distance filter for this event */}
                    {eventData.results.length > 1 && (
                      <div className="border-b px-6 py-3 flex items-center gap-2 overflow-x-auto">
                        <span className="text-sm text-gray-500 shrink-0">Distance:</span>
                        <button
                          onClick={() => setSelectedDistance('all')}
                          className={cn(
                            'px-3 py-1 rounded-full text-sm font-medium transition-all',
                            selectedDistance === 'all'
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          All
                        </button>
                        {eventData.results.map((r) => (
                          <button
                            key={r.distance}
                            onClick={() => setSelectedDistance(r.distance)}
                            className={cn(
                              'px-3 py-1 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                              selectedDistance === r.distance
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                          >
                            {r.distance}
                          </button>
                        ))}
                      </div>
                    )}

                    <CardContent className="p-6">
                      {eventData.results
                        .filter((r) => selectedDistance === 'all' || r.distance === selectedDistance)
                        .map((result) => {
                          const males = result.finishers.filter((f) => f.gender === 'male')
                          const females = result.finishers.filter((f) => f.gender === 'female')
                          return (
                            <div key={result.id} className="mb-6 last:mb-0">
                              <div className="flex items-center gap-2 mb-4">
                                <Medal className="w-5 h-5 text-orange-500" />
                                <h3 className="font-bold text-gray-900">
                                  Top Finishers: {result.distance}
                                </h3>
                              </div>

                              {/* Male */}
                              {males.length > 0 && (
                                <div className="mb-4">
                                  <button
                                    onClick={() => toggleSection(`${result.id}-male`)}
                                    className="w-full flex items-center justify-between py-2 px-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors mb-2"
                                  >
                                    <span className="font-semibold text-gray-700 text-sm">
                                      Overall {result.distance} (Male)
                                    </span>
                                    {expandedSections[`${result.id}-male`] ? (
                                      <ChevronUp className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-gray-500" />
                                    )}
                                  </button>
                                  <AnimatePresence>
                                    {expandedSections[`${result.id}-male`] && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="space-y-1">
                                          {males.map((f) => (
                                            <FinisherRow key={f.bib} finisher={f} />
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}

                              {/* Female */}
                              {females.length > 0 && (
                                <div>
                                  <button
                                    onClick={() => toggleSection(`${result.id}-female`)}
                                    className="w-full flex items-center justify-between py-2 px-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors mb-2"
                                  >
                                    <span className="font-semibold text-gray-700 text-sm">
                                      Overall {result.distance} (Female)
                                    </span>
                                    {expandedSections[`${result.id}-female`] ? (
                                      <ChevronUp className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-gray-500" />
                                    )}
                                  </button>
                                  <AnimatePresence>
                                    {expandedSections[`${result.id}-female`] && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="space-y-1">
                                          {females.map((f) => (
                                            <FinisherRow key={f.bib} finisher={f} />
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </CardContent>
                  </Card>
                </div>
              ))}

              {Object.keys(filteredEvents).length === 0 && (
                <div className="text-center py-16">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No race results available yet.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

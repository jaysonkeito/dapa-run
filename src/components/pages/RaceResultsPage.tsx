'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { type RaceResultData } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Trophy,
  ChevronDown,
  ChevronUp,
  Share2,
  ArrowLeft,
  Medal,
  Loader2,
  Search,
  X,
  Award,
  Download,
  User,
  Timer,
  MapPin,
  Calendar,
  Hash,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import Certificate from '@/components/Certificate'
import html2canvas from 'html2canvas'

interface BibSearchResult {
  name: string
  bib: string
  gender: string
  distance: string
  time: string
  genderRank: number
  overallRank: number
  eventName: string
  eventDate: string
  eventLocation: string
  eventId: string
}

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
  const [results, setResults] = useState<RaceResultData[]>([])
  const [loading, setLoading] = useState(true)

  // Bib search state
  const [bibSearchInput, setBibSearchInput] = useState('')
  const [bibSearchResults, setBibSearchResults] = useState<BibSearchResult[]>([])
  const [bibSearchLoading, setBibSearchLoading] = useState(false)
  const [bibSearchActive, setBibSearchActive] = useState(false)
  const [bibSearchError, setBibSearchError] = useState('')

  // Certificate dialog state
  const [certificateOpen, setCertificateOpen] = useState(false)
  const [certificateData, setCertificateData] = useState<BibSearchResult | null>(null)
  const [downloading, setDownloading] = useState(false)

  const handleBibSearch = useCallback(async () => {
    const bib = bibSearchInput.trim()
    if (!bib) return

    setBibSearchLoading(true)
    setBibSearchError('')
    setBibSearchActive(true)

    try {
      const res = await fetch(`/api/results?bib=${encodeURIComponent(bib)}`)
      if (res.ok) {
        const data = await res.json()
        setBibSearchResults(data)
        if (data.length === 0) {
          setBibSearchError(`No results found for Race Bib "${bib}". Please check your bib number and try again.`)
        }
      } else {
        setBibSearchError('Something went wrong. Please try again.')
        setBibSearchResults([])
      }
    } catch {
      setBibSearchError('Network error. Please check your connection and try again.')
      setBibSearchResults([])
    } finally {
      setBibSearchLoading(false)
    }
  }, [bibSearchInput])

  const handleClearSearch = useCallback(() => {
    setBibSearchInput('')
    setBibSearchResults([])
    setBibSearchActive(false)
    setBibSearchError('')
  }, [])

  const handleViewCertificate = useCallback((result: BibSearchResult) => {
    setCertificateData(result)
    setCertificateOpen(true)
  }, [])

  const handleDownloadCertificate = useCallback(async () => {
    if (!certificateData) return
    setDownloading(true)
    try {
      const element = document.getElementById('e-certificate')
      if (!element) {
        console.error('Certificate element not found')
        return
      }
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const link = document.createElement('a')
      const runnerName = certificateData.name.replace(/\s+/g, '-')
      link.download = `DAPA-RUN-Certificate-${runnerName}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Failed to download certificate:', error)
    } finally {
      setDownloading(false)
    }
  }, [certificateData])

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch('/api/results')
        if (res.ok) {
          const data = await res.json()
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

      {/* Search by Race Bib */}
      <section className="py-6 sm:py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Find Your Results</h2>
                  <p className="text-orange-100 text-sm">Search by your Race Bib number to view your results and download your E-Certificate</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter your Race Bib Number"
                    value={bibSearchInput}
                    onChange={(e) => setBibSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleBibSearch()
                    }}
                    className="pl-10 h-11 bg-white border-0 text-gray-900 placeholder:text-gray-400 focus-visible:ring-orange-300"
                  />
                </div>
                <Button
                  onClick={handleBibSearch}
                  disabled={bibSearchLoading || !bibSearchInput.trim()}
                  className="h-11 px-6 bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-md"
                >
                  {bibSearchLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
                {bibSearchActive && (
                  <Button
                    variant="outline"
                    onClick={handleClearSearch}
                    className="h-11 px-4 border-white/30 text-white hover:bg-white/10 hover:text-white"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bib Search Results */}
      <AnimatePresence>
        {bibSearchActive && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-50"
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
              {bibSearchLoading && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-3" />
                  <p className="text-gray-500">Searching for your results...</p>
                </div>
              )}

              {bibSearchError && !bibSearchLoading && (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6 text-center">
                    <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">{bibSearchError}</p>
                  </CardContent>
                </Card>
              )}

              {bibSearchResults.length > 0 && !bibSearchLoading && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">
                      Search Results for Bib #{bibSearchInput.trim()}
                    </h3>
                    <Button
                      variant="ghost"
                      onClick={handleClearSearch}
                      className="text-orange-500 hover:text-orange-600 font-semibold"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to All Results
                    </Button>
                  </div>
                  {bibSearchResults.map((result, index) => (
                    <Card key={`${result.bib}-${result.eventId}-${index}`} className="border-0 shadow-md overflow-hidden">
                      <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          {/* Runner Info */}
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                              <User className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="space-y-2">
                              <div>
                                <h4 className="text-lg font-bold text-gray-900">{result.name}</h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                    Bib #{result.bib}
                                  </Badge>
                                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 capitalize">
                                    {result.gender}
                                  </Badge>
                                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                    {result.distance}
                                  </Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                <div className="flex items-center gap-2 text-gray-500">
                                  <Timer className="w-3.5 h-3.5" />
                                  <span>Time:</span>
                                </div>
                                <span className="font-semibold text-gray-900 font-mono">{result.time}</span>
                                <div className="flex items-center gap-2 text-gray-500">
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Overall Rank:</span>
                                </div>
                                <span className="font-semibold text-gray-900">#{result.overallRank}</span>
                                <div className="flex items-center gap-2 text-gray-500">
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Gender Rank:</span>
                                </div>
                                <span className="font-semibold text-gray-900">#{result.genderRank}</span>
                              </div>
                            </div>
                          </div>
                          {/* Event Info + Certificate Button */}
                          <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
                            <div className="text-sm space-y-1 sm:text-right">
                              <p className="font-semibold text-gray-900">{result.eventName}</p>
                              <div className="flex items-center gap-1.5 text-gray-500 sm:justify-end">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{result.eventDate}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-500 sm:justify-end">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{result.eventLocation}</span>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleViewCertificate(result)}
                              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md"
                            >
                              <Award className="w-4 h-4 mr-2" />
                              View Certificate
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

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
                  <Card className="overflow-hidden border-0 shadow-lg bg-white">
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

      {/* E-Certificate Dialog */}
      <Dialog open={certificateOpen} onOpenChange={setCertificateOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-500" />
              Finisher E-Certificate
            </DialogTitle>
            <DialogDescription>
              Your official finisher certificate for {certificateData?.eventName}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 overflow-x-auto">
            {certificateData && (
              <Certificate
                runnerName={certificateData.name}
                eventName={certificateData.eventName}
                distance={certificateData.distance}
                time={certificateData.time}
                bib={certificateData.bib}
                gender={certificateData.gender}
                genderRank={certificateData.genderRank}
                overallRank={certificateData.overallRank}
                eventDate={certificateData.eventDate}
                eventLocation={certificateData.eventLocation}
              />
            )}
          </div>
          <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
            <Button
              onClick={handleDownloadCertificate}
              disabled={downloading}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Certificate
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setCertificateOpen(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

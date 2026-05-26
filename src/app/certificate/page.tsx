'use client'

import { useState } from 'react'
import { Search, Award, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import Certificate from '@/components/Certificate'

interface SearchResult {
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

export default function CertificatePage() {
  const [bibSearch, setBibSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [certificateOpen, setCertificateOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)

  const handleSearch = async () => {
    if (!bibSearch.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/results?bib=${encodeURIComponent(bibSearch.trim())}`)
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  const openCertificate = (result: SearchResult) => {
    setSelectedResult(result)
    setCertificateOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href="/" className="text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl font-bold text-gray-900">Race Bib Search</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <p className="text-sm text-gray-600 mb-4">
            Enter your Race Bib number to find your results and view your Finisher E-Certificate.
          </p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={bibSearch}
                onChange={(e) => setBibSearch(e.target.value)}
                placeholder="Enter Race Bib Number (e.g., 1042)"
                className="pl-10 h-12 text-base"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold h-12 px-8"
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {/* Results */}
        {searched && results.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Results Found</h3>
            <p className="text-sm text-gray-500">
              No runner found with Bib Number &quot;{bibSearch}&quot;. Please check your bib number and try again.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-600">{result.bib}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{result.name}</h3>
                        <p className="text-sm text-gray-500">{result.eventName}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 ml-15">
                      <div>
                        <p className="text-xs text-gray-400 uppercase">Distance</p>
                        <p className="text-sm font-semibold text-gray-800">{result.distance}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase">Time</p>
                        <p className="text-sm font-semibold text-gray-800">{result.time}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase">Gender</p>
                        <p className="text-sm font-semibold text-gray-800 capitalize">{result.gender}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase">Overall Rank</p>
                        <p className="text-sm font-semibold text-gray-800">#{result.overallRank || '—'}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => openCertificate(result)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shrink-0"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    View Certificate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificate Dialog */}
      <Dialog open={certificateOpen} onOpenChange={setCertificateOpen}>
        <DialogContent className="max-w-[900px] max-h-[95vh] overflow-y-auto p-4">
          <DialogTitle className="sr-only">Finisher E-Certificate</DialogTitle>
          {selectedResult && (
            <Certificate
              runnerName={selectedResult.name}
              eventName={selectedResult.eventName}
              distance={selectedResult.distance}
              time={selectedResult.time}
              bib={selectedResult.bib}
              gender={selectedResult.gender}
              genderRank={selectedResult.genderRank}
              overallRank={selectedResult.overallRank}
              eventDate={selectedResult.eventDate}
              eventLocation={selectedResult.eventLocation}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

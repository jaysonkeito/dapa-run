'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2, Loader2, FileDown } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { generateCSV, formatPriceForReport, formatDateForReport } from '@/lib/report-utils'

interface RaceResult {
  id: string
  eventId: string
  distance: string
  finishers: string
  event?: { id: string; title: string; date: string }
}

interface Event {
  id: string
  title: string
  date: string
  status: string
}

interface Finisher {
  rank: number
  bib: string
  name: string
  time: string
  gender: string
}

export default function AdminResultsPage() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const isAdmin = (session?.user as Record<string, unknown>)?.role === 'admin'
  const [results, setResults] = useState<RaceResult[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState<RaceResult | null>(null)
  const [eventId, setEventId] = useState('')
  const [distance, setDistance] = useState('')
  const [finishers, setFinishers] = useState<Finisher[]>([
    { rank: 1, bib: '', name: '', time: '', gender: 'male' },
  ])
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    try {
      const [resultsRes, eventsRes] = await Promise.all([
        fetch('/api/admin/results'),
        fetch('/api/admin/events'),
      ])
      const resultsData = await resultsRes.json()
      const eventsData = await eventsRes.json()
      setResults(resultsData)
      setEvents(eventsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => {
    setSelectedResult(null)
    setEventId('')
    setDistance('')
    setFinishers([{ rank: 1, bib: '', name: '', time: '', gender: 'male' }])
    setDialogOpen(true)
  }

  const openEdit = (result: RaceResult) => {
    setSelectedResult(result)
    setEventId(result.eventId)
    setDistance(result.distance)
    try {
      const parsed = JSON.parse(result.finishers)
      setFinishers(parsed.length > 0 ? parsed : [{ rank: 1, bib: '', name: '', time: '', gender: 'male' }])
    } catch {
      setFinishers([{ rank: 1, bib: '', name: '', time: '', gender: 'male' }])
    }
    setDialogOpen(true)
  }

  const openDelete = (result: RaceResult) => {
    setSelectedResult(result)
    setDeleteDialogOpen(true)
  }

  const addFinisher = () => {
    setFinishers([...finishers, { rank: finishers.length + 1, bib: '', name: '', time: '', gender: 'male' }])
  }

  const removeFinisher = (index: number) => {
    setFinishers(finishers.filter((_, i) => i !== index).map((f, i) => ({ ...f, rank: i + 1 })))
  }

  const updateFinisher = (index: number, field: keyof Finisher, value: string | number) => {
    const updated = [...finishers]
    updated[index] = { ...updated[index], [field]: value }
    setFinishers(updated)
  }

  const handleSave = async () => {
    if (!eventId || !distance) {
      toast({ title: 'Error', description: 'Event and distance are required.', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const payload = {
        eventId,
        distance,
        finishers: JSON.stringify(finishers),
      }

      if (selectedResult) {
        const res = await fetch(`/api/admin/results/${selectedResult.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to update result')
        toast({ title: 'Result Updated', description: 'Race result has been updated.' })
      } else {
        const res = await fetch('/api/admin/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create result')
        toast({ title: 'Result Created', description: 'Race result has been created.' })
      }
      setDialogOpen(false)
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedResult) return
    try {
      await fetch(`/api/admin/results/${selectedResult.id}`, { method: 'DELETE' })
      toast({ title: 'Result Deleted', description: 'Race result has been deleted.' })
      setDeleteDialogOpen(false)
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete result.', variant: 'destructive' })
    }
  }

  const getEventTitle = (eventId: string) => {
    return events.find((e) => e.id === eventId)?.title || 'Unknown Event'
  }

  const getFinisherCount = (finishersStr: string) => {
    try {
      return JSON.parse(finishersStr).length
    } catch {
      return 0
    }
  }

  const handleGenerateReport = () => {
    const headers = ['Event', 'Distance', 'Finishers Count', 'Date']
    const rows = results.map(r => [
      r.event?.title || getEventTitle(r.eventId),
      r.distance,
      String(getFinisherCount(r.finishers)),
      r.event?.date ? formatDateForReport(r.event.date) : 'N/A',
    ])
    generateCSV(headers, rows, `race-results-${new Date().toISOString().split('T')[0]}`)
    toast({ title: 'Report Generated', description: 'Race results report has been downloaded.' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Race Results</h1>
          <p className="text-gray-500 mt-1">Manage race results for past events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleGenerateReport} variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold" disabled={results.length === 0}>
            <FileDown className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          {isAdmin && (
            <Button onClick={openCreate} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Add Result
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Finishers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading...
                  </TableCell>
                </TableRow>
              ) : results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-400">No race results found.</TableCell>
                </TableRow>
              ) : (
                results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">
                      {result.event?.title || getEventTitle(result.eventId)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-orange-500 text-white">{result.distance}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{getFinisherCount(result.finishers)} finishers</TableCell>
                    <TableCell className="text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(result)}>
                            <Pencil className="w-4 h-4 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDelete(result)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">View only</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>{selectedResult ? 'Edit Result' : 'Add Result'}</DialogTitle>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event</Label>
                <Select value={eventId} onValueChange={setEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Distance</Label>
                <Input value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="e.g. 10K, 21K" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Finishers</Label>
                <Button type="button" variant="outline" size="sm" onClick={addFinisher}>
                  <Plus className="w-3 h-3 mr-1" /> Add Finisher
                </Button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {finishers.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {f.rank}
                    </div>
                    <Input
                      placeholder="Bib #"
                      value={f.bib}
                      onChange={(e) => updateFinisher(i, 'bib', e.target.value)}
                      className="w-20"
                    />
                    <Input
                      placeholder="Name"
                      value={f.name}
                      onChange={(e) => updateFinisher(i, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Time"
                      value={f.time}
                      onChange={(e) => updateFinisher(i, 'time', e.target.value)}
                      className="w-28"
                    />
                    <Select value={f.gender} onValueChange={(v) => updateFinisher(i, 'gender', v)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFinisher(i)} className="shrink-0">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {selectedResult ? 'Update Result' : 'Create Result'}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Result</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this race result? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

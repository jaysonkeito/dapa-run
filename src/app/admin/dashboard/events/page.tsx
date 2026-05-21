'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ImageUpload from '@/components/ImageUpload'

interface Event {
  id: string
  title: string
  date: string
  time: string
  location: string
  priceRange: string
  image: string
  distances: string
  description: string
  status: string
  featured: boolean
  _count?: { registrations: number }
}

const emptyEvent = {
  title: '',
  date: '',
  time: '',
  location: '',
  priceRange: '',
  image: '/hero-banner.png',
  distances: '',
  description: '',
  status: 'upcoming',
  featured: false,
}

export default function AdminEventsPage() {
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [form, setForm] = useState(emptyEvent)
  const [saving, setSaving] = useState(false)

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/events')
      const data = await res.json()
      setEvents(data)
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  const openCreate = () => {
    setSelectedEvent(null)
    setForm(emptyEvent)
    setDialogOpen(true)
  }

  const openEdit = (event: Event) => {
    setSelectedEvent(event)
    setForm({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      priceRange: event.priceRange,
      image: event.image,
      distances: event.distances,
      description: event.description,
      status: event.status,
      featured: event.featured,
    })
    setDialogOpen(true)
  }

  const openDelete = (event: Event) => {
    setSelectedEvent(event)
    setDeleteDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (selectedEvent) {
        const res = await fetch(`/api/admin/events/${selectedEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Failed to update event')
        toast({ title: 'Event Updated', description: `${form.title} has been updated.` })
      } else {
        const res = await fetch('/api/admin/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Failed to create event')
        toast({ title: 'Event Created', description: `${form.title} has been created.` })
      }
      setDialogOpen(false)
      fetchEvents()
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedEvent) return
    try {
      await fetch(`/api/admin/events/${selectedEvent.id}`, { method: 'DELETE' })
      toast({ title: 'Event Deleted', description: `${selectedEvent.title} has been deleted.` })
      setDeleteDialogOpen(false)
      fetchEvents()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete event.', variant: 'destructive' })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-1">Manage all running events</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-md border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Distances</TableHead>
                <TableHead>Registrations</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading events...
                  </TableCell>
                </TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-400">No events found.</TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      <div>
                        {event.title}
                        {event.featured && (
                          <Badge className="ml-2 bg-orange-500 text-white text-[10px]">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{event.date}</TableCell>
                    <TableCell>
                      <Badge variant={event.status === 'upcoming' ? 'default' : 'secondary'}
                        className={event.status === 'upcoming' ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{event.distances}</TableCell>
                    <TableCell className="text-sm text-gray-600">{event._count?.registrations ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(event)}>
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDelete(event)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>{selectedEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="e.g. July 19, 2026" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Time</Label>
                <Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="e.g. 4:00 AM - 9:00 AM" />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price Range</Label>
                <Input value={form.priceRange} onChange={(e) => setForm({ ...form, priceRange: e.target.value })} placeholder="e.g. ₱500 – ₱1,800" />
              </div>
              <div className="space-y-2">
                <Label>Distances (comma-separated)</Label>
                <Input value={form.distances} onChange={(e) => setForm({ ...form, distances: e.target.value })} placeholder="e.g. 3K,5K,10K,21K" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <ImageUpload
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
              aspectRatio="16:9"
              label="Event Image"
            />
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={form.featured}
                onCheckedChange={(checked) => setForm({ ...form, featured: !!checked })}
              />
              <Label htmlFor="featured">Featured Event</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {selectedEvent ? 'Update Event' : 'Create Event'}
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
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedEvent?.title}&quot;? This action cannot be undone and will also delete all associated race results and registrations.
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

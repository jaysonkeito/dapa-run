'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

interface MerchItem {
  id: string
  name: string
  price: number
  image: string
  category: string
  description: string
  sizes: string | null
  badge: string | null
}

const emptyForm = {
  name: '',
  price: 0,
  image: '/merch-banner.png',
  category: 'shoes',
  description: '',
  sizes: '',
  badge: '',
}

export default function AdminMerchandisePage() {
  const { toast } = useToast()
  const [items, setItems] = useState<MerchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MerchItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/merchandise')
      const data = await res.json()
      setItems(data)
    } catch (error) {
      console.error('Failed to fetch merchandise:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const openCreate = () => {
    setSelectedItem(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (item: MerchItem) => {
    setSelectedItem(item)
    setForm({
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category,
      description: item.description,
      sizes: item.sizes || '',
      badge: item.badge || '',
    })
    setDialogOpen(true)
  }

  const openDelete = (item: MerchItem) => {
    setSelectedItem(item)
    setDeleteDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        sizes: form.sizes || null,
        badge: form.badge || null,
      }

      if (selectedItem) {
        const res = await fetch(`/api/admin/merchandise/${selectedItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to update item')
        toast({ title: 'Item Updated', description: `${form.name} has been updated.` })
      } else {
        const res = await fetch('/api/admin/merchandise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create item')
        toast({ title: 'Item Created', description: `${form.name} has been created.` })
      }
      setDialogOpen(false)
      fetchItems()
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    try {
      await fetch(`/api/admin/merchandise/${selectedItem.id}`, { method: 'DELETE' })
      toast({ title: 'Item Deleted', description: `${selectedItem.name} has been deleted.` })
      setDeleteDialogOpen(false)
      fetchItems()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete item.', variant: 'destructive' })
    }
  }

  const categoryColors: Record<string, string> = {
    shoes: 'bg-orange-500 text-white',
    apparel: 'bg-purple-500 text-white',
    accessories: 'bg-emerald-500 text-white',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Merchandise</h1>
          <p className="text-gray-500 mt-1">Manage product catalog</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-md border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Sizes</TableHead>
                <TableHead>Badge</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-400">No merchandise found.</TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge className={categoryColors[item.category] || 'bg-gray-500 text-white'}>
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-orange-600">₱{item.price.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-gray-600">{item.sizes || '—'}</TableCell>
                    <TableCell>
                      {item.badge ? (
                        <Badge variant="outline" className="border-orange-200 text-orange-500">{item.badge}</Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDelete(item)}>
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
          <DialogTitle>{selectedItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Price (₱)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shoes">Shoes</SelectItem>
                    <SelectItem value="apparel">Apparel</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Badge (optional)</Label>
                <Input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="e.g. Best Seller, New" />
              </div>
            </div>
            <ImageUpload
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
              aspectRatio="1:1"
              label="Product Image"
            />
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Sizes (comma-separated, optional)</Label>
              <Input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="e.g. XS,S,M,L,XL" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {selectedItem ? 'Update Item' : 'Create Item'}
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
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedItem?.name}&quot;? This action cannot be undone.
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

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
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
import { Plus, Trash2, Loader2, UserPlus, Shield, Pencil, Download, Code } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { generateCSV, formatDateForReport } from '@/lib/report-utils'

interface UserData {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  createdAt: string
  _count?: { registrations: number }
}

export default function AdminUsersPage() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const isAdmin = (session?.user as Record<string, unknown>)?.role === 'admin'
  const currentUserId = (session?.user as Record<string, unknown>)?.id as string | undefined
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addType, setAddType] = useState<'staff' | 'developer'>('staff')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: 'user', password: '' })
  const [editSaving, setEditSaving] = useState(false)

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const filteredUsers = users
    .filter((u) => !['admin', 'staff', 'developer'].includes(u.role)) // Only show regular users
    .filter((u) => roleFilter === 'all' || u.role === roleFilter)

  const handleAddUser = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addForm, role: addType }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Failed to create account', variant: 'destructive' })
        return
      }
      toast({ title: 'Account Created', description: `${addForm.name} has been created as ${addType}.` })
      setAddDialogOpen(false)
      setAddForm({ name: '', email: '', password: '' })
      fetchUsers()
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Failed to update role', variant: 'destructive' })
        return
      }
      toast({ title: 'Role Updated', description: `User role has been changed to ${newRole}.` })
      fetchUsers()
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
    }
  }

  const openEditUser = (user: UserData) => {
    setSelectedUser(user)
    setEditForm({ name: user.name, email: user.email, phone: user.phone || '', role: user.role, password: '' })
    setEditDialogOpen(true)
  }

  const handleEditUser = async () => {
    if (!selectedUser) return
    setEditSaving(true)
    try {
      const payload: Record<string, string> = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
      }
      if (selectedUser.id !== currentUserId) {
        payload.role = editForm.role
      }
      if (editForm.password.trim()) {
        payload.password = editForm.password
      }
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Failed to update user', variant: 'destructive' })
        return
      }
      toast({ title: 'User Updated', description: `${editForm.name} has been updated.` })
      setEditDialogOpen(false)
      fetchUsers()
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error || 'Failed to delete user', variant: 'destructive' })
        return
      }
      toast({ title: 'User Deleted', description: `${selectedUser.name} has been deleted.` })
      setDeleteDialogOpen(false)
      fetchUsers()
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
    }
  }

  const roleColors: Record<string, string> = {
    user: 'bg-gray-500 text-white',
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-xs text-orange-600 mt-1">Shows participant accounts only. Team members (Admin, Staff, Developer) are managed in Settings → Team Management.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => {
            const headers = ['Name', 'Email', 'Role', 'Phone', 'Joined Date']
            const rows = users.map((u) => [
              u.name,
              u.email,
              u.role,
              u.phone || '—',
              formatDateForReport(u.createdAt),
            ])
            generateCSV(headers, rows, 'dapa-run-users-report')
            toast({ title: 'Report Generated', description: 'Users report has been downloaded.' })
          }} variant="outline" className="font-semibold">
            <Download className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <>
              <Button onClick={() => { setAddType('staff'); setAddDialogOpen(true) }} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Staff
              </Button>
              <Button onClick={() => { setAddType('developer'); setAddDialogOpen(true) }} variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold">
                <Code className="w-4 h-4 mr-2" />
                Add Developer
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Registrations</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-400">No users found.</TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {user.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                    <TableCell className="text-sm text-gray-600">{user.phone || '—'}</TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role] || 'bg-gray-500 text-white'}>{user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{user._count?.registrations ?? 0}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isAdmin && (
                          <Button variant="ghost" size="icon" onClick={() => openEditUser(user)} title="Edit User">
                            <Pencil className="w-4 h-4 text-gray-500" />
                          </Button>
                        )}
                        {isAdmin && user.id !== currentUserId && (
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true) }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Staff/Developer Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Add {addType === 'developer' ? 'Developer' : 'Staff'} Account</DialogTitle>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder={`${addType} name`} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} placeholder={`${addType}@daparun.com`} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} placeholder="At least 6 characters" />
            </div>
            <p className="text-xs text-gray-500">The account will be created with &quot;{addType.charAt(0).toUpperCase() + addType.slice(1)}&quot; role.</p>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleAddUser}
                disabled={saving}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Create {addType === 'developer' ? 'Developer' : 'Staff'}
              </Button>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedUser?.name}&quot;? This will also remove all their registrations. This action cannot be undone.
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

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Edit User - {selectedUser?.name}</DialogTitle>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input type="tel" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Optional" />
            </div>
            {selectedUser?.id !== currentUserId && (
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedUser?.id === currentUserId && (
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-700">You cannot change your own role to prevent accidental removal of admin access.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Leave blank to keep current" />
              <p className="text-xs text-gray-400">Only fill in if you want to change the password.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleEditUser}
                disabled={editSaving}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
              >
                {editSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Loader2, Save, Globe, Phone, Mail, MapPin, ImageIcon, Facebook,
  Users, Trash2, UserPlus, Lock, Eye, EyeOff, AlertTriangle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ImageUpload from '@/components/ImageUpload'

interface Settings {
  [key: string]: string
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export default function AdminSettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const isAdmin = (session?.user as Record<string, unknown>)?.role === 'admin'
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Team Management
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamLoading, setTeamLoading] = useState(true)
  const [addStaffOpen, setAddStaffOpen] = useState(false)
  const [staffName, setStaffName] = useState('')
  const [staffEmail, setStaffEmail] = useState('')
  const [staffPassword, setStaffPassword] = useState('')
  const [staffLoading, setStaffLoading] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null)

  // Change Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showStaffPassword, setShowStaffPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      setSettings(data)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setTeamMembers(data.filter((u: TeamMember) => u.role === 'staff' || u.role === 'admin'))
    } catch (error) {
      console.error('Failed to fetch team members:', error)
    } finally {
      setTeamLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
    fetchTeamMembers()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({ key, value }))
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast({ title: 'Settings Saved', description: 'All changes have been saved successfully.' })
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddStaff = async () => {
    if (!staffName || !staffEmail || !staffPassword) {
      toast({ title: 'Missing Fields', description: 'Please fill in all fields.', variant: 'destructive' })
      return
    }
    if (staffPassword.length < 6) {
      toast({ title: 'Weak Password', description: 'Password must be at least 6 characters.', variant: 'destructive' })
      return
    }
    setStaffLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: staffName, email: staffEmail, password: staffPassword, role: 'staff' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create staff')
      }
      toast({ title: 'Staff Created', description: `${staffName} has been added as a staff member.` })
      setAddStaffOpen(false)
      setStaffName('')
      setStaffEmail('')
      setStaffPassword('')
      fetchTeamMembers()
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to create staff.', variant: 'destructive' })
    } finally {
      setStaffLoading(false)
    }
  }

  const handleDeleteMember = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      toast({ title: 'Member Removed', description: `${deleteTarget.name} has been removed.` })
      setDeleteConfirmOpen(false)
      setDeleteTarget(null)
      fetchTeamMembers()
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to delete member.', variant: 'destructive' })
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'Missing Fields', description: 'Please fill in all password fields.', variant: 'destructive' })
      return
    }
    if (newPassword.length < 6) {
      toast({ title: 'Weak Password', description: 'New password must be at least 6 characters.', variant: 'destructive' })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Password Mismatch', description: 'New password and confirmation do not match.', variant: 'destructive' })
      return
    }
    setPasswordLoading(true)
    try {
      const res = await fetch('/api/admin/users/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password')
      toast({ title: 'Password Updated', description: 'Your admin password has been changed successfully.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to change password.', variant: 'destructive' })
    } finally {
      setPasswordLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage site configuration, team, and account</p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* General Info */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900 text-lg">General Info</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Site Title</Label>
                <Input value={settings.site_title || ''} onChange={(e) => updateSetting('site_title', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Brand Name Suffix</Label>
                <p className="text-xs text-gray-500">Text displayed below DAPA RUN (e.g., Dumaguete, Bayawan)</p>
                <Input value={settings.site_name_suffix || ''} onChange={(e) => updateSetting('site_name_suffix', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Site Description</Label>
                <Textarea value={settings.site_description || ''} onChange={(e) => updateSetting('site_description', e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Hero Heading</Label>
                <Input value={settings.site_hero_heading || ''} onChange={(e) => updateSetting('site_hero_heading', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hero Description</Label>
                <p className="text-xs text-gray-500">Also displayed in the footer section</p>
                <Textarea value={settings.site_hero_description || ''} onChange={(e) => updateSetting('site_hero_description', e.target.value)} rows={3} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900 text-lg">Contact Details</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={settings.site_phone || ''} onChange={(e) => updateSetting('site_phone', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={settings.site_email || ''} onChange={(e) => updateSetting('site_email', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea value={settings.site_address || ''} onChange={(e) => updateSetting('site_address', e.target.value)} rows={2} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Facebook className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900 text-lg">Social Media & Map</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Facebook Page URL</Label>
                <Input value={settings.site_facebook || ''} onChange={(e) => updateSetting('site_facebook', e.target.value)} placeholder="https://web.facebook.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Google Maps Embed URL</Label>
                <Input value={settings.site_maps_embed || ''} onChange={(e) => updateSetting('site_maps_embed', e.target.value)} placeholder="https://www.google.com/maps/embed?..." />
              </div>
              {settings.site_maps_embed && (
                <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                  <iframe
                    src={settings.site_maps_embed}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Maps Preview"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900 text-lg">Images</h3>
            </div>
            <div className="space-y-4">
              <ImageUpload
                value={settings.logo_image || ''}
                onChange={(url) => updateSetting('logo_image', url)}
                aspectRatio="1:1"
                label="Logo Image"
              />
              <ImageUpload
                value={settings.hero_image || ''}
                onChange={(url) => updateSetting('hero_image', url)}
                aspectRatio="16:9"
                label="Hero Banner Image"
              />
            </div>
          </CardContent>
        </Card>

        {/* Team Management */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-gray-900 text-lg">Management Team</h3>
              </div>
              {isAdmin && (
                <Button
                  onClick={() => setAddStaffOpen(true)}
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Add Staff
                </Button>
              )}
            </div>
            {teamLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              </div>
            ) : teamMembers.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No team members found.</p>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-orange-600 font-bold text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        member.role === 'admin'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                      {member.role !== 'admin' && isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setDeleteTarget(member); setDeleteConfirmOpen(true) }}
                          className="text-gray-400 hover:text-red-500 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Admin Password */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900 text-lg">Change Admin Password</h3>
            </div>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {isAdmin && (
                <Button
                  onClick={handleChangePassword}
                  disabled={passwordLoading}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-semibold"
                >
                  {passwordLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                  Update Password
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save button at bottom */}
      {isAdmin && (
        <div className="mt-6 flex justify-end pb-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save All Changes
          </Button>
        </div>
      )}

      {/* Add Staff Dialog */}
      <Dialog open={addStaffOpen} onOpenChange={setAddStaffOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Add Staff Member</DialogTitle>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="Juan Dela Cruz" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="staff@email.com" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showStaffPassword ? 'text' : 'password'}
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowStaffPassword(!showStaffPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-700">
                Staff accounts have limited access: they can manage Events, Race Results, and Registrations only. They cannot access Settings, Users, Merchandise, or Reports.
              </p>
            </div>
            <Button
              onClick={handleAddStaff}
              disabled={staffLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold"
            >
              {staffLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Create Staff Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Remove Team Member</DialogTitle>
          <div className="mt-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Remove {deleteTarget?.name}?</p>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
              <Button
                onClick={handleDeleteMember}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

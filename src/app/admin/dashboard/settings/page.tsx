'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Save, Globe, Phone, Mail, MapPin, ImageIcon, Facebook } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ImageUpload from '@/components/ImageUpload'

interface Settings {
  [key: string]: string
}

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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

  useEffect(() => { fetchSettings() }, [])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage site configuration</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* General Info */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
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
                <Label>Site Tagline</Label>
                <Input value={settings.site_tagline || ''} onChange={(e) => updateSetting('site_tagline', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Site Description</Label>
                <Textarea value={settings.site_description || ''} onChange={(e) => updateSetting('site_description', e.target.value)} rows={3} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900 text-lg">Contact Details</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label><Phone className="w-3 h-3 inline mr-1" />Phone</Label>
                  <Input value={settings.site_phone || ''} onChange={(e) => updateSetting('site_phone', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label><Mail className="w-3 h-3 inline mr-1" />Email</Label>
                  <Input value={settings.site_email || ''} onChange={(e) => updateSetting('site_email', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label><MapPin className="w-3 h-3 inline mr-1" />Address</Label>
                <Textarea value={settings.site_address || ''} onChange={(e) => updateSetting('site_address', e.target.value)} rows={2} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Facebook className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900 text-lg">Social Media</h3>
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
          <CardContent className="p-6">
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
      </div>

      {/* Save button at bottom */}
      <div className="mt-6 flex justify-end">
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
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, RefreshCw, Settings } from 'lucide-react'

interface Setting {
  id: string
  key: string
  value: string
  createdAt: string
  updatedAt: string
}

export default function DevSettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin-developer/settings')
      const data = await res.json()
      setSettings(data)
      // Initialize edited values
      const initial: Record<string, string> = {}
      data.forEach((s: Setting) => {
        initial[s.id] = s.value
      })
      setEditedValues(initial)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleValueChange = (id: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [id]: value }))
  }

  const hasChanges = () => {
    return settings.some(s => editedValues[s.id] !== s.value)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Only send changed settings
      const changed = settings
        .filter(s => editedValues[s.id] !== s.value)
        .map(s => ({ id: s.id, value: editedValues[s.id] }))

      if (changed.length === 0) {
        toast({ title: 'No changes', description: 'No settings have been modified.' })
        setSaving(false)
        return
      }

      const res = await fetch('/api/admin-developer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changed),
      })

      if (!res.ok) {
        const data = await res.json()
        toast({
          title: 'Save Failed',
          description: data.error || 'Failed to save settings',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Settings Saved',
          description: `${changed.length} setting(s) updated successfully`,
        })
        await fetchSettings()
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="w-8 h-8 text-teal-500" />
            Settings
          </h1>
          <p className="text-gray-500 mt-1">Manage system configuration values</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchSettings} variant="outline" className="font-semibold border-teal-200 text-teal-600 hover:bg-teal-50">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges()}
            className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-teal-500" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="w-[180px]">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-gray-400">
                      <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No settings found.
                    </TableCell>
                  </TableRow>
                ) : (
                  settings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell>
                        <span className="font-mono text-sm font-medium text-gray-900">{setting.key}</span>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editedValues[setting.id] ?? setting.value}
                          onChange={(e) => handleValueChange(setting.id, e.target.value)}
                          className="max-w-md"
                        />
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {formatDate(setting.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

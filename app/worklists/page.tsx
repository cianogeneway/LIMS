'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEffect, useState } from 'react'
import { Plus, ClipboardList } from 'lucide-react'

export default function WorklistsPage() {
  const [worklists, setWorklists] = useState<any[]>([])
  const [samples, setSamples] = useState<any[]>([])
  const [instruments, setInstruments] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instrumentId: '',
  })

  useEffect(() => {
    fetchWorklists()
    fetchSamples()
    fetchInstruments()
  }, [])

  const fetchWorklists = async () => {
    const res = await fetch('/api/worklists')
    const data = await res.json()
    setWorklists(data)
  }

  const fetchSamples = async () => {
    const res = await fetch('/api/samples?status=ACCEPTED')
    const data = await res.json()
    setSamples(data)
  }

  const handleAddSamples = async (worklistId: string, sampleIds: string[]) => {
    const res = await fetch(`/api/worklists/${worklistId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleIds }),
    })
    if (res.ok) {
      fetchWorklists()
      fetchSamples()
    }
  }

  const handleRemoveSample = async (worklistId: string, sampleId: string) => {
    const res = await fetch(`/api/worklists/${worklistId}/items?sampleId=${sampleId}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      fetchWorklists()
      fetchSamples()
    }
  }

  const fetchInstruments = async () => {
    const res = await fetch('/api/instruments')
    const data = await res.json()
    setInstruments(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/worklists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (res.ok) {
      setShowForm(false)
      setFormData({ name: '', description: '', instrumentId: '' })
      fetchWorklists()
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Worklists</h1>
            <p className="text-gray-600">Manage laboratory worklists</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Worklist
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>New Worklist</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instrument</Label>
                  <Select
                    value={formData.instrumentId}
                    onValueChange={(value) => setFormData({ ...formData, instrumentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select instrument" />
                    </SelectTrigger>
                    <SelectContent>
                      {instruments.map((instrument) => (
                        <SelectItem key={instrument.id} value={instrument.id}>
                          {instrument.name} - {instrument.serialNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create Worklist</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {worklists.map((worklist) => (
            <Card key={worklist.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    <CardTitle className="text-lg">{worklist.name}</CardTitle>
                  </div>
                  <span className="text-sm text-gray-500">{worklist.status}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Description:</span> {worklist.description || 'N/A'}</p>
                  {worklist.instrument && (
                    <p><span className="font-medium">Instrument:</span> {worklist.instrument.name}</p>
                  )}
                  <p><span className="font-medium">Items:</span> {worklist.items?.length || 0}</p>
                  <p><span className="font-medium">Created:</span> {new Date(worklist.createdAt).toLocaleDateString()}</p>
                  
                  {worklist.items && worklist.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="font-medium mb-2">Samples in worklist:</p>
                      <div className="space-y-1">
                        {worklist.items.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span>{item.sampleId || item.sampleKitId || 'Unknown'}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveSample(worklist.id, item.sampleId)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {samples.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="font-medium mb-2">Add samples:</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {samples.map((sample) => (
                          <div key={sample.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span>{sample.sampleId || sample.sampleKitId || 'Unknown'}</span>
                            <Button
                              size="sm"
                              onClick={() => handleAddSamples(worklist.id, [sample.id])}
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}



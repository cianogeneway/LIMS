'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEffect, useState, useRef } from 'react'
import { Plus, Wrench, AlertTriangle, Edit, Trash2, Calendar, Clock, Upload, MapPin, DollarSign, Building2 } from 'lucide-react'
import Link from 'next/link'
import { Pagination } from '@/components/ui/pagination'

export default function InstrumentsPage() {
  const [instruments, setInstruments] = useState<any[]>([])
  const [total, setTotal] = useState<number>(0)
  const [showForm, setShowForm] = useState(false)
  const [editingInstrument, setEditingInstrument] = useState<any | null>(null)
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null)
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([])
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false)
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenanceType: '',
    notes: '',
  })
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    serviceDate: '',
    calibrationDate: '',
  })
  const [page, setPage] = useState<number>(1)
  const pageSize = 10
  const [query, setQuery] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<number | null>(null)

  useEffect(() => {
    fetchInstruments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, query])

  const fetchInstruments = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    if (query) params.set('q', query)
    const res = await fetch(`/api/instruments?${params.toString()}`)
    const payload = await res.json()
    setInstruments(payload.data || [])
    setTotal(payload.total || 0)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingInstrument) {
      const res = await fetch(`/api/instruments/${editingInstrument.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          serviceDate: formData.serviceDate || undefined,
          calibrationDate: formData.calibrationDate || undefined,
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setEditingInstrument(null)
        setFormData({ name: '', serialNumber: '', serviceDate: '', calibrationDate: '' })
        fetchInstruments()
      }
    } else {
      const res = await fetch('/api/instruments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          serviceDate: formData.serviceDate || undefined,
          calibrationDate: formData.calibrationDate || undefined,
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({ name: '', serialNumber: '', serviceDate: '', calibrationDate: '' })
        fetchInstruments()
      }
    }
  }

  const handleEditClick = (instrument: any) => {
    setEditingInstrument(instrument)
    setFormData({
      name: instrument.name,
      serialNumber: instrument.serialNumber || '',
      serviceDate: instrument.serviceDate ? new Date(instrument.serviceDate).toISOString().split('T')[0] : '',
      calibrationDate: instrument.calibrationDate ? new Date(instrument.calibrationDate).toISOString().split('T')[0] : '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this instrument?')) return
    
    const res = await fetch(`/api/instruments/${id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      fetchInstruments()
    }
  }

  const fetchMaintenanceLogs = async (instrumentId: string) => {
    const res = await fetch(`/api/instruments/${instrumentId}/maintenance`)
    const data = await res.json()
    setMaintenanceLogs(data)
  }

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInstrument) return

    const res = await fetch(`/api/instruments/${selectedInstrument}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(maintenanceForm),
    })
    if (res.ok) {
      setShowMaintenanceForm(false)
      setMaintenanceForm({ maintenanceType: '', notes: '' })
      fetchMaintenanceLogs(selectedInstrument)
    }
  }

  const getServiceStatus = (serviceDate: string | null) => {
    if (!serviceDate) return null
    const date = new Date(serviceDate)
    const now = new Date()
    const monthsUntil = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
    
    if (monthsUntil < 0) return { status: 'overdue', color: 'text-red-500', label: 'Overdue' }
    if (monthsUntil <= 1) return { status: 'due', color: 'text-red-500', label: 'Due Soon' }
    if (monthsUntil <= 2) return { status: 'soon', color: 'text-yellow-500', label: 'Due in 2 months' }
    if (monthsUntil <= 3) return { status: 'upcoming', color: 'text-blue-500', label: 'Due in 3 months' }
    return null
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Instruments</h1>
            <p className="text-gray-600">Manage laboratory instruments</p>
          </div>
          <div className="flex gap-2">
            <Link href="/instruments/import">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </Link>
            <Button onClick={() => { setShowForm(true); setEditingInstrument(null); setFormData({ name: '', serialNumber: '', serviceDate: '', calibrationDate: '' }) }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Instrument
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Input
            placeholder="Search instruments by name, serial, manufacturer..."
            value={query}
            onChange={(e) => {
              const v = e.target.value
              setQuery(v)
              setPage(1)
            }}
            className="w-full max-w-md"
          />
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingInstrument ? 'Edit Instrument' : 'New Instrument'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Serial Number</Label>
                    <Input
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Service Date</Label>
                    <Input
                      type="date"
                      value={formData.serviceDate}
                      onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Calibration Date</Label>
                    <Input
                      type="date"
                      value={formData.calibrationDate}
                      onChange={(e) => setFormData({ ...formData, calibrationDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{editingInstrument ? 'Update Instrument' : 'Add Instrument'}</Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingInstrument(null); setFormData({ name: '', serialNumber: '', serviceDate: '', calibrationDate: '' }) }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Name</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Serial</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Manufacturer</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Location</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Supplier</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Service</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Insurance</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {instruments.map((instrument) => {
                    const serviceStatus = getServiceStatus(instrument.serviceDate)
                    return (
                      <tr key={instrument.id}>
                        <td className="px-4 py-3 text-sm">{instrument.name}</td>
                        <td className="px-4 py-3 text-sm">{instrument.serialNumber}</td>
                        <td className="px-4 py-3 text-sm">{instrument.manufacturer}</td>
                        <td className="px-4 py-3 text-sm">{instrument.areaOfUse}</td>
                        <td className="px-4 py-3 text-sm">{instrument.supplier}</td>
                        <td className="px-4 py-3 text-sm">
                          {instrument.serviceDate ? new Date(instrument.serviceDate).toLocaleDateString() : '-'}
                          {serviceStatus && <span className={`ml-2 ${serviceStatus.color} text-xs`}>({serviceStatus.label})</span>}
                        </td>
                        <td className="px-4 py-3 text-sm">{instrument.insuranceReplacementValue ? `R${instrument.insuranceReplacementValue.toLocaleString()}` : '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setSelectedInstrument(instrument.id); fetchMaintenanceLogs(instrument.id); setShowMaintenanceForm(true) }}>
                              <Calendar className="h-4 w-4 mr-1" />
                              Maintenance
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditClick(instrument)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(instrument.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-600">Showing {Math.min((page-1)*pageSize+1, total)} - {Math.min(page*pageSize, total)} of {total}</p>
        </div>

        <div>
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={(p: number) => setPage(p)} />
        </div>

        {showMaintenanceForm && selectedInstrument && (
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Log</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddMaintenance} className="space-y-4">
                <div className="space-y-2">
                  <Label>Maintenance Type</Label>
                  <select
                    value={maintenanceForm.maintenanceType}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenanceType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="WEEKLY">Weekly Maintenance</option>
                    <option value="MONTHLY">Monthly Maintenance</option>
                    <option value="SERVICE">Service</option>
                    <option value="CALIBRATION">Calibration</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <textarea
                    value={maintenanceForm.notes}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Log Maintenance</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowMaintenanceForm(false)
                      setSelectedInstrument(null)
                      setMaintenanceForm({ maintenanceType: '', notes: '' })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>

              {maintenanceLogs.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Maintenance History</h3>
                  <div className="space-y-2">
                    {maintenanceLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-gray-50 rounded text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{log.maintenanceType}</span>
                          <span className="text-gray-500">
                            {new Date(log.completedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {log.completedBy && (
                          <p className="text-gray-600 mt-1">By: {log.completedBy.name}</p>
                        )}
                        {log.notes && (
                          <p className="text-gray-600 mt-1">{log.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}



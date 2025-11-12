'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { AlertCircle, ChevronLeft, Save } from 'lucide-react'

interface WorklistRow {
  id: string
  well: number
  sampleId: string | null
  sampleName: string | null
  sex: string | null
  sampleType: string | null
  comment: string | null
  testRequested: string | null
  nanoDropNgUl: number | null
  a260_230: number | null
  a260_280: number | null
  gel: string | null
  qubitNgUl: number | null
  dilutionFactor: number | null
  gelDilution: number | null
  dH20Volume: number | null
  loadingDyeBuffer: number | null
}

interface Worklist {
  id: string
  name: string
  status: string
  date: string
  performedBy: string | null
  extractionKitLot: string | null
  rows: WorklistRow[]
}

export default function WorklistDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [worklist, setWorklist] = useState<Worklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'metadata' | 'samples'>('metadata')
  const [editedRows, setEditedRows] = useState<Record<string, Partial<WorklistRow>>>({})

  useEffect(() => {
    fetchWorklist()
  }, [id])

  async function fetchWorklist() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/extraction-worklists/${id}`)
      if (!response.ok) throw new Error('Failed to fetch worklist')
      const data = await response.json()
      setWorklist(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading worklist')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!worklist || Object.keys(editedRows).length === 0) return

    try {
      setSaving(true)
      setError(null)

      // Build updated rows with current state
      const rowsToUpdate = Object.entries(editedRows).map(([rowId, changes]) => ({
        id: rowId,
        ...worklist.rows.find(r => r.id === rowId),
        ...changes,
      }))

      const response = await fetch(`/api/extraction-worklists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: rowsToUpdate }),
      })

      if (!response.ok) throw new Error('Failed to save worklist')

      // Update local state
      setWorklist(prev => {
        if (!prev) return null
        return {
          ...prev,
          rows: prev.rows.map(row => ({
            ...row,
            ...(editedRows[row.id] || {}),
          })),
        }
      })

      setEditedRows({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving worklist')
    } finally {
      setSaving(false)
    }
  }

  function handleRowChange(rowId: string, field: string, value: any) {
    setEditedRows(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [field]: value === '' ? null : value,
      },
    }))
  }

  function getRowValue(row: WorklistRow, field: string): any {
    const fieldMap: Record<string, keyof WorklistRow> = {
      sampleId: 'sampleId',
      sampleName: 'sampleName',
      sex: 'sex',
      sampleType: 'sampleType',
      comment: 'comment',
      testRequested: 'testRequested',
      nanoDropNgUl: 'nanoDropNgUl',
      a260_230: 'a260_230',
      a260_280: 'a260_280',
      gel: 'gel',
      qubitNgUl: 'qubitNgUl',
      dilutionFactor: 'dilutionFactor',
      gelDilution: 'gelDilution',
      dH20Volume: 'dH20Volume',
      loadingDyeBuffer: 'loadingDyeBuffer',
    }

    const key = fieldMap[field]
    if (editedRows[row.id]?.hasOwnProperty(field)) {
      return editedRows[row.id][field as keyof WorklistRow] ?? ''
    }

    return row[key] ?? ''
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p className="text-gray-500">Loading worklist...</p>
        </Card>
      </div>
    )
  }

  if (!worklist) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p className="text-gray-500">Worklist not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        {Object.keys(editedRows).length > 0 && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-bold">{worklist.name}</h1>
        <p className="text-gray-500 mt-1">
          Status: <span className="font-medium">{worklist.status}</span>
        </p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('metadata')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'metadata'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Metadata
        </button>
        <button
          onClick={() => setActiveTab('samples')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'samples'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          32-Sample Grid
        </button>
      </div>

      {/* Metadata Tab */}
      {activeTab === 'metadata' && (
        <Card className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="text-lg font-medium mt-1">{worklist.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="text-lg font-medium mt-1">{worklist.status}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Date</p>
              <p className="text-lg font-medium mt-1">
                {new Date(worklist.date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Performed By</p>
              <p className="text-lg font-medium mt-1">{worklist.performedBy || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Extraction Kit Lot</p>
              <p className="text-lg font-medium mt-1">
                {worklist.extractionKitLot || '—'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Samples Grid Tab */}
      {activeTab === 'samples' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Edit sample information for all 32 wells. Click the Save Changes button when done.
          </p>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Well</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Sample ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Sample Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Sex</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Type</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">NanoDrop (ng/µL)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">A260/230</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">A260/280</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Gel</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Qubit (ng/µL)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Dilution</th>
                </tr>
              </thead>
              <tbody>
                {worklist.rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-2 font-medium text-gray-700 bg-gray-50">
                      {row.well}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={getRowValue(row, 'sampleId')}
                        onChange={(e) =>
                          handleRowChange(row.id, 'sampleId', e.target.value)
                        }
                        placeholder="-"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={getRowValue(row, 'sampleName')}
                        onChange={(e) =>
                          handleRowChange(row.id, 'sampleName', e.target.value)
                        }
                        placeholder="-"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={getRowValue(row, 'sex')}
                        onChange={(e) =>
                          handleRowChange(row.id, 'sex', e.target.value)
                        }
                        placeholder="-"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={getRowValue(row, 'sampleType')}
                        onChange={(e) =>
                          handleRowChange(row.id, 'sampleType', e.target.value)
                        }
                        placeholder="-"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={getRowValue(row, 'nanoDropNgUl') || ''}
                        onChange={(e) =>
                          handleRowChange(
                            row.id,
                            'nanoDropNgUl',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        placeholder="-"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={getRowValue(row, 'a260_230') || ''}
                        onChange={(e) =>
                          handleRowChange(
                            row.id,
                            'a260_230',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        placeholder="-"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={getRowValue(row, 'a260_280') || ''}
                        onChange={(e) =>
                          handleRowChange(
                            row.id,
                            'a260_280',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        placeholder="-"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={getRowValue(row, 'gel')}
                        onChange={(e) =>
                          handleRowChange(row.id, 'gel', e.target.value)
                        }
                        placeholder="-"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={getRowValue(row, 'qubitNgUl') || ''}
                        onChange={(e) =>
                          handleRowChange(
                            row.id,
                            'qubitNgUl',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        placeholder="-"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={getRowValue(row, 'dilutionFactor') || ''}
                        onChange={(e) =>
                          handleRowChange(
                            row.id,
                            'dilutionFactor',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        placeholder="-"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {Object.keys(editedRows).length > 0 && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

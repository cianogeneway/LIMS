'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, AlertCircle } from 'lucide-react'

export default function ReferenceRangesPage() {
  const [ranges, setRanges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [formData, setFormData] = useState({
    testName: '',
    testCode: '',
    parameterName: '',
    minValue: '',
    maxValue: '',
    unit: '',
    ageGroup: 'Adult',
    gender: 'All',
    interpretation: '',
    criticalLow: '',
    criticalHigh: '',
    category: '',
    isActive: true,
  })

  const categories = [
    'Hematology',
    'Chemistry',
    'Immunology',
    'Genomics',
    'Microbiology',
    'Pathology',
  ]

  useEffect(() => {
    fetchRanges()
  }, [filterCategory])

  const fetchRanges = async () => {
    try {
      const url = filterCategory 
        ? `/api/reference-ranges?category=${filterCategory}`
        : '/api/reference-ranges'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setRanges(data)
      }
    } catch (error) {
      console.error('Error fetching reference ranges:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const res = await fetch('/api/reference-ranges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          minValue: formData.minValue ? parseFloat(formData.minValue) : null,
          maxValue: formData.maxValue ? parseFloat(formData.maxValue) : null,
          criticalLow: formData.criticalLow ? parseFloat(formData.criticalLow) : null,
          criticalHigh: formData.criticalHigh ? parseFloat(formData.criticalHigh) : null,
        }),
      })

      if (res.ok) {
        setShowForm(false)
        fetchRanges()
        // Reset form
        setFormData({
          testName: '',
          testCode: '',
          parameterName: '',
          minValue: '',
          maxValue: '',
          unit: '',
          ageGroup: 'Adult',
          gender: 'All',
          interpretation: '',
          criticalLow: '',
          criticalHigh: '',
          category: '',
          isActive: true,
        })
      }
    } catch (error) {
      console.error('Error creating reference range:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reference range?')) return

    try {
      const res = await fetch(`/api/reference-ranges?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchRanges()
      }
    } catch (error) {
      console.error('Error deleting reference range:', error)
    }
  }

  const getCriticalStatus = (value: number, range: any) => {
    if (!value) return null
    
    if (range.CriticalLow && value < range.CriticalLow) {
      return <span className="text-red-600 font-bold">⚠ CRITICAL LOW</span>
    }
    if (range.CriticalHigh && value > range.CriticalHigh) {
      return <span className="text-red-600 font-bold">⚠ CRITICAL HIGH</span>
    }
    if (range.MinValue && value < range.MinValue) {
      return <span className="text-orange-600">↓ Below Range</span>
    }
    if (range.MaxValue && value > range.MaxValue) {
      return <span className="text-orange-600">↑ Above Range</span>
    }
    return <span className="text-green-600">✓ Normal</span>
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reference Ranges</h1>
          <p className="text-gray-600">Manage test limits and interpretations</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          Add Reference Range
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Filter by Category</label>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Reference Range</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Test Name *</label>
                  <input
                    required
                    value={formData.testName}
                    onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., Complete Blood Count"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Test Code</label>
                  <input
                    value={formData.testCode}
                    onChange={(e) => setFormData({ ...formData, testCode: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., CBC"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Parameter Name *</label>
                  <input
                    required
                    value={formData.parameterName}
                    onChange={(e) => setFormData({ ...formData, parameterName: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., Hemoglobin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <input
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., g/dL"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Min Value</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.minValue}
                    onChange={(e) => setFormData({ ...formData, minValue: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Max Value</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.maxValue}
                    onChange={(e) => setFormData({ ...formData, maxValue: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Critical Low</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.criticalLow}
                    onChange={(e) => setFormData({ ...formData, criticalLow: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Critical High</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.criticalHigh}
                    onChange={(e) => setFormData({ ...formData, criticalHigh: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Age Group</label>
                  <select
                    value={formData.ageGroup}
                    onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="Adult">Adult</option>
                    <option value="Pediatric">Pediatric</option>
                    <option value="Infant">Infant</option>
                    <option value="All">All Ages</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="All">All</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Interpretation</label>
                  <textarea
                    value={formData.interpretation}
                    onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    placeholder="Describe what values mean, clinical significance, etc."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Add Range
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parameter</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Range</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Critical</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age/Gender</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interpretation</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ranges.map((range) => (
              <tr key={range.Id}>
                <td className="px-4 py-4">
                  <div className="font-medium">{range.TestName}</div>
                  {range.TestCode && <div className="text-sm text-gray-500">{range.TestCode}</div>}
                </td>
                <td className="px-4 py-4">{range.ParameterName}</td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {range.MinValue !== null && range.MaxValue !== null ? (
                    <span>{range.MinValue} - {range.MaxValue} {range.Unit}</span>
                  ) : range.MinValue !== null ? (
                    <span>≥ {range.MinValue} {range.Unit}</span>
                  ) : range.MaxValue !== null ? (
                    <span>≤ {range.MaxValue} {range.Unit}</span>
                  ) : (
                    <span className="text-gray-400">Not set</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {(range.CriticalLow !== null || range.CriticalHigh !== null) && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      {range.CriticalLow && <span>↓{range.CriticalLow}</span>}
                      {range.CriticalLow && range.CriticalHigh && <span>/</span>}
                      {range.CriticalHigh && <span>↑{range.CriticalHigh}</span>}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-sm">
                  <div>{range.AgeGroup}</div>
                  <div className="text-gray-500">{range.Gender}</div>
                </td>
                <td className="px-4 py-4">
                  {range.Category && (
                    <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                      {range.Category}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 max-w-xs">
                  <p className="text-sm text-gray-600 truncate">{range.Interpretation}</p>
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => handleDelete(range.Id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {ranges.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No reference ranges yet. Add your first range to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}

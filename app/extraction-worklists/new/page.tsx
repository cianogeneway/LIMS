'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { AlertCircle, ChevronLeft } from 'lucide-react'

export default function NewWorklistPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: 'DNA Extraction Worklist',
    performedBy: '',
    extractionKitLot: '',
    date: new Date().toISOString().split('T')[0],
    qubitMixX1: '1',
    qubitMixXn4: '4',
    qubitReagent: '1',
    qubitBuffer: '199',
    kitLot: '',
    kitExpiryDate: '',
    aliquoteInfo: 'Aliquote 198ul and 2ul DNA',
    standardsInfo: 'Standards 190ul, 10ul Standard',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/extraction-worklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || 'DNA Extraction Worklist',
          performedBy: formData.performedBy || null,
          extractionKitLot: formData.extractionKitLot || null,
          date: new Date(formData.date),
          qubitMixX1: parseInt(formData.qubitMixX1),
          qubitMixXn4: parseInt(formData.qubitMixXn4),
          qubitReagent: parseInt(formData.qubitReagent),
          qubitBuffer: parseInt(formData.qubitBuffer),
          kitLot: formData.kitLot || null,
          kitExpiryDate: formData.kitExpiryDate ? new Date(formData.kitExpiryDate) : null,
          aliquoteInfo: formData.aliquoteInfo,
          standardsInfo: formData.standardsInfo,
        }),
      })

      if (!response.ok) throw new Error('Failed to create worklist')

      const result = await response.json()
      router.push(`/extraction-worklists/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating worklist')
    } finally {
      setLoading(false)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
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

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Worklist</h1>
        <p className="text-gray-500 mt-2">
          Set up a new automated DNA extraction 32-format worklist
        </p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200 flex gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Worklist Name
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="DNA Extraction Worklist"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <Input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Performed By
                  </label>
                  <Input
                    type="text"
                    name="performedBy"
                    value={formData.performedBy}
                    onChange={handleInputChange}
                    placeholder="Your name"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Extraction Kit Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Extraction Kit Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kit Lot
                  </label>
                  <Input
                    type="text"
                    name="kitLot"
                    value={formData.kitLot}
                    onChange={handleInputChange}
                    placeholder="e.g., KIT123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kit Expiry Date
                  </label>
                  <Input
                    type="date"
                    name="kitExpiryDate"
                    value={formData.kitExpiryDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Extraction Kit Lot (Reference)
                </label>
                <Input
                  type="text"
                  name="extractionKitLot"
                  value={formData.extractionKitLot}
                  onChange={handleInputChange}
                  placeholder="Kit lot reference"
                />
              </div>
            </div>
          </div>

          {/* Qubit Mix Configuration */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Qubit Mix Configuration</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qubit Mix X1 (µL)
                  </label>
                  <Input
                    type="number"
                    name="qubitMixX1"
                    value={formData.qubitMixX1}
                    onChange={handleInputChange}
                    defaultValue="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qubit Mix Xn+4 (µL)
                  </label>
                  <Input
                    type="number"
                    name="qubitMixXn4"
                    value={formData.qubitMixXn4}
                    onChange={handleInputChange}
                    placeholder="4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qubit Reagent (µL)
                  </label>
                  <Input
                    type="number"
                    name="qubitReagent"
                    value={formData.qubitReagent}
                    onChange={handleInputChange}
                    defaultValue="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qubit Buffer (µL)
                  </label>
                  <Input
                    type="number"
                    name="qubitBuffer"
                    value={formData.qubitBuffer}
                    onChange={handleInputChange}
                    defaultValue="199"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aliquote Information
                </label>
                <textarea
                  name="aliquoteInfo"
                  value={formData.aliquoteInfo}
                  onChange={handleInputChange}
                  placeholder="e.g., Aliquote 198ul and 2ul DNA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Standards Information
                </label>
                <textarea
                  name="standardsInfo"
                  value={formData.standardsInfo}
                  onChange={handleInputChange}
                  placeholder="e.g., Standards 190ul, 10ul Standard"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Creating...' : 'Create Worklist'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

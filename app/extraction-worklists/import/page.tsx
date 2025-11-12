'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, ChevronLeft, Upload, FileText, CheckCircle2 } from 'lucide-react'

export default function ImportWorklistPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [worklistName, setWorklistName] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type (TSV or CSV)
      const validTypes = ['text/tab-separated-values', 'text/tsv', 'text/csv', 'text/plain']
      const isValidExtension = selectedFile.name.match(/\.(tsv|csv|txt)$/i)
      
      if (!validTypes.includes(selectedFile.type) && !isValidExtension) {
        setError('Please select a valid TSV or CSV file')
        return
      }

      setFile(selectedFile)
      setError(null)
      setSuccess(false)
      
      // Suggest a name based on filename
      const baseName = selectedFile.name.replace(/\.(tsv|csv|txt)$/i, '')
      setWorklistName(baseName)
    }
  }

  async function handleUpload() {
    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', worklistName || file.name)

      const response = await fetch('/api/extraction-worklists/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to import worklist')
      }

      const result = await response.json()
      setSuccess(true)

      // Redirect to the created worklist after a short delay
      setTimeout(() => {
        router.push(`/extraction-worklists/${result.id}`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error importing worklist')
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-3xl font-bold">Import Extraction Worklist</h1>
        <p className="text-gray-500 mt-2">
          Upload a TSV file to create a new DNA extraction worklist
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

      {success && (
        <Card className="p-4 bg-green-50 border-green-200 flex gap-3 mb-6">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-800">Success</p>
            <p className="text-green-700 text-sm">Worklist imported successfully! Redirecting...</p>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select TSV File
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".tsv,.csv,.txt"
                      className="sr-only"
                      onChange={handleFileChange}
                      disabled={loading || success}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  TSV, CSV or TXT file up to 10MB
                </p>
              </div>
            </div>
          </div>

          {/* Selected File Info */}
          {file && (
            <Card className="p-4 bg-gray-50 border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Worklist Name */}
          {file && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Worklist Name
              </label>
              <input
                type="text"
                value={worklistName}
                onChange={(e) => setWorklistName(e.target.value)}
                placeholder="Enter worklist name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading || success}
              />
            </div>
          )}

          {/* Format Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Expected Format</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Tab-separated values (TSV) file</li>
              <li>• Optional metadata lines: Date, Performed By, Extraction Kit Lot</li>
              <li>• Header row starting with "Well" or containing "Sample ID"</li>
              <li>• Data rows with well positions (1-32 or A01-H12)</li>
              <li>• Columns: Well, Sample ID, Client Name, and other sample details</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleUpload}
              disabled={!file || loading || success}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              {loading ? (
                <>Processing...</>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import Worklist
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading || success}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

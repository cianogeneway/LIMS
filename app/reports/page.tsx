'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BarChart3, Upload, FileText, Trash2, Download } from 'lucide-react'

interface Report {
  id: string
  name: string
  uploadedAt: string
  uploadedBy: string
  fileUrl: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    try {
      const response = await fetch('/api/reports')
      if (response.ok) {
        const result = await response.json()
        setReports(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    
    try {
      // Create a data URL for the file (in production, upload to blob storage)
      const fileUrl = URL.createObjectURL(selectedFile)
      
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedFile.name,
          fileUrl: fileUrl
        })
      })

      if (response.ok) {
        await fetchReports()
        setSelectedFile(null)
        
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      }
    } catch (error) {
      console.error('Failed to upload report:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this report?')) return
    
    try {
      const response = await fetch(`/api/reports?id=${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchReports()
      }
    } catch (error) {
      console.error('Failed to delete report:', error)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-gray-500 mt-1">
            Upload and manage laboratory reports
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Report
        </h2>
        <div className="flex gap-3">
          <Input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.xlsx,.xls,.doc,.docx"
            className="flex-1"
          />
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="bg-green-600 hover:bg-green-700"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Accepted formats: PDF, Excel, Word documents
        </p>
      </Card>

      {/* Reports List */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Uploaded Reports</h2>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No reports uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-gray-500">
                      Uploaded by {report.uploadedBy} on {new Date(report.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(report.fileUrl, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(report.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

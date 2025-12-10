'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileBarChart, Upload, FileText, Trash2, Download, CheckCircle, XCircle } from 'lucide-react'

interface QCReport {
  id: string
  name: string
  status: 'PASSED' | 'FAILED'
  uploadedAt: string
  uploadedBy: string
  fileUrl: string
}

export default function QCReportsPage() {
  const [reports, setReports] = useState<QCReport[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [qcStatus, setQcStatus] = useState<'PASSED' | 'FAILED'>('PASSED')

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    try {
      const response = await fetch('/api/qc-reports')
      if (response.ok) {
        const result = await response.json()
        setReports(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch QC reports:', error)
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
      const fileUrl = URL.createObjectURL(selectedFile)
      
      const response = await fetch('/api/qc-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedFile.name,
          status: qcStatus,
          fileUrl: fileUrl
        })
      })

      if (response.ok) {
        await fetchReports()
        setSelectedFile(null)
        
        // Reset file input
        const fileInput = document.getElementById('qc-file-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      }
    } catch (error) {
      console.error('Failed to upload QC report:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this QC report?')) return
    
    try {
      const response = await fetch(`/api/qc-reports?id=${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchReports()
      }
    } catch (error) {
      console.error('Failed to delete QC report:', error)
    }
  }

  const passedCount = reports.filter(r => r.status === 'PASSED').length
  const failedCount = reports.filter(r => r.status === 'FAILED').length

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QC Reports</h1>
          <p className="text-gray-500 mt-1">
            Upload and manage quality control reports
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Reports</p>
              <p className="text-2xl font-bold">{reports.length}</p>
            </div>
            <FileBarChart className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Passed</p>
              <p className="text-2xl font-bold text-green-600">{passedCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-red-600">{failedCount}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </Card>
      </div>

      {/* Upload Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload QC Report
        </h2>
        <div className="space-y-3">
          <div className="flex gap-3">
            <Input
              id="qc-file-upload"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.xlsx,.xls,.doc,.docx"
              className="flex-1"
            />
            <select
              value={qcStatus}
              onChange={(e) => setQcStatus(e.target.value as 'PASSED' | 'FAILED')}
              className="border rounded-md px-3 py-2"
            >
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed</option>
            </select>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Accepted formats: PDF, Excel, Word documents
          </p>
        </div>
      </Card>

      {/* QC Reports List */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">QC Reports</h2>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No QC reports uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  {report.status === 'PASSED' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-gray-500">
                      Uploaded by {report.uploadedBy} on {new Date(report.uploadedAt).toLocaleDateString()}
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${report.status === 'PASSED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {report.status}
                      </span>
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

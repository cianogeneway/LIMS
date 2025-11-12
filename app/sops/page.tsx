'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEffect, useState } from 'react'
import { Plus, FileCheck, AlertCircle, Upload, FileText, Download } from 'lucide-react'

export default function SOPsPage() {
  const [sops, setSOPs] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    version: '',
    status: 'WORKING',
    reviewDate: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchSOPs()
  }, [])

  const fetchSOPs = async () => {
    const res = await fetch('/api/sops')
    const data = await res.json()
    setSOPs(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      let fileUrl = null

      // Upload file to blob storage if provided
      if (file) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        uploadFormData.append('folder', 'sops')

        const uploadRes = await fetch('/api/blob/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        if (!uploadRes.ok) throw new Error('Failed to upload file')
        const uploadData = await uploadRes.json()
        fileUrl = uploadData.url
      }

      // Create SOP with file URL
      const res = await fetch('/api/sops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          reviewDate: formData.reviewDate || undefined,
          fileUrl,
        }),
      })

      if (res.ok) {
        setShowForm(false)
        setFormData({ title: '', version: '', status: 'WORKING', reviewDate: '' })
        setFile(null)
        fetchSOPs()
      }
    } catch (error) {
      console.error('Error creating SOP:', error)
      alert('Failed to create SOP')
    } finally {
      setUploading(false)
    }
  }

  const checkReviewDue = (nextReviewDate: string | null) => {
    if (!nextReviewDate) return false
    const review = new Date(nextReviewDate)
    const now = new Date()
    return review.getTime() <= now.getTime()
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">SOPs</h1>
            <p className="text-gray-600">Manage Standard Operating Procedures</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add SOP
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>New SOP</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Version</Label>
                    <Input
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WORKING">Working</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Next Review Date</Label>
                    <Input
                      type="date"
                      value={formData.reviewDate}
                      onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Attach Document (Optional)</Label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            className="sr-only"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, DOCX, or TXT up to 10MB
                      </p>
                    </div>
                  </div>
                  {file && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-900">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="ml-auto text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Add SOP'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {sops.map((sop) => (
            <Card key={sop.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    <CardTitle className="text-lg">{sop.title}</CardTitle>
                  </div>
                  {checkReviewDue(sop.nextReviewDate) && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Version:</span> {sop.version}</p>
                  <p><span className="font-medium">Status:</span> {sop.status}</p>
                  {sop.nextReviewDate && (
                    <p>
                      <span className="font-medium">Next Review:</span>{' '}
                      <span className={checkReviewDue(sop.nextReviewDate) ? 'text-red-500' : ''}>
                        {new Date(sop.nextReviewDate).toLocaleDateString()}
                      </span>
                    </p>
                  )}
                  {sop.fileUrl && (
                    <div className="pt-2">
                      <a
                        href={sop.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Download className="h-4 w-4" />
                        Download Document
                      </a>
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



'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { Plus, Eye, Trash2, AlertCircle, Upload } from 'lucide-react'

interface Worklist {
  id: string
  name: string
  status: string
  date: string
  performedBy: string | null
  extractionKitLot: string | null
  createdAt: string
  updatedAt: string
}

export default function WorklistsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [worklists, setWorklists] = useState<Worklist[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pageSize = 10

  useEffect(() => {
    fetchWorklists(page, searchQuery)
  }, [page, searchQuery])

  async function fetchWorklists(currentPage: number, query: string) {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(query && { q: query }),
      })

      const response = await fetch(`/api/extraction-worklists?${params}`)
      if (!response.ok) throw new Error('Failed to fetch worklists')

      const result = await response.json()
      setWorklists(result.data || [])
      setTotal(result.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading worklists')
      setWorklists([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this worklist?')) return

    try {
      setDeleting(id)
      const response = await fetch(`/api/extraction-worklists/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete worklist')
      setWorklists(worklists.filter(w => w.id !== id))
      setTotal(total - 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting worklist')
    } finally {
      setDeleting(null)
    }
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value
    setSearchQuery(query)
    setPage(1)
  }

  function handleCreateNew() {
    router.push('/extraction-worklists/new')
  }

  function handleUpload() {
    router.push('/extraction-worklists/import')
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">DNA Extraction Worklists</h1>
          <p className="text-gray-500 mt-1">
            Manage automated DNA extraction 32-format worklists
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            variant="outline"
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Worklist
          </Button>
          <Button
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            New Worklist
          </Button>
        </div>
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

      <div className="flex gap-4">
        <Input
          placeholder="Search by name, kit lot, or performed by..."
          value={searchQuery}
          onChange={handleSearch}
          className="flex-1"
        />
      </div>

      {loading && !worklists.length ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Loading worklists...</p>
        </Card>
      ) : worklists.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">
            {searchQuery ? 'No worklists found matching your search.' : 'No worklists yet.'}
          </p>
          {!searchQuery && (
            <Button
              onClick={handleCreateNew}
              variant="outline"
              className="mt-4"
            >
              Create the first worklist
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Performed By
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Kit Lot
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {worklists.map((worklist) => (
                  <tr
                    key={worklist.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {worklist.name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[worklist.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {worklist.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(worklist.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {worklist.performedBy || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {worklist.extractionKitLot || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/extraction-worklists/${worklist.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(worklist.id)}
                          disabled={deleting === worklist.id}
                          className="text-red-600 hover:text-red-700 gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          {deleting === worklist.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}

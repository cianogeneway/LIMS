'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { useEffect, useState } from 'react'
import { Plus, Building2, Edit, Trash2, Search } from 'lucide-react'

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    companyName: '',
    organisationType: '',
    vatRegistration: '',
    address: '',
    email: '',
    contactNumber: '',
    contactPerson: '',
    sampleType: '',
  })

  useEffect(() => {
    fetchClients(1, searchQuery)
  }, [searchQuery])

  const fetchClients = async (pageNum: number, search: string) => {
    const params = new URLSearchParams()
    params.set('page', String(pageNum))
    params.set('pageSize', String(pageSize))
    if (search) params.set('q', search)
    
    const res = await fetch(`/api/clients?${params.toString()}`)
    const data = await res.json()
    setClients(data.data || [])
    setTotal(data.total || 0)
    setPage(pageNum)
  }

  const handleEdit = (client: any) => {
    setEditingId(client.id)
    setFormData({
      companyName: client.companyName,
      organisationType: client.organisationType,
      vatRegistration: client.vatRegistration || '',
      address: client.address,
      email: client.email,
      contactNumber: client.contactNumber,
      contactPerson: client.contactPerson,
      sampleType: client.sampleType,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return
    
    const res = await fetch(`/api/clients/${id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      fetchClients(page, searchQuery)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingId ? `/api/clients/${editingId}` : '/api/clients'
    const method = editingId ? 'PUT' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (res.ok) {
      setShowForm(false)
      setEditingId(null)
      setFormData({
        companyName: '',
        organisationType: '',
        vatRegistration: '',
        address: '',
        email: '',
        contactNumber: '',
        contactPerson: '',
        sampleType: '',
      })
      fetchClients(1, searchQuery)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      companyName: '',
      organisationType: '',
      vatRegistration: '',
      address: '',
      email: '',
      contactNumber: '',
      contactPerson: '',
      sampleType: '',
    })
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-gray-600">Manage client information</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by company name, email, or contact person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Client' : 'New Client'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Organisation Type</Label>
                    <Select
                      value={formData.organisationType}
                      onValueChange={(value) => setFormData({ ...formData, organisationType: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NPO">NPO</SelectItem>
                        <SelectItem value="UNIVERSITY">University</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                        <SelectItem value="GOVERNMENT">Government</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>VAT Registration</Label>
                    <Input
                      value={formData.vatRegistration}
                      onChange={(e) => setFormData({ ...formData, vatRegistration: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Number</Label>
                    <Input
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Person</Label>
                    <Input
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sample Type</Label>
                    <Select
                      value={formData.sampleType}
                      onValueChange={(value) => setFormData({ ...formData, sampleType: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DE_IDENTIFIED">De-identified</SelectItem>
                        <SelectItem value="KNOWN">Known</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{editingId ? 'Update Client' : 'Create Client'}</Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Samples</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="h-5 w-5 mr-2 text-gray-400" />
                          <div className="text-sm font-medium text-gray-900">{client.companyName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.organisationType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.contactPerson}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.contactNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client._count?.samples || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(client)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(client.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {clients.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} clients
          </div>
          {total > pageSize && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={(newPage) => fetchClients(newPage, searchQuery)}
            />
          )}
        </div>
      </div>
    </MainLayout>
  )
}

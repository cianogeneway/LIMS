'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pagination } from '@/components/ui/pagination'
import { useEffect, useState } from 'react'
import { Plus, ShoppingCart, Edit, Trash2, Search } from 'lucide-react'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  })

  useEffect(() => {
    fetchSuppliers(1, searchQuery)
  }, [searchQuery])

  const fetchSuppliers = async (pageNum: number, search: string) => {
    const params = new URLSearchParams()
    params.set('page', String(pageNum))
    params.set('pageSize', String(pageSize))
    if (search) params.set('q', search)
    
    const res = await fetch(`/api/suppliers?${params.toString()}`)
    const data = await res.json()
    setSuppliers(data.data || [])
    setTotal(data.total || 0)
    setPage(pageNum)
  }

  const handleEdit = (supplier: any) => {
    setEditingId(supplier.id)
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return
    
    const res = await fetch(`/api/suppliers/${id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      fetchSuppliers(page, searchQuery)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingId) {
      const res = await fetch(`/api/suppliers/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        handleCancel()
        fetchSuppliers(1, searchQuery)
      }
    } else {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        handleCancel()
        fetchSuppliers(1, searchQuery)
      }
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Suppliers</h1>
            <p className="text-slate-600 mt-1">Manage supplier information</p>
          </div>
          <Button 
            onClick={() => {
              setEditingId(null)
              setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '' })
              setShowForm(true)
            }}
            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or contact person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {showForm && (
          <Card className="border-slate-200/60 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">
                {editingId ? 'Edit Supplier' : 'New Supplier'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">Contact Person</Label>
                    <Input
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-700 font-semibold">Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="submit"
                    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                  >
                    {editingId ? 'Update Supplier' : 'Add Supplier'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-200/60 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Contact Person</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ShoppingCart className="h-5 w-5 mr-2 text-slate-400" />
                          <div className="text-sm font-medium text-slate-900">{supplier.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{supplier.contactPerson || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{supplier.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{supplier.phone || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{supplier.address || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(supplier)}
                            className="hover:bg-green-50 hover:border-green-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(supplier.id)}
                            className="hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {suppliers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                        No suppliers found. Click "Add Supplier" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {suppliers.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} suppliers
          </div>
          {total > pageSize && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={(newPage) => fetchSuppliers(newPage, searchQuery)}
            />
          )}
        </div>
      </div>
    </MainLayout>
  )
}



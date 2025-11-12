'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { useEffect, useState } from 'react'
import { Plus, Users, Edit, Trash2, Search } from 'lucide-react'

const ROLES = [
  'ADMIN',
  'DIRECTOR',
  'SENIOR_MEDICAL_SCIENTIST',
  'MEDICAL_SCIENTIST',
  'MEDICAL_TECHNOLOGIST',
  'ASSISTANT',
]

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: '',
  })

  useEffect(() => {
    fetchUsers(1, searchQuery)
  }, [searchQuery])

  const fetchUsers = async (pageNum: number, search: string) => {
    const params = new URLSearchParams()
    params.set('page', String(pageNum))
    params.set('pageSize', String(pageSize))
    if (search) params.set('q', search)
    
    const res = await fetch(`/api/users?${params.toString()}`)
    const data = await res.json()
    setUsers(data.data || [])
    setTotal(data.total || 0)
    setPage(pageNum)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingUser) {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setShowForm(false)
        setEditingUser(null)
        setFormData({ email: '', password: '', name: '', role: '' })
        fetchUsers(1, searchQuery)
      }
    } else {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({ email: '', password: '', name: '', role: '' })
        fetchUsers(1, searchQuery)
      }
    }
  }

  const handleEditClick = (user: any) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      password: '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      fetchUsers(page, searchQuery)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-gray-600">Manage system users</p>
          </div>
          <Button onClick={() => { setShowForm(true); setEditingUser(null); setFormData({ email: '', password: '', name: '', role: '' }) }}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by email, name, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingUser ? 'Edit User' : 'New User'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
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
                    <Label>Password{editingUser && ' (leave blank to keep current)'}</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{editingUser ? 'Update User' : 'Create User'}</Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingUser(null); setFormData({ email: '', password: '', name: '', role: '' }) }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <CardTitle className="text-lg">{user.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Email:</span> {user.email}</p>
                  <p><span className="font-medium">Role:</span> {user.role.replace(/_/g, ' ')}</p>
                  <p><span className="font-medium">Created:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(user.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {users.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} users
          </div>
          {total > pageSize && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={(newPage) => fetchUsers(newPage, searchQuery)}
            />
          )}
        </div>
      </div>
    </MainLayout>
  )
}



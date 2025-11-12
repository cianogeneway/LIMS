'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { useEffect, useState } from 'react'
import { Plus, Package, AlertCircle, Box, Search } from 'lucide-react'

export default function StockPage() {
  const [stockItems, setStockItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [stockBatches, setStockBatches] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showReceiveForm, setShowReceiveForm] = useState(false)
  const [selectedStockItem, setSelectedStockItem] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    supplierId: '',
    currentPrice: '',
    unit: '',
  })
  const [receiveForm, setReceiveForm] = useState({
    stockItemId: '',
    lotNumber: '',
    expiryDate: '',
    receivedDate: '',
    quantity: '',
  })

  const fetchStockItems = async (pageNum: number, search: string) => {
    const params = new URLSearchParams()
    params.set('page', String(pageNum))
    params.set('pageSize', String(pageSize))
    if (search) params.set('q', search)
    
    const res = await fetch(`/api/stock?${params.toString()}`)
    const data = await res.json()
    setStockItems(data.data || [])
    setTotal(data.total || 0)
    setPage(pageNum)
  }

  const fetchSuppliers = async () => {
    const res = await fetch('/api/suppliers?page=1&pageSize=1000')
    const data = await res.json()
    setSuppliers(data.data || [])
  }

  const fetchStockBatches = async () => {
    const res = await fetch('/api/stock/batches')
    const data = await res.json()
    setStockBatches(data)
  }

  useEffect(() => {
    fetchStockItems(1, searchQuery)
    fetchSuppliers()
    fetchStockBatches()
  }, [searchQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        currentPrice: parseFloat(formData.currentPrice),
      }),
    })
    if (res.ok) {
      setShowForm(false)
      setFormData({ name: '', code: '', supplierId: '', currentPrice: '', unit: '' })
      fetchStockItems(page, searchQuery)
    }
  }

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/stock/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...receiveForm,
        quantity: parseInt(receiveForm.quantity),
      }),
    })
    if (res.ok) {
      setShowReceiveForm(false)
      setReceiveForm({ stockItemId: '', lotNumber: '', expiryDate: '', receivedDate: '', quantity: '' })
      fetchStockItems(page, searchQuery)
      fetchStockBatches()
    }
  }

  const handleOpenBatch = async (batchId: string) => {
    if (!confirm('Mark this batch as opened?')) return
    
    const res = await fetch(`/api/stock/batches/${batchId}/open`, {
      method: 'POST',
    })
    if (res.ok) {
      fetchStockBatches()
      fetchStockItems(page, searchQuery)
    }
  }

  const checkExpiring = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const daysUntil = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return daysUntil <= 30 && daysUntil > 0
  }

  const getBatchesForItem = (itemId: string) => {
    return stockBatches.filter(batch => batch.stockItemId === itemId)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stock Management</h1>
            <p className="text-gray-600">Manage laboratory stock and reagents</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setShowReceiveForm(true); setReceiveForm({ stockItemId: '', lotNumber: '', expiryDate: '', receivedDate: new Date().toISOString().split('T')[0], quantity: '' }) }}>
              <Box className="h-4 w-4 mr-2" />
              Receive Stock
            </Button>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Stock Item
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>New Stock Item</CardTitle>
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
                    <Label>Code</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Supplier</Label>
                    <Select
                      value={formData.supplierId}
                      onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Current Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.currentPrice}
                      onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Add Stock Item</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {showReceiveForm && (
          <Card>
            <CardHeader>
              <CardTitle>Receive Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReceiveStock} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Stock Item</Label>
                    <Select
                      value={receiveForm.stockItemId}
                      onValueChange={(value) => setReceiveForm({ ...receiveForm, stockItemId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stock item" />
                      </SelectTrigger>
                      <SelectContent>
                        {stockItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} {item.code && `(${item.code})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Lot Number</Label>
                    <Input
                      value={receiveForm.lotNumber}
                      onChange={(e) => setReceiveForm({ ...receiveForm, lotNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={receiveForm.expiryDate}
                      onChange={(e) => setReceiveForm({ ...receiveForm, expiryDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Received Date</Label>
                    <Input
                      type="date"
                      value={receiveForm.receivedDate}
                      onChange={(e) => setReceiveForm({ ...receiveForm, receivedDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={receiveForm.quantity}
                      onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Receive Stock</Button>
                  <Button type="button" variant="outline" onClick={() => setShowReceiveForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {stockItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                  </div>
                  {item.stockBatches?.some((batch: any) => checkExpiring(batch.expiryDate)) && (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Code:</span> {item.code || 'N/A'}</p>
                  <p><span className="font-medium">Supplier:</span> {item.supplier.name}</p>
                  <p><span className="font-medium">Price:</span> R{item.currentPrice.toFixed(2)}</p>
                  <p><span className="font-medium">Batches:</span> {getBatchesForItem(item.id).length}</p>
                  {getBatchesForItem(item.id).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {getBatchesForItem(item.id).map((batch: any) => (
                        <div key={batch.id} className="flex items-center justify-between rounded border p-2">
                          <div className="flex-1">
                            <p className="font-medium">Lot: {batch.lotNumber}</p>
                            <p className="text-xs">
                              Expiry: {new Date(batch.expiryDate).toLocaleDateString()}
                              {checkExpiring(batch.expiryDate) && (
                                <span className="ml-2 text-yellow-600">Expiring Soon!</span>
                              )}
                            </p>
                            <p className="text-xs">
                              Received: {new Date(batch.receivedDate).toLocaleDateString()}
                              {batch.openedDate && (
                                <span className="ml-2 text-green-600">Opened: {new Date(batch.openedDate).toLocaleDateString()}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs">Qty: {batch.remainingQuantity}/{batch.quantity}</p>
                            {!batch.openedDate && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenBatch(batch.id)}
                              >
                                <Box className="h-3 w-3 mr-1" />
                                Open
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {stockItems.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} stock items
          </div>
          {total > pageSize && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={(newPage) => fetchStockItems(newPage, searchQuery)}
            />
          )}
        </div>
      </div>
    </MainLayout>
  )
}



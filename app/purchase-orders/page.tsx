'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { Plus, FileText } from 'lucide-react'

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])

  useEffect(() => {
    fetchPurchaseOrders()
  }, [])

  const fetchPurchaseOrders = async () => {
    const res = await fetch('/api/purchase-orders')
    const data = await res.json()
    setPurchaseOrders(data)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Purchase Orders</h1>
            <p className="text-gray-600">Manage purchase orders</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create PO
          </Button>
        </div>

        <div className="space-y-4">
          {purchaseOrders.map((po) => (
            <Card key={po.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <CardTitle className="text-lg">{po.poNumber}</CardTitle>
                  </div>
                  <span className="text-sm text-gray-500">{po.status}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Supplier:</span> {po.supplier.name}</p>
                  <p><span className="font-medium">Total:</span> R{po.totalAmount.toFixed(2)}</p>
                  <p><span className="font-medium">Created:</span> {new Date(po.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}



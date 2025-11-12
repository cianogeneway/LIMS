'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { Plus, FileText } from 'lucide-react'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    const res = await fetch('/api/invoices')
    const data = await res.json()
    setInvoices(data)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-gray-600">Manage client invoices</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate Invoice
          </Button>
        </div>

        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <CardTitle className="text-lg">{invoice.invoiceNumber}</CardTitle>
                  </div>
                  <span className="text-sm text-gray-500">{invoice.status}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Client:</span> {invoice.client.companyName}</p>
                  <p><span className="font-medium">Period:</span> {invoice.month}/{invoice.year}</p>
                  <p><span className="font-medium">Total:</span> R{invoice.totalAmount.toFixed(2)}</p>
                  <p><span className="font-medium">Created:</span> {new Date(invoice.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}


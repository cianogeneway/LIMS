'use client'

import { useState, useEffect } from 'react'
import { Plus, FileText, Trash2, Eye } from 'lucide-react'

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'DRAFT',
    currency: 'ZAR',
    notes: '',
    termsAndConditions: 'This quotation is valid for 30 days from the date of issue.',
  })
  const [items, setItems] = useState<any[]>([
    { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }
  ])

  useEffect(() => {
    fetchQuotations()
    fetchClients()
  }, [])

  const fetchQuotations = async () => {
    try {
      const res = await fetch('/api/quotations')
      if (res.ok) {
        const data = await res.json()
        setQuotations(data)
      }
    } catch (error) {
      console.error('Error fetching quotations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients?pageSize=1000')
      if (res.ok) {
        const response = await res.json()
        // API returns { data: clients[], total: number }
        setClients(Array.isArray(response.data) ? response.data : [])
      } else {
        setClients([])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients([])
    }
  }

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientId,
        clientName: client.companyName,
        clientEmail: client.email || '',
        clientAddress: client.address || '',
        currency: client.currency || 'ZAR',
      }))
    }
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }])
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index][field] = value
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice
    }
    
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    const subTotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
    const vatAmount = subTotal * 0.15 // 15% VAT
    const totalAmount = subTotal + vatAmount
    return { subTotal, vatAmount, totalAmount }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { subTotal, vatAmount, totalAmount } = calculateTotals()

    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items,
          subTotal,
          vatAmount,
          totalAmount,
        }),
      })

      if (res.ok) {
        setShowForm(false)
        fetchQuotations()
        // Reset form
        setFormData({
          clientId: '',
          clientName: '',
          clientEmail: '',
          clientAddress: '',
          quotationDate: new Date().toISOString().split('T')[0],
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'DRAFT',
          currency: 'ZAR',
          notes: '',
          termsAndConditions: 'This quotation is valid for 30 days from the date of issue.',
        })
        setItems([{ description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }])
      }
    } catch (error) {
      console.error('Error creating quotation:', error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-orange-100 text-orange-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const { subTotal, vatAmount, totalAmount } = calculateTotals()

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quotations</h1>
          <p className="text-gray-600">Generate and manage quotations for clients</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          New Quotation
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Quotation</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Client *</label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.companyName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Quotation Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.quotationDate}
                    onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Valid Until *</label>
                  <input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Line Items *</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    + Add Item
                  </button>
                </div>
                
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                    <input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="col-span-6 border rounded px-3 py-2"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="col-span-2 border rounded px-3 py-2"
                      required
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="col-span-2 border rounded px-3 py-2"
                      required
                    />
                    <div className="col-span-1 flex items-center">
                      {item.totalPrice.toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="col-span-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-4 rounded space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formData.currency} {subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (15%):</span>
                  <span className="font-medium">{formData.currency} {vatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formData.currency} {totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Terms & Conditions</label>
                <textarea
                  value={formData.termsAndConditions}
                  onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Create Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quotation #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {quotations.map((quotation) => (
              <tr key={quotation.Id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{quotation.QuotationNumber}</td>
                <td className="px-6 py-4">{quotation.ClientName}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(quotation.QuotationDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(quotation.ValidUntil).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {quotation.Currency} {parseFloat(quotation.TotalAmount).toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(quotation.Status)}`}>
                    {quotation.Status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-purple-600 hover:text-purple-700">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {quotations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No quotations yet. Create your first quotation to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}

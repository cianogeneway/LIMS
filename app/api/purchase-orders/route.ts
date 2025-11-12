export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'
import { generatePONumber } from '@/lib/utils'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await pool.connect()
    try {
      const result = await client.query(`
        SELECT 
          po.*,
          s."Name" as supplier_name
        FROM "PurchaseOrders" po
        LEFT JOIN "Suppliers" s ON s."Id" = po."SupplierId"
        ORDER BY po."CreatedAt" DESC
      `)
      
      const purchaseOrders = result.rows.map(row => ({
        id: row.Id,
        poNumber: row.PoNumber,
        supplierId: row.SupplierId,
        supplier: row.SupplierId ? {
          id: row.SupplierId,
          name: row.supplier_name,
        } : null,
        status: row.Status,
        items: typeof row.Items === 'string' ? JSON.parse(row.Items) : row.Items,
        totalAmount: parseFloat(row.TotalAmount) || 0,
        createdAt: row.CreatedAt,
        updatedAt: row.UpdatedAt,
        receivedAt: row.ReceivedAt,
        closedAt: row.ClosedAt,
        invoiceUrl: row.InvoiceUrl,
      }))

      return NextResponse.json(purchaseOrders)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Purchase orders fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const poNumber = generatePONumber()
    const client = await pool.connect()
    
    try {
      const id = crypto.randomUUID()
      const now = new Date()
      
      await client.query(`
        INSERT INTO "PurchaseOrders" (
          "Id", "PoNumber", "SupplierId", "Status", "Items", "TotalAmount",
          "CreatedAt", "UpdatedAt", "ReceivedAt", "ClosedAt", "InvoiceUrl"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        id, poNumber, data.supplierId, 'draft',
        JSON.stringify(data.items || []), data.totalAmount,
        now, now, null, null, null
      ])

      return NextResponse.json({
        id,
      poNumber,
      supplierId: data.supplierId,
      status: 'draft',
        items: data.items || [],
      totalAmount: data.totalAmount,
        createdAt: now,
        updatedAt: now,
      receivedAt: null,
      closedAt: null,
      invoiceUrl: null,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Purchase order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create purchase order' },
      { status: 500 }
    )
  }
}


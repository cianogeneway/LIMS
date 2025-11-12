export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'
import { generateInvoiceNumber } from '@/lib/utils'

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
          i.*,
          c."CompanyName", c."Email" as client_email
        FROM "Invoices" i
        LEFT JOIN "Clients" c ON c."Id" = i."ClientId"
        ORDER BY i."CreatedAt" DESC
      `)
      
      const invoices = result.rows.map(row => ({
        id: row.Id,
        invoiceNumber: row.InvoiceNumber,
        clientId: row.ClientId,
        client: row.ClientId ? {
          id: row.ClientId,
          companyName: row.CompanyName,
          email: row.client_email,
        } : null,
        month: row.Month,
        year: row.Year,
        items: row.Items || [],
        totalAmount: parseFloat(row.TotalAmount) || 0,
        status: row.Status,
        createdAt: row.CreatedAt,
        updatedAt: row.UpdatedAt,
        sentAt: row.SentAt,
        paidAt: row.PaidAt,
        documentUrl: row.DocumentUrl,
      }))

      return NextResponse.json(invoices)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Invoices fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
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
    const invoiceNumber = generateInvoiceNumber(data.month, data.year)
    const client = await pool.connect()
    
    try {
      const id = crypto.randomUUID()
      const now = new Date()
      
      await client.query(`
        INSERT INTO "Invoices" (
          "Id", "InvoiceNumber", "ClientId", "Month", "Year", 
          "Items", "TotalAmount", "Status", "DocumentUrl",
          "CreatedAt", "UpdatedAt", "SentAt", "PaidAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        id, invoiceNumber, data.clientId, data.month, data.year,
        JSON.stringify(data.items || []), data.totalAmount, 'draft',
        data.documentUrl || null, now, now, null, null
      ])
      
      const invoice = {
        id,
        invoiceNumber,
        clientId: data.clientId,
        month: data.month,
        year: data.year,
        items: data.items || [],
        totalAmount: data.totalAmount,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        sentAt: null,
        paidAt: null,
        documentUrl: data.documentUrl || null,
      }

      return NextResponse.json(invoice)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Invoice creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}


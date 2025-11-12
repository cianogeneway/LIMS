import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const client = await pool.connect()
    
    try {
      await client.query(`
        UPDATE "Invoices"
        SET 
          "ClientId" = $1,
          "Month" = $2,
          "Year" = $3,
          "Items" = $4,
          "TotalAmount" = $5,
          "Status" = $6,
          "DocumentUrl" = $7,
          "UpdatedAt" = $8,
          "SentAt" = $9,
          "PaidAt" = $10
        WHERE "Id" = $11
      `, [
        data.clientId, data.month, data.year,
        JSON.stringify(data.items || []), data.totalAmount, data.status,
        data.documentUrl || null, new Date(), data.sentAt || null, data.paidAt || null,
        params.id
      ])
      
      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Invoice update error:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await pool.connect()
    
    try {
      await client.query('DELETE FROM "Invoices" WHERE "Id" = $1', [params.id])
      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Invoice deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}


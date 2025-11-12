import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'
import { sendInvoiceEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Generate invoice for a client for a specific month
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId, month, year, pricePerSample } = await req.json()

    if (!clientId || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    try {
      const startOfMonth = new Date(year, month - 1, 1)
      const endOfMonth = new Date(year, month, 0, 23, 59, 59)

      // Get completed samples for the client in the specified month
      const samplesResult = await client.query(`
        SELECT COUNT(*) as count
        FROM "Samples"
        WHERE "ClientId" = $1
        AND "Status" = 'COMPLETED'
        AND "UpdatedAt" >= $2 AND "UpdatedAt" <= $3
      `, [clientId, startOfMonth, endOfMonth])

      const sampleCount = parseInt(samplesResult.rows[0].count)
      const totalAmount = sampleCount * (pricePerSample || 0)

      // Get client info
      const clientResult = await client.query(`
        SELECT * FROM "Clients" WHERE "Id" = $1
      `, [clientId])

      if (clientResult.rows.length === 0) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }

      const clientData = clientResult.rows[0]

      // Generate invoice number
      const invoiceNumber = `INV-${year}${String(month).padStart(2, '0')}-${clientData.CompanyName.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`

      // Create invoice
      const invoiceId = crypto.randomUUID()
      const now = new Date()

      const items = [{
        description: `Samples processed (${sampleCount})`,
        quantity: sampleCount,
        unitPrice: pricePerSample || 0,
        total: totalAmount,
      }]

      await client.query(`
        INSERT INTO "Invoices" (
          "Id", "InvoiceNumber", "ClientId", "Month", "Year",
          "Items", "TotalAmount", "Status", "CreatedAt", "UpdatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        invoiceId,
        invoiceNumber,
        clientId,
        month,
        year,
        JSON.stringify(items),
        totalAmount,
        'DRAFT',
        now,
        now,
      ])

      // Send email notification (if email is configured)
      if (clientData.Email) {
        await sendInvoiceEmail(
          clientData.Email,
          invoiceNumber,
          totalAmount
        )
      }

      return NextResponse.json({
        id: invoiceId,
        invoiceNumber,
        clientId,
        month,
        year,
        sampleCount,
        totalAmount,
        items,
        status: 'DRAFT',
        createdAt: now,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Invoice generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}


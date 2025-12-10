import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Client } from 'pg'

export const dynamic = 'force-dynamic'

async function getDbClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })
  await client.connect()
  return client
}

// GET all quotations
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await getDbClient()

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')

    let query = 'SELECT * FROM "Quotations"'
    const params: any[] = []
    const conditions: string[] = []

    if (status) {
      conditions.push(`"Status" = $${params.length + 1}`)
      params.push(status)
    }

    if (clientId) {
      conditions.push(`"ClientId" = $${params.length + 1}`)
      params.push(clientId)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY "QuotationDate" DESC'

    const result = await client.query(query, params)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching quotations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotations' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}

// POST - Create new quotation
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await getDbClient()

  try {
    const data = await req.json()
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    // Generate quotation number
    const countResult = await client.query('SELECT COUNT(*) FROM "Quotations"')
    const count = parseInt(countResult.rows[0].count) + 1
    const quotationNumber = `QUO-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`

    // Insert quotation
    await client.query(
      `INSERT INTO "Quotations" (
        "Id", "QuotationNumber", "ClientId", "ClientName", "ClientEmail", "ClientAddress",
        "QuotationDate", "ValidUntil", "Status", "SubTotal", "VatAmount", "TotalAmount",
        "Currency", "Notes", "TermsAndConditions", "CreatedBy", "CreatedAt", "UpdatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        id,
        quotationNumber,
        data.clientId,
        data.clientName,
        data.clientEmail || null,
        data.clientAddress || null,
        data.quotationDate,
        data.validUntil,
        data.status || 'DRAFT',
        data.subTotal || 0,
        data.vatAmount || 0,
        data.totalAmount || 0,
        data.currency || 'ZAR',
        data.notes || null,
        data.termsAndConditions || null,
        session.user?.email || 'system',
        now,
        now,
      ]
    )

    // Insert line items if provided
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        const itemId = crypto.randomUUID()
        await client.query(
          `INSERT INTO "QuotationItems" (
            "Id", "QuotationId", "Description", "Quantity", "UnitPrice", "TotalPrice",
            "CreatedAt", "UpdatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            itemId,
            id,
            item.description,
            item.quantity,
            item.unitPrice,
            item.totalPrice,
            now,
            now,
          ]
        )
      }
    }

    return NextResponse.json({ id, quotationNumber }, { status: 201 })
  } catch (error) {
    console.error('Error creating quotation:', error)
    return NextResponse.json(
      { error: 'Failed to create quotation' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}

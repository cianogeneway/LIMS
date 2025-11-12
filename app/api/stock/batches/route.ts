import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Get all stock batches
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const stockItemId = searchParams.get('stockItemId')

    const client = await pool.connect()
    
    try {
      let query = `
        SELECT 
          sb.*,
          si."Name" as stock_item_name,
          si."Code" as stock_item_code,
          u."Name" as opened_by_name
        FROM "StockBatches" sb
        JOIN "StockItems" si ON si."Id" = sb."StockItemId"
        LEFT JOIN "Users" u ON u."Id" = sb."OpenedById"
      `
      const params: any[] = []

      if (stockItemId) {
        query += ' WHERE sb."StockItemId" = $1'
        params.push(stockItemId)
      }

      query += ' ORDER BY sb."ReceivedDate" DESC'

      const result = await client.query(query, params)

      const batches = result.rows.map(row => ({
        id: row.Id,
        stockItemId: row.StockItemId,
        stockItem: {
          id: row.StockItemId,
          name: row.stock_item_name,
          code: row.stock_item_code,
        },
        lotNumber: row.LotNumber,
        expiryDate: row.ExpiryDate,
        receivedDate: row.ReceivedDate,
        openedDate: row.OpenedDate,
        openedById: row.OpenedById,
        openedBy: row.OpenedById ? {
          id: row.OpenedById,
          name: row.opened_by_name,
        } : null,
        quantity: row.Quantity,
        remainingQuantity: row.RemainingQuantity,
        createdAt: row.CreatedAt,
        updatedAt: row.UpdatedAt,
      }))

      return NextResponse.json(batches)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Stock batches fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock batches' },
      { status: 500 }
    )
  }
}

// Create new stock batch (receive stock)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const { stockItemId, lotNumber, expiryDate, receivedDate, quantity } = data

    if (!stockItemId || !lotNumber || !expiryDate || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    try {
      const id = crypto.randomUUID()
      const now = new Date()

      await client.query(`
        INSERT INTO "StockBatches" (
          "Id", "StockItemId", "LotNumber", "ExpiryDate", "ReceivedDate",
          "Quantity", "RemainingQuantity", "CreatedAt", "UpdatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        id,
        stockItemId,
        lotNumber,
        new Date(expiryDate),
        receivedDate ? new Date(receivedDate) : now,
        quantity,
        quantity, // Initially remaining equals quantity
        now,
        now,
      ])

      // Create stock log entry
      await client.query(`
        INSERT INTO "StockLogs" (
          "Id", "StockBatchId", "UserId", "Action", "Quantity", "CreatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        crypto.randomUUID(),
        id,
        session.user.id,
        'RECEIVED',
        quantity,
        now,
      ])

      return NextResponse.json({
        id,
        stockItemId,
        lotNumber,
        expiryDate,
        receivedDate: receivedDate ? new Date(receivedDate) : now,
        quantity,
        remainingQuantity: quantity,
        createdAt: now,
        updatedAt: now,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Stock batch creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create stock batch' },
      { status: 500 }
    )
  }
}


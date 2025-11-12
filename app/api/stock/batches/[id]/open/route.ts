import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Open a stock batch
export async function POST(
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
      const now = new Date()

      // Update batch to mark as opened
      await client.query(`
        UPDATE "StockBatches"
        SET 
          "OpenedDate" = $1,
          "OpenedById" = $2,
          "UpdatedAt" = $3
        WHERE "Id" = $4 AND "OpenedDate" IS NULL
      `, [now, session.user.id, now, params.id])

      // Create stock log entry
      await client.query(`
        INSERT INTO "StockLogs" (
          "Id", "StockBatchId", "UserId", "Action", "CreatedAt"
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        crypto.randomUUID(),
        params.id,
        session.user.id,
        'OPENED',
        now,
      ])

      return NextResponse.json({ success: true, openedAt: now })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Open stock batch error:', error)
    return NextResponse.json(
      { error: 'Failed to open stock batch' },
      { status: 500 }
    )
  }
}


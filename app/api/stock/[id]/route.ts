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
        UPDATE "StockItems"
        SET 
          "Name" = $1,
          "Code" = $2,
          "SupplierId" = $3,
          "CurrentPrice" = $4,
          "Unit" = $5,
          "UpdatedAt" = $6
        WHERE "Id" = $7
      `, [
        data.name, data.code || null, data.supplierId, data.currentPrice,
        data.unit || null, new Date(), params.id
      ])
      
      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Stock item update error:', error)
    return NextResponse.json(
      { error: 'Failed to update stock item' },
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
      await client.query('DELETE FROM "StockItems" WHERE "Id" = $1', [params.id])
      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Stock item deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete stock item' },
      { status: 500 }
    )
  }
}


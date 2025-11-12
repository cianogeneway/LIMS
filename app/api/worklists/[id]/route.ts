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
        UPDATE "Worklists"
        SET 
          "Name" = $1,
          "Description" = $2,
          "InstrumentId" = $3,
          "Status" = $4,
          "UpdatedAt" = $5
        WHERE "Id" = $6
      `, [
        data.name, data.description || null, data.instrumentId || null,
        data.status, new Date(), params.id
      ])
      
      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Worklist update error:', error)
    return NextResponse.json(
      { error: 'Failed to update worklist' },
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
      await client.query('DELETE FROM "Worklists" WHERE "Id" = $1', [params.id])
      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Worklist deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete worklist' },
      { status: 500 }
    )
  }
}


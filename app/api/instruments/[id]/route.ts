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
        UPDATE "Instruments"
        SET 
          "Name" = $1,
          "SerialNumber" = $2,
          "ServiceDate" = $3,
          "CalibrationDate" = $4,
          "UpdatedAt" = $5
        WHERE "Id" = $6
      `, [
        data.name,
        data.serialNumber || null,
        data.serviceDate ? new Date(data.serviceDate) : null,
        data.calibrationDate ? new Date(data.calibrationDate) : null,
        new Date(),
        params.id,
      ])
      
      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Instrument update error:', error)
    return NextResponse.json(
      { error: 'Failed to update instrument' },
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
      await client.query('DELETE FROM "Instruments" WHERE "Id" = $1', [params.id])
      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Instrument deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete instrument' },
      { status: 500 }
    )
  }
}


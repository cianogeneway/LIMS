import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'
import { sendServiceReminderEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Get maintenance logs for an instrument
export async function GET(
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
      const result = await client.query(`
        SELECT 
          ml.*,
          u."Name" as completed_by_name
        FROM "MaintenanceLogs" ml
        LEFT JOIN "Users" u ON u."Id" = ml."CompletedById"
        WHERE ml."InstrumentId" = $1
        ORDER BY ml."CompletedAt" DESC
      `, [params.id])

      const logs = result.rows.map(row => ({
        id: row.Id,
        instrumentId: row.InstrumentId,
        maintenanceType: row.MaintenanceType,
        completedById: row.CompletedById,
        completedBy: row.CompletedById ? {
          id: row.CompletedById,
          name: row.completed_by_name,
        } : null,
        completedAt: row.CompletedAt,
        notes: row.Notes,
      }))

      return NextResponse.json(logs)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Maintenance logs fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance logs' },
      { status: 500 }
    )
  }
}

// Create maintenance log
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { maintenanceType, notes } = await req.json()
    
    if (!maintenanceType) {
      return NextResponse.json(
        { error: 'Maintenance type required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    try {
      const id = crypto.randomUUID()
      const now = new Date()

      await client.query(`
        INSERT INTO "MaintenanceLogs" (
          "Id", "InstrumentId", "MaintenanceType", "CompletedById", "CompletedAt", "Notes"
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [id, params.id, maintenanceType, session.user.id, now, notes || null])

      return NextResponse.json({
        id,
        instrumentId: params.id,
        maintenanceType,
        completedById: session.user.id,
        completedAt: now,
        notes: notes || null,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Maintenance log creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create maintenance log' },
      { status: 500 }
    )
  }
}


export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'

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
          w.*,
          u."Name" as created_by_name,
          i."Name" as instrument_name,
          json_agg(
            json_build_object(
              'id', wi."Id",
              'sampleId', s."SampleId",
              'sampleKitId', s."SampleKitId",
              'position', wi."Position"
            ) ORDER BY wi."Position"
          ) FILTER (WHERE wi."Id" IS NOT NULL) as items
        FROM "Worklists" w
        LEFT JOIN "Users" u ON u."Id" = w."CreatedById"
        LEFT JOIN "Instruments" i ON i."Id" = w."InstrumentId"
        LEFT JOIN "WorklistItems" wi ON wi."WorklistId" = w."Id"
        LEFT JOIN "Samples" s ON s."Id" = wi."SampleId"
        GROUP BY w."Id", u."Name", i."Name"
        ORDER BY w."CreatedAt" DESC
      `)
      
      const worklists = result.rows.map(row => ({
        id: row.Id,
        name: row.Name,
        description: row.Description,
        createdById: row.CreatedById,
        createdBy: row.CreatedById ? {
          id: row.CreatedById,
          name: row.created_by_name,
        } : null,
        instrumentId: row.InstrumentId,
        instrument: row.InstrumentId ? {
          id: row.InstrumentId,
          name: row.instrument_name,
        } : undefined,
        status: row.Status,
        createdAt: row.CreatedAt,
        updatedAt: row.UpdatedAt,
        items: row.items || [],
      }))

      return NextResponse.json(worklists)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Worklists fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch worklists' },
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
    const client = await pool.connect()
    
    try {
      const id = crypto.randomUUID()
      const now = new Date()
      
      await client.query(`
        INSERT INTO "Worklists" ("Id", "Name", "Description", "CreatedById", "InstrumentId", "Status", "CreatedAt", "UpdatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        id, data.name, data.description || null, session.user.id, data.instrumentId || null, 'draft', now, now
      ])

      return NextResponse.json({
        id,
        name: data.name,
        description: data.description,
        createdById: session.user.id,
        instrumentId: data.instrumentId || undefined,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        items: [],
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Worklist creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create worklist' },
      { status: 500 }
    )
  }
}


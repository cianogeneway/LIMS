import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Add sample to worklist
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sampleIds } = await req.json()
    
    if (!Array.isArray(sampleIds) || sampleIds.length === 0) {
      return NextResponse.json(
        { error: 'Sample IDs array required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    try {
      // Get current max position in worklist
      const positionResult = await client.query(`
        SELECT COALESCE(MAX("Position"), 0) as max_position
        FROM "WorklistItems"
        WHERE "WorklistId" = $1
      `, [params.id])

      let position = parseInt(positionResult.rows[0].max_position) + 1
      const now = new Date()

      // Add each sample to worklist
      for (const sampleId of sampleIds) {
        const itemId = crypto.randomUUID()
        
        await client.query(`
          INSERT INTO "WorklistItems" (
            "Id", "WorklistId", "SampleId", "Position", "CreatedAt", "UpdatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [itemId, params.id, sampleId, position, now, now])

        // Update sample status
        await client.query(`
          UPDATE "Samples"
          SET "Status" = 'ADDED_TO_WORKLIST', "UpdatedAt" = $1
          WHERE "Id" = $2
        `, [now, sampleId])

        position++
      }

      // Update worklist status
      await client.query(`
        UPDATE "Worklists"
        SET "Status" = 'ACTIVE', "UpdatedAt" = $1
        WHERE "Id" = $2
      `, [now, params.id])

      return NextResponse.json({ success: true, added: sampleIds.length })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Add samples to worklist error:', error)
    return NextResponse.json(
      { error: 'Failed to add samples to worklist' },
      { status: 500 }
    )
  }
}

// Remove sample from worklist
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sampleId = searchParams.get('sampleId')

    if (!sampleId) {
      return NextResponse.json(
        { error: 'Sample ID required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    try {
      // Remove from worklist
      await client.query(`
        DELETE FROM "WorklistItems"
        WHERE "WorklistId" = $1 AND "SampleId" = $2
      `, [params.id, sampleId])

      // Update sample status back to available
      await client.query(`
        UPDATE "Samples"
        SET "Status" = 'ACCEPTED', "UpdatedAt" = $1
        WHERE "Id" = $2
      `, [new Date(), sampleId])

      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Remove sample from worklist error:', error)
    return NextResponse.json(
      { error: 'Failed to remove sample from worklist' },
      { status: 500 }
    )
  }
}


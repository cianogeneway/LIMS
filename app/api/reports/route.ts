import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await pool.connect()
    try {
      const result = await client.query(`
        SELECT * FROM "Reports"
        ORDER BY "CreatedAt" DESC
      `)

      const reports = result.rows.map(row => ({
        id: row.Id,
        name: row.Name,
        fileUrl: row.FileUrl,
        uploadedBy: row.UploadedBy,
        createdAt: row.CreatedAt,
        updatedAt: row.UpdatedAt,
      }))

      return NextResponse.json({ data: reports })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Reports fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
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
        INSERT INTO "Reports" (
          "Id", "Name", "FileUrl", "UploadedBy", "CreatedAt", "UpdatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [id, data.name, data.fileUrl, session.user?.email || 'Unknown', now, now])

      return NextResponse.json({
        id,
        name: data.name,
        fileUrl: data.fileUrl,
        uploadedBy: session.user?.email || 'Unknown',
        createdAt: now,
        updatedAt: now,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Report creation error:', error)
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const client = await pool.connect()
    try {
      await client.query('DELETE FROM "Reports" WHERE "Id" = $1', [id])
      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Report deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
  }
}

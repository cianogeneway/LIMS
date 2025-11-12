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
      const [receivedResult, worklistResult, completedResult, failedResult] = await Promise.all([
        client.query('SELECT COUNT(*) as count FROM "Samples" WHERE "Status" = $1', ['RECEIVED_BY_LAB']),
        client.query('SELECT COUNT(*) as count FROM "Worklists" WHERE "Status" != $1', ['completed']),
        client.query('SELECT COUNT(*) as count FROM "Samples" WHERE "Status" = $1', ['COMPLETED']),
        client.query('SELECT COUNT(*) as count FROM "Samples" WHERE "Status" IN ($1, $2)', ['FAILED', 'REPEAT']),
      ])

      return NextResponse.json({
        received: parseInt(receivedResult.rows[0].count) || 0,
        worklist: parseInt(worklistResult.rows[0].count) || 0,
        completed: parseInt(completedResult.rows[0].count) || 0,
        failed: parseInt(failedResult.rows[0].count) || 0,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}


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
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      // Total processed (completed samples this month)
      const totalProcessedResult = await client.query(`
        SELECT COUNT(*) as count
        FROM "Samples"
        WHERE "Status" = 'COMPLETED'
        AND "UpdatedAt" >= $1 AND "UpdatedAt" <= $2
      `, [startOfMonth, endOfMonth])

      const totalProcessed = parseInt(totalProcessedResult.rows[0].count)

      // Per client breakdown
      const perClientResult = await client.query(`
        SELECT 
          c."CompanyName",
          COUNT(s."Id") as sample_count
        FROM "Samples" s
        JOIN "Clients" c ON c."Id" = s."ClientId"
        WHERE s."Status" = 'COMPLETED'
        AND s."UpdatedAt" >= $1 AND s."UpdatedAt" <= $2
        GROUP BY c."Id", c."CompanyName"
        ORDER BY sample_count DESC
      `, [startOfMonth, endOfMonth])

      const perClient = perClientResult.rows.map(row => ({
        client: row.CompanyName,
        count: parseInt(row.sample_count),
      }))

      // Per test/workflow breakdown
      const perTestResult = await client.query(`
        SELECT 
          sw."WorkflowType",
          sw."WorkflowSubType",
          COUNT(DISTINCT sw."SampleId") as sample_count
        FROM "SampleWorkflows" sw
        JOIN "Samples" s ON s."Id" = sw."SampleId"
        WHERE s."Status" = 'COMPLETED'
        AND s."UpdatedAt" >= $1 AND s."UpdatedAt" <= $2
        GROUP BY sw."WorkflowType", sw."WorkflowSubType"
        ORDER BY sample_count DESC
      `, [startOfMonth, endOfMonth])

      const perTest = perTestResult.rows.map(row => ({
        workflowType: row.WorkflowType,
        workflowSubType: row.WorkflowSubType,
        count: parseInt(row.sample_count),
        displayName: `${row.WorkflowType}${row.WorkflowSubType ? ` - ${row.WorkflowSubType}` : ''}`,
      }))

      return NextResponse.json({
        totalProcessed,
        perClient,
        perTest,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Monthly stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monthly statistics' },
      { status: 500 }
    )
  }
}


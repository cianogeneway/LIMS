import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Pool } from 'pg'

// Parse connection string from environment or use defaults
const getPool = () => {
  const connectionString = process.env.DATABASE_URL || 
    'postgresql://rx:qwe12345_@rxg.postgres.database.azure.com:5432/Lims?sslmode=require'
  
  return new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  })
}

const pool = getPool()

// Standard TAT in days (can be made configurable per client/sample type later)
const STANDARD_TAT_DAYS = 7
const TAT_WARNING_THRESHOLD = 0.8 // Warn when 80% of TAT has passed

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await pool.connect()
    
    try {
      // Get all samples that are not completed
      const result = await client.query(`
        SELECT 
          "Id",
          "DateReceivedInLab",
          "Status",
          "SampleType"
        FROM "Samples"
        WHERE "Status" != 'COMPLETED' 
          AND "Status" != 'REJECTED'
          AND "DateReceivedInLab" IS NOT NULL
        ORDER BY "DateReceivedInLab" ASC
      `)

      const now = new Date()
      let approachingTAT = 0
      let outOfTAT = 0

      for (const sample of result.rows) {
        const dateReceived = new Date(sample.DateReceivedInLab)
        const daysSinceReceived = (now.getTime() - dateReceived.getTime()) / (1000 * 60 * 60 * 24)
        const tatProgress = daysSinceReceived / STANDARD_TAT_DAYS

        if (tatProgress >= 1.0) {
          // Out of TAT
          outOfTAT++
        } else if (tatProgress >= TAT_WARNING_THRESHOLD) {
          // Approaching TAT (80% or more of TAT has passed)
          approachingTAT++
        }
      }

      return NextResponse.json({
        approachingTAT,
        outOfTAT
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('TAT alerts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch TAT alerts', approachingTAT: 0, outOfTAT: 0 },
      { status: 500 }
    )
  }
}


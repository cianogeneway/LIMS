import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'Admin' && session.user.role !== 'Director') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const client = await pool.connect()
    
    try {
      // Run migration queries
      const queries = [
        `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "Supplier" text`,
        `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "Manufacturer" text`,
        `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "InvoiceDate" timestamp with time zone`,
        `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "InvoiceNumber" text`,
        `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "ProductDescription" text`,
        `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "ShortDescription" text`,
        `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "AreaOfUse" text`,
        `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "ProductCode" text`,
        `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "UnitPrice2016_2018" numeric(18, 2)`,
        `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "UnitPrice2019" numeric(18, 2)`,
        `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "UnitPrice2023" numeric(18, 2)`,
        `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "InsuranceReplacementValue" numeric(18, 2)`,
        `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "MaintenanceType" text`,
        `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "ServiceDueDate" timestamp with time zone`,
        `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "UnitMeasurement" text`,
        `CREATE INDEX IF NOT EXISTS "IX_Instruments_SerialNumber" ON "Instruments" ("SerialNumber")`,
        `CREATE INDEX IF NOT EXISTS "IX_Instruments_AreaOfUse" ON "Instruments" ("AreaOfUse")`,
        `CREATE INDEX IF NOT EXISTS "IX_Instruments_ServiceDueDate" ON "Instruments" ("ServiceDueDate")`,
      ]

      const results = []
      for (const query of queries) {
        try {
          await client.query(query)
          results.push({ query, success: true })
        } catch (error: any) {
          results.push({ query, success: false, error: error.message })
        }
      }

      const allSuccess = results.every(r => r.success)
      
      return NextResponse.json({
        success: allSuccess,
        results,
        message: allSuccess 
          ? 'Migration completed successfully' 
          : 'Migration completed with some errors. Check results for details.',
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Failed to run migration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}




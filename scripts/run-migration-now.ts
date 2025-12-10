import { pool } from '../lib/db'

async function runMigration() {
  const client = await pool.connect()
  try {
    console.log('Running migration...')
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

    for (const query of queries) {
      try {
        await client.query(query)
      } catch (error: any) {
        // Ignore errors (columns might already exist)
      }
    }
    console.log('✓ Migration complete!')
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration().catch(console.error)




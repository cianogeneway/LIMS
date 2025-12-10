import { Client } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('Connected to database')

    const sql = fs.readFileSync(
      path.join(__dirname, 'create-quotations-and-templates.sql'),
      'utf-8'
    )

    await client.query(sql)
    console.log('✅ Successfully created Quotations, QuotationItems, ReferenceRanges, and ReportTemplates tables')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await client.end()
  }
}

runMigration()

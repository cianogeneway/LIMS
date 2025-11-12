import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

// Create pool with connection details
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    'postgresql://rx:qwe12345_@rxg.postgres.database.azure.com:5432/Lims?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
})

async function createTables() {
  const client = await pool.connect()
  try {
    // Read the SQL file
    const sqlFile = path.join(process.cwd(), 'scripts', 'create-extraction-worklist-tables.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')

    // Execute the SQL
    console.log('Creating DNA extraction worklist tables...')
    await client.query(sql)
    console.log('✅ Tables created successfully!')

    // Verify tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('ExtractionWorklists', 'ExtractionWorklistRows', 'ExtractionQCResults')
    `)

    if (result.rows.length === 3) {
      console.log('✅ All 3 tables verified:')
      result.rows.forEach(row => console.log(`   - ${row.table_name}`))
    } else {
      console.warn('⚠️ Expected 3 tables but found:', result.rows.length)
      result.rows.forEach(row => console.log(`   - ${row.table_name}`))
    }
  } catch (error) {
    console.error('❌ Error creating tables:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

createTables()

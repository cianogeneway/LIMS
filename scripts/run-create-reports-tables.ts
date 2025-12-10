import { pool } from '../lib/db'
import * as fs from 'fs'

async function createReportsTables() {
  const client = await pool.connect()
  
  try {
    const sql = fs.readFileSync('./scripts/create-reports-tables.sql', 'utf8')
    await client.query(sql)
    console.log('✓ Reports and QC Reports tables created')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

createReportsTables()

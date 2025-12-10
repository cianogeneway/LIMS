import { pool } from '../lib/db'

async function checkCategories() {
  const client = await pool.connect()
  
  try {
    const result = await client.query(`
      SELECT "Name", "Category" 
      FROM "ExtractionWorklists" 
      ORDER BY "Category", "Name"
    `)
    
    console.log('Current Categories in Database:')
    console.log('================================')
    console.table(result.rows)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

checkCategories()

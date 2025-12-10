import { pool } from '../lib/db'

async function addClientPricing() {
  const client = await pool.connect()
  
  try {
    // Add PricePerSample column to Clients table
    await client.query(`
      ALTER TABLE "Clients" 
      ADD COLUMN IF NOT EXISTS "PricePerSample" decimal(10, 2) DEFAULT 0.00
    `)
    console.log('✓ PricePerSample column added to Clients table')
    
    // Check results
    const result = await client.query(`
      SELECT "CompanyName", "PricePerSample" 
      FROM "Clients"
      ORDER BY "CompanyName"
    `)
    
    console.log('\nCurrent Client Pricing:')
    console.log('=======================')
    console.table(result.rows)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

addClientPricing()

import { pool } from '../lib/db'

async function addClientVatAndCurrency() {
  const client = await pool.connect()
  
  try {
    // Add VAT Applicable and Currency columns
    await client.query(`
      ALTER TABLE "Clients" 
      ADD COLUMN IF NOT EXISTS "VatApplicable" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "Currency" text DEFAULT 'ZAR'
    `)
    console.log('✓ VAT Applicable and Currency columns added to Clients table')
    
    // Check results
    const result = await client.query(`
      SELECT "CompanyName", "PricePerSample", "VatApplicable", "Currency"
      FROM "Clients"
      ORDER BY "CompanyName"
    `)
    
    console.log('\nCurrent Client Settings:')
    console.log('========================')
    console.table(result.rows)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

addClientVatAndCurrency()

import { pool } from '../lib/db'

async function categorizeWorklists() {
  const client = await pool.connect()
  
  try {
    // Add Category column if it doesn't exist
    await client.query(`
      ALTER TABLE "ExtractionWorklists" 
      ADD COLUMN IF NOT EXISTS "Category" text DEFAULT 'DNA_EXTRACTION'
    `)
    console.log('✓ Category column added')
    
    // Categorize based on worklist names
    // Open Array Paternity
    await client.query(`
      UPDATE "ExtractionWorklists"
      SET "Category" = 'OPEN_ARRAY_PATERNITY'
      WHERE "Name" ILIKE '%OpenArray%' OR "Name" ILIKE '%Open Array%'
    `)
    
    // Micro Array
    await client.query(`
      UPDATE "ExtractionWorklists"
      SET "Category" = 'MICRO_ARRAY'
      WHERE "Name" ILIKE '%GeneTitan%' OR "Name" ILIKE '%Pangenomix%' OR "Name" ILIKE '%Microarray%'
    `)
    
    // Mad-X
    await client.query(`
      UPDATE "ExtractionWorklists"
      SET "Category" = 'MAD_X'
      WHERE "Name" ILIKE '%Shotgun%' OR "Name" ILIKE '%Mad-X%' OR "Name" ILIKE '%MadX%'
    `)
    
    // DNA Extraction (default - already set)
    await client.query(`
      UPDATE "ExtractionWorklists"
      SET "Category" = 'DNA_EXTRACTION'
      WHERE "Name" ILIKE '%DNA Extraction%' 
         OR "Name" ILIKE '%Automated%'
         OR "Name" ILIKE '%Manual%'
    `)
    
    // Show results
    const result = await client.query(`
      SELECT "Category", COUNT(*) as count
      FROM "ExtractionWorklists"
      GROUP BY "Category"
      ORDER BY "Category"
    `)
    
    console.log('\nCategorization complete!')
    console.log('========================')
    result.rows.forEach(row => {
      console.log(`${row.Category}: ${row.count} worklists`)
    })
    
    // Show detailed breakdown
    const detailed = await client.query(`
      SELECT "Name", "Category"
      FROM "ExtractionWorklists"
      ORDER BY "Category", "Name"
    `)
    
    console.log('\nDetailed breakdown:')
    console.log('===================')
    detailed.rows.forEach(row => {
      console.log(`${row.Category}: ${row.Name}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

categorizeWorklists()

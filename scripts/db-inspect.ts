import { pool } from '../lib/db'

async function run() {
  const client = await pool.connect()
  try {
    console.log('Connected. Running inspection queries...')

    const dbRes = await client.query(`SELECT current_database() as db, current_user as user`)
    console.log('Database:', dbRes.rows[0].db)
    console.log('User:', dbRes.rows[0].user)

    // Check if Instruments table exists
    const tableRes = await client.query(`
      SELECT to_regclass('public."Instruments"') as tbl
    `)
    if (!tableRes.rows[0].tbl) {
      console.log('Table "Instruments" does NOT exist in the connected database.')
      return
    }

    console.log('Table "Instruments" exists. Columns:')
    const cols = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'Instruments'
      ORDER BY ordinal_position
    `)
    for (const row of cols.rows) {
      console.log(`  - ${row.column_name} : ${row.data_type}`)
    }

    // Row count (fast estimate)
    const countRes = await client.query(`SELECT COUNT(*)::bigint as count FROM "Instruments"`)
    console.log('Row count:', countRes.rows[0].count)

    // Show sample rows (up to 5)
    const sample = await client.query(`SELECT "Id", "SerialNumber", "Name" FROM "Instruments" ORDER BY "CreatedAt" DESC LIMIT 5`)
    console.log('Latest 5 instruments (Id, SerialNumber, Name):')
    for (const row of sample.rows) {
      console.log(`  - ${row.Id} | ${row.SerialNumber} | ${row.Name}`)
    }
  } catch (err) {
    console.error('Error during DB inspection:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})

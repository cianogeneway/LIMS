import { pool } from '../lib/db'
import * as fs from 'fs'
import * as path from 'path'

async function run() {
  const file = path.join(__dirname, '../data/instruments-import.json')
  if (!fs.existsSync(file)) {
    console.error('instruments-import.json not found. Run parser first.')
    process.exit(1)
  }

  const data = JSON.parse(fs.readFileSync(file, 'utf-8')) as Array<{ serialNumber: string }>
  const serials = data.map(d => d.serialNumber).filter(Boolean)
  if (serials.length === 0) {
    console.log('No serial numbers found in import file')
    return
  }

  const client = await pool.connect()
  try {
    const placeholders = serials.map((_, i) => `$${i + 1}`).join(',')
    const q = `SELECT * FROM "Instruments" WHERE "SerialNumber" IN (${placeholders})`
    const res = await client.query(q, serials)
    const out = path.join(__dirname, `../data/instruments-backup-${Date.now()}.json`)
    fs.writeFileSync(out, JSON.stringify(res.rows, null, 2), 'utf-8')
    console.log(`Wrote backup of ${res.rows.length} existing instruments to ${out}`)
  } catch (err) {
    console.error('Error during backup:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})

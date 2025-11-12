import * as fs from 'fs'
import { pool } from '../lib/db'

const filePath = process.argv[2] || 'scripts/stocklist.tsv'

if (!fs.existsSync(filePath)) {
  console.error('Stocklist file not found:', filePath)
  process.exit(1)
}

function parseNumber(v: string | undefined) {
  if (!v) return null
  const s = v.replace(/R|\$|,/g, '').trim()
  if (s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

async function findOrCreateSupplier(client: any, name: string | null) {
  if (!name) return null
  const existing = await client.query('SELECT "Id" FROM "Suppliers" WHERE "Name" = $1', [name])
  if (existing.rows.length > 0) return existing.rows[0].Id
  const id = crypto.randomUUID()
  const now = new Date()
  await client.query(`INSERT INTO "Suppliers" ("Id","Name","CreatedAt","UpdatedAt") VALUES ($1,$2,$3,$4)`, [id, name, now, now])
  return id
}

async function importStock() {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length === 0) {
    console.error('No lines in stocklist')
    process.exit(1)
  }

  const header = lines[0].split('\t').map(h => h.trim())
  const rows = lines.slice(1).map(line => {
    const cols = line.split('\t')
    const obj: any = {}
    for (let i = 0; i < header.length; i++) {
      obj[header[i]] = (cols[i] || '').trim()
    }
    return obj
  })

  const client = await pool.connect()
  try {
    let imported = 0
    for (const r of rows) {
      const name = r['Description'] || r['Description']
      if (!name) continue
      const code = r['Code'] || null
      const supplierName = r['Supplier'] || null
      const unit = r['Unit'] || r['units'] || null
      const currentPrice = parseNumber(r['DiscountedUnitCost'] || r['Discounted Unit Cost'] || r['DiscountedUnitCost'] || r['DiscountedUnitCost'] || r['Discounted Unit Cost'] || r['DiscountedUnitCost'] || r['DiscountedUnitCost'] || r['DiscountedUnitCost'] || r['Discounted Unit Cost'] || r['DiscountedUnitCost'] || r['DiscountedUnitCost'] || r['DiscountedUnitCost'] || r['DiscountedUnitCost'] || r['DiscountedUnitCost'])
      const unitCost = parseNumber(r['UnitCost'] || r['Unit Cost'] || r['amount'] || r['UnitCost'])

      const supplierId = await findOrCreateSupplier(client, supplierName)

      // Check existing by name+code
      const existing = await client.query('SELECT "Id" FROM "StockItems" WHERE "Name" = $1 AND ("Code" = $2 OR $2 IS NULL)', [name, code])
      const now = new Date()
      if (existing.rows.length > 0) {
        // Update
        const id = existing.rows[0].Id
        await client.query(`UPDATE "StockItems" SET "Code" = $1, "SupplierId" = $2, "CurrentPrice" = $3, "Unit" = $4, "UpdatedAt" = $5 WHERE "Id" = $6`, [code, supplierId, currentPrice ?? unitCost ?? 0, unit, now, id])
        console.log(`Updated: ${name}`)
      } else {
        const id = crypto.randomUUID()
        await client.query(`INSERT INTO "StockItems" ("Id","Name","Code","SupplierId","CurrentPrice","Unit","CreatedAt","UpdatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [id, name, code, supplierId, currentPrice ?? unitCost ?? 0, unit, now, now])
        console.log(`Inserted: ${name}`)
        imported++
      }
    }
    console.log(`\nImport complete. Inserted: ${imported}`)
  } finally {
    client.release()
    await pool.end()
  }
}

importStock().catch(err => { console.error(err); process.exit(1) })

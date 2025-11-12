import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://rx:qwe12345_@rxg.postgres.database.azure.com:5432/Lims?sslmode=require',
  ssl: { rejectUnauthorized: false },
})

// QC thresholds (can be adjusted)
const A260_230_MIN = 1.5
const A260_230_MAX = 2.2
const A260_280_MIN = 1.5
const A260_280_MAX = 2.2

function inRange(value: number | null, min: number, max: number) {
  if (value === null || value === undefined) return false
  return value >= min && value <= max
}

async function run(worklistId: string) {
  const client = await pool.connect()
  try {
    console.log('Running QC evaluation for worklist:', worklistId)

    // Fetch all rows for the worklist
    const rowsRes = await client.query(
      `SELECT * FROM "ExtractionWorklistRows" WHERE "WorklistId" = $1 ORDER BY "Well" ASC`,
      [worklistId]
    )

    if (rowsRes.rows.length === 0) {
      console.warn('No rows found for worklist', worklistId)
      return
    }

    let created = 0
    let updated = 0
    let passedCount = 0
    let failedCount = 0

    for (const r of rowsRes.rows) {
      // Parse numeric values (DB columns may be strings depending on driver)
      const a230 = r.A260_230 !== null ? parseFloat(r.A260_230) : null
      const a280 = r.A260_280 !== null ? parseFloat(r.A260_280) : null
      const qubit = r.QubitNgUl !== null ? parseFloat(r.QubitNgUl) : null
      const nd = r.NanoDropNgUl !== null ? parseFloat(r.NanoDropNgUl) : null

      const passA230 = inRange(a230, A260_230_MIN, A260_230_MAX)
      const passA280 = inRange(a280, A260_280_MIN, A260_280_MAX)

      // Decide pass: require both ratios to pass
      const passed = passA230 && passA280

      if (passed) passedCount++
      else failedCount++

      // Choose concentration: prefer Qubit over NanoDrop if present
      const concentration = qubit ?? nd ?? null

      // Check if a QC row exists for this WorklistId + RowId with QCMethod 'AUTO'
      const existing = await client.query(
        `SELECT * FROM "ExtractionQCResults" WHERE "WorklistId" = $1 AND "RowId" = $2 AND "QCMethod" = 'AUTO' LIMIT 1`,
        [worklistId, r.Id]
      )

      const now = new Date()
      if (existing.rows.length === 0) {
        const qcId = require('crypto').randomUUID()
        await client.query(
          `INSERT INTO "ExtractionQCResults" (
            "Id", "WorklistId", "RowId", "SampleId", "ExtractionType", "QCMethod",
            "Concentration", "Ratio260_280", "Ratio260_230", "GelResult", "QubitConcentration",
            "Passed", "Override", "CreatedAt", "UpdatedAt"
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
          `,
          [
            qcId,
            worklistId,
            r.Id,
            r.SampleId || null,
            'DNA_EXTRACTION',
            'AUTO',
            concentration,
            a280,
            a230,
            r.Gel || null,
            qubit,
            passed,
            false,
            now,
            now,
          ]
        )
        created++
      } else {
        // Update existing AUTO QC record
        const qc = existing.rows[0]
        await client.query(
          `UPDATE "ExtractionQCResults"
           SET "SampleId" = $1, "Concentration" = $2, "Ratio260_280" = $3, "Ratio260_230" = $4,
               "GelResult" = $5, "QubitConcentration" = $6, "Passed" = $7, "UpdatedAt" = $8
           WHERE "Id" = $9
          `,
          [r.SampleId || null, concentration, a280, a230, r.Gel || null, qubit, passed, now, qc.Id]
        )
        updated++
      }
    }

    console.log(`QC evaluation complete: created=${created} updated=${updated} passed=${passedCount} failed=${failedCount}`)
  } catch (err) {
    console.error('QC evaluation error:', err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

// Run with argument: node or npx tsx scripts/run-qc-evaluation.ts <worklistId>
const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: npx tsx scripts/run-qc-evaluation.ts <worklistId>')
  process.exit(1)
}

run(args[0])

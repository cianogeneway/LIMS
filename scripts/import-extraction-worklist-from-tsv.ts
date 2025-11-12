import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://rx:qwe12345_@rxg.postgres.database.azure.com:5432/Lims?sslmode=require',
  ssl: { rejectUnauthorized: false },
})

function parseTSV(content: string) {
  const lines = content.split(/\r?\n/).map(l => l.trimEnd())

  // Try to extract metadata lines at the top (Date, Performed By, Kit Lot)
  const meta: any = {}
  let tableStartIndex = -1

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i]
    if (/^Well\b/i.test(line)) { tableStartIndex = i; break }
    if (/^Date[:\t]/i.test(line)) {
      const parts = line.split(/[:\t]+/)
      meta.date = parts.slice(1).join('\t').trim() || null
    }
    if (/^Performed By[:\t]/i.test(line)) {
      const parts = line.split(/[:\t]+/)
      meta.performedBy = parts.slice(1).join('\t').trim() || null
    }
    if (/Extraction Kit Lot[:\t]/i.test(line)) {
      const parts = line.split(/[:\t]+/)
      meta.kitLot = parts.slice(1).join('\t').trim() || null
    }
  }

  if (tableStartIndex === -1) {
    // fallback: find header line containing "Sample ID"
    tableStartIndex = lines.findIndex(l => /Sample ID/i.test(l))
  }

  if (tableStartIndex === -1) throw new Error('Could not find table header')

  const header = lines[tableStartIndex].split(/\t+/).map(h => h.trim())
  const rows: any[] = []

  for (let i = tableStartIndex + 1; i < lines.length; i++) {
    const ln = lines[i]
    if (!ln) continue
    const cols = ln.split(/\t+/)

    // Accept numeric wells (1..n) or alphanumeric wells (A01..H12)
    const first = (cols[0] || '').trim()
    if (!first) continue

    const isNumericWell = /^[0-9]+$/.test(first)
    const isAlphaWell = /^[A-Ha-h]\d{1,2}$/.test(first)

    if (!isNumericWell && !isAlphaWell) continue

    const row: any = {}
    for (let c = 0; c < Math.min(header.length, cols.length); c++) {
      row[header[c]] = cols[c]
    }
    rows.push(row)
  }

  return { meta, header, rows }
}

async function importFile(tsvPath: string, name?: string) {
  const content = fs.readFileSync(tsvPath, 'utf8')
  const parsed = parseTSV(content)

  const client = await pool.connect()
  try {
    const now = new Date()
    const worklistId = require('crypto').randomUUID()
    const worklistName = name || 'Imported: ' + path.basename(tsvPath)

    // Safely parse optional date from TSV metadata. If missing or invalid, use now.
    let worklistDate: Date = now
    if (parsed.meta && parsed.meta.date) {
      const parsedTs = Date.parse(parsed.meta.date)
      if (!isNaN(parsedTs)) {
        worklistDate = new Date(parsedTs)
      }
    }

    // Insert worklist header
    await client.query(`INSERT INTO "ExtractionWorklists" (
      "Id", "Name", "WorklistType", "Status", "Date", "PerformedBy",
      "ExtractionKitLot", "CreatedAt", "UpdatedAt", "CreatedBy"
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    `, [
      worklistId,
      worklistName,
      'AUTOMATED_DNA_EXTRACTION_32_FORMAT',
      'DRAFT',
      worklistDate,
      parsed.meta.performedBy || null,
      parsed.meta.kitLot || null,
      now,
      now,
      null,
    ])

    // Insert rows. Map header names to our DB column names
    const map = {
      'Well': 'Well',
      'Sample ID': 'SampleId',
      'Sample Name': 'SampleName',
      'Sex (M/F)': 'Sex',
      'Sample Type': 'SampleType',
      'Comment': 'Comment',
      'Test Requested': 'TestRequested',
      'NanoDrop [ng/uL]': 'NanoDropNgUl',
      'A260/230': 'A260_230',
      'A260/280': 'A260_280',
      'Gel': 'Gel',
      'Qubit [ng/uL]': 'QubitNgUl',
      'Dil. Fac': 'DilutionFactor',
      'Gel Dilution (DNA)': 'GelDilution',
      'dH20': 'dH20Volume',
      'Loading Dye/Buffer (3ul)': 'LoadingDyeBuffer'
    }

    for (const r of parsed.rows) {
      const rowId = require('crypto').randomUUID()
      // Determine numeric well index: if numeric, use directly. If A01..H12, map to 1..96.
      let well = 0
      const wellRaw = (r['Well'] || '').toString().trim()
      if (/^[0-9]+$/.test(wellRaw)) {
        well = parseInt(wellRaw, 10) || 0
      } else {
        const m = /^([A-Ha-h])(\d{1,2})$/.exec(wellRaw)
        if (m) {
          const rowLetter = m[1].toUpperCase()
          const colNum = parseInt(m[2], 10)
          const rowIndex = rowLetter.charCodeAt(0) - 'A'.charCodeAt(0) // 0-based
          // validate col 1..12 and rowIndex 0..7
          if (colNum >= 1 && colNum <= 12 && rowIndex >= 0 && rowIndex <= 7) {
            well = rowIndex * 12 + colNum
          }
        }
      }
      const values: any = {
        Id: rowId,
        WorklistId: worklistId,
        Well: well,
        SampleId: r['Sample ID'] || null,
        SampleName: r['Sample Name'] || null,
        Sex: r['Sex (M/F)'] || null,
        SampleType: r['Sample Type'] || null,
        Comment: r['Comment'] || null,
        TestRequested: r['Test Requested'] || null,
        NanoDropNgUl: r['NanoDrop [ng/uL]'] ? parseFloat(r['NanoDrop [ng/uL]']) : null,
        A260_230: r['A260/230'] ? parseFloat(r['A260/230']) : null,
        A260_280: r['A260/280'] ? parseFloat(r['A260/280']) : null,
        Gel: r['Gel'] || null,
        QubitNgUl: r['Qubit [ng/uL]'] ? parseFloat(r['Qubit [ng/uL]']) : null,
        DilutionFactor: r['Dil. Fac'] ? parseFloat(r['Dil. Fac']) : null,
        GelDilution: r['Gel Dilution (DNA)'] || null,
        dH20Volume: r['dH20'] ? parseFloat(r['dH20']) : null,
        LoadingDyeBuffer: r['Loading Dye/Buffer (3ul)'] ? parseFloat(r['Loading Dye/Buffer (3ul)']) : null,
        CreatedAt: now,
        UpdatedAt: now,
      }

      await client.query(`INSERT INTO "ExtractionWorklistRows" (
        "Id","WorklistId","Well","SampleId","SampleName","Sex","SampleType","Comment",
        "TestRequested","NanoDropNgUl","A260_230","A260_280","Gel","QubitNgUl",
        "DilutionFactor","GelDilution","dH20Volume","LoadingDyeBuffer","CreatedAt","UpdatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      `, [
        values.Id, values.WorklistId, values.Well, values.SampleId, values.SampleName, values.Sex, values.SampleType, values.Comment,
        values.TestRequested, values.NanoDropNgUl, values.A260_230, values.A260_280, values.Gel, values.QubitNgUl,
        values.DilutionFactor, values.GelDilution, values.dH20Volume, values.LoadingDyeBuffer, values.CreatedAt, values.UpdatedAt
      ])
    }

    console.log('Imported worklist', worklistId, 'with', parsed.rows.length, 'rows')
    return worklistId
  } finally {
    client.release()
    await pool.end()
  }
}

// Run: npx tsx scripts/import-extraction-worklist-from-tsv.ts [path-to-tsv]
const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: npx tsx scripts/import-extraction-worklist-from-tsv.ts <path-to-tsv> [optional-name]')
  process.exit(1)
}

importFile(path.resolve(process.cwd(), args[0]), args[1]).catch(err => {
  console.error(err)
  process.exit(1)
})

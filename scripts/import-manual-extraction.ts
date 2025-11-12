import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://rx:qwe12345_@rxg.postgres.database.azure.com:5432/Lims?sslmode=require',
  ssl: { rejectUnauthorized: false },
})

function normalizeNumber(v: string | undefined | null) {
  if (v === undefined || v === null) return null
  const s = v.toString().trim()
  if (!s) return null
  if (s === '#DIV/0!' || s === '#VALUE!' || /#N\/A/i.test(s)) return null
  // Remove commas
  const cleaned = s.replace(/,/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

function parseManualTemplate(content: string) {
  const lines = content.split(/\r?\n/).map(l => l.replace(/\r$/, ''))
  // Find header line containing 'Sample ID'
  let headerIndex = lines.findIndex(l => /Sample\s*ID/i.test(l) && /Sample\s*Name/i.test(l))
  if (headerIndex === -1) {
    // Try first 20 lines for something resembling header
    headerIndex = lines.slice(0, 20).findIndex(l => /Sample\s*ID/i.test(l))
    if (headerIndex !== -1) headerIndex = headerIndex
  }

  if (headerIndex === -1) throw new Error('Could not find header line with "Sample ID"')

  const header = lines[headerIndex].split(/\t|,{1}/).map(h => h.trim())
  const rows: string[][] = []

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const ln = lines[i]
    if (!ln || /^\s*$/.test(ln)) continue
    const cols = ln.split(/\t|,{1}/).map(c => c.trim())
    // If first column is a number (Number), accept row
    const first = cols[0] || ''
    if (!/^[0-9]+$/.test(first)) {
      // Some templates include only numbers in first col; skip otherwise
      // But if Sample ID present in other columns accept
      if (!cols.some(c => /[A-Za-z0-9]/.test(c))) continue
    }
    rows.push(cols)
  }

  return { header, rows }
}

async function importFile(filePath: string, name?: string) {
  const content = fs.readFileSync(filePath, 'utf8')
  const parsed = parseManualTemplate(content)

  const client = await pool.connect()
  try {
    const now = new Date()
    const worklistId = require('crypto').randomUUID()
    const worklistName = name || 'Imported Manual DNA Extraction - ' + path.basename(filePath)

    // Try to find a date line near the top
    let worklistDate = now
    const top = content.split(/\r?\n/).slice(0, 6).join('\n')
    const m = top.match(/Date\s*[:\-]\s*(.+)/i)
    if (m) {
      const d = Date.parse(m[1].trim())
      if (!isNaN(d)) worklistDate = new Date(d)
    }

    await client.query(`INSERT INTO "ExtractionWorklists" (
      "Id","Name","WorklistType","Status","Date","CreatedAt","UpdatedAt","CreatedBy"
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `, [worklistId, worklistName, 'MANUAL_DNA_EXTRACTION', 'DRAFT', worklistDate, now, now, null])

    // Map expected header names to indices
    const h = parsed.header
    const idx = (label: string) => h.findIndex(x => x.replace(/"/g, '').toLowerCase().includes(label.toLowerCase()))

    const map = {
      sampleId: idx('sample id'),
      sampleName: idx('sample name'),
      sex: idx('sex'),
      sampleType: idx('sample type'),
      testRequested: idx('test requested'),
      nanoDrop: idx('nanodrop'),
      a260_230: idx('a260/230'),
      a260_280: idx('a260/280'),
      gel: idx('gel'),
      qubit: idx('qubit'),
      dilution: idx('dil.'),
      gelDilution: idx('gel dilution'),
      loadingBuffer: idx('loading'),
      dye: idx('dye'),
    }

    for (let i = 0; i < parsed.rows.length; i++) {
      const cols = parsed.rows[i]
      const rowId = require('crypto').randomUUID()
      const sampleId = (cols[map.sampleId] || '') || null
      const sampleName = (cols[map.sampleName] || '') || null
      const sex = (cols[map.sex] || '') || null
      const sampleType = (cols[map.sampleType] || '') || null
      const testRequested = (cols[map.testRequested] || '') || null

      const nanoDrop = normalizeNumber(cols[map.nanoDrop])
      const a260_230 = normalizeNumber(cols[map.a260_230])
      const a260_280 = normalizeNumber(cols[map.a260_280])
      const gel = (cols[map.gel] || '') || null
      const qubit = normalizeNumber(cols[map.qubit])
      const dilutionFactor = normalizeNumber(cols[map.dilution])
      const gelDilution = (cols[map.gelDilution] || '') || null
      const loadingBuffer = (cols[map.loadingBuffer] || '') || null
      const dye = (cols[map.dye] || '') || null

  // Assign sequential well numbers for manual imports (1..n)
  const well = i + 1

      await client.query(`INSERT INTO "ExtractionWorklistRows" (
        "Id","WorklistId","Well","SampleId","SampleName","Sex","SampleType","Comment",
        "TestRequested","NanoDropNgUl","A260_230","A260_280","Gel","QubitNgUl",
        "DilutionFactor","GelDilution","LoadingDyeBuffer","CreatedAt","UpdatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      `, [
        rowId, worklistId, well, sampleId, sampleName, sex, sampleType, null,
        testRequested, nanoDrop, a260_230, a260_280, gel, qubit,
        dilutionFactor, gelDilution, loadingBuffer, now, now
      ])
    }

    console.log('Imported manual worklist', worklistId, 'with', parsed.rows.length, 'rows')
    return worklistId
  } finally {
    client.release()
    await pool.end()
  }
}

// Usage: npx tsx scripts/import-manual-extraction.ts <path-to-file> [name]
const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: npx tsx scripts/import-manual-extraction.ts <path-to-file> [name]')
  process.exit(1)
}

importFile(path.resolve(process.cwd(), args[0]), args[1]).catch(err => {
  console.error(err)
  process.exit(1)
})

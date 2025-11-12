import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'
import crypto from 'crypto'

// Azure Blob Storage configuration
const BLOB_SAS_URL = process.env.AZURE_BLOB_SAS_URL || 
  'https://limsstorageaccountrx.blob.core.windows.net/limsdocs?sp=r&st=2025-11-10T12:22:02Z&se=2030-11-10T20:37:02Z&spr=https&sv=2024-11-04&sr=c&sig=7aA53sRCF2iGzks15yewh%2BOL1%2BcaV15c%2Fvi5Tpl6RY0%3D'

function parseTSV(content: string) {
  const lines = content.split(/\r?\n/).map(l => l.trimEnd())

  // Extract metadata lines at the top (Date, Performed By, Kit Lot)
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
    // Fallback: find header line containing "Sample ID"
    tableStartIndex = lines.findIndex(l => /Sample ID/i.test(l))
  }

  if (tableStartIndex === -1) throw new Error('Could not find table header (no "Well" or "Sample ID" column found)')

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

async function uploadToBlobStorage(file: File, folder: string, filename: string): Promise<string> {
  try {
    const blobUrl = new URL(BLOB_SAS_URL)
    const containerUrl = `${blobUrl.origin}${blobUrl.pathname}`
    const blobPath = `${folder}/${filename}`
    const uploadUrl = `${containerUrl}/${blobPath}${blobUrl.search}`
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type || 'text/plain',
      },
      body: buffer,
    })
    
    if (!response.ok) {
      throw new Error(`Failed to upload to blob storage: ${response.statusText}`)
    }
    
    return uploadUrl.split('?')[0] // Return URL without SAS token
  } catch (error) {
    console.error('Blob upload error:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read file content
    const content = await file.text()
    
    // Parse TSV
    let parsed
    try {
      parsed = parseTSV(content)
    } catch (err) {
      return NextResponse.json({ 
        error: err instanceof Error ? err.message : 'Failed to parse TSV file' 
      }, { status: 400 })
    }

    if (parsed.rows.length === 0) {
      return NextResponse.json({ 
        error: 'No valid data rows found in file' 
      }, { status: 400 })
    }

    // Upload file to blob storage
    const timestamp = Date.now()
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const blobFilename = `${timestamp}_${sanitizedFilename}`
    const blobUrl = await uploadToBlobStorage(file, 'extraction-worklists', blobFilename)

    // Create worklist in database
    const now = new Date()
    const worklistId = crypto.randomUUID()
    const worklistName = name || `Imported: ${file.name}`

    // Parse date from metadata
    let worklistDate: Date = now
    if (parsed.meta?.date) {
      const parsedTs = Date.parse(parsed.meta.date)
      if (!isNaN(parsedTs)) {
        worklistDate = new Date(parsedTs)
      }
    }

    // Insert worklist
    await pool.query(`
      INSERT INTO "ExtractionWorklists" (
        "Id", "Name", "WorklistType", "Status", "Date", "PerformedBy",
        "ExtractionKitLot", "FileUrl", "CreatedAt", "UpdatedAt", "CreatedBy"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `, [
      worklistId,
      worklistName,
      'AUTOMATED_DNA_EXTRACTION_32_FORMAT',
      'DRAFT',
      worklistDate,
      parsed.meta.performedBy || null,
      parsed.meta.kitLot || null,
      blobUrl,
      now,
      now,
      session.user.id,
    ])

    // Insert rows
    for (const r of parsed.rows) {
      const rowId = crypto.randomUUID()
      
      // Determine numeric well index
      let well = 0
      const wellRaw = (r['Well'] || '').toString().trim()
      if (/^[0-9]+$/.test(wellRaw)) {
        well = parseInt(wellRaw, 10) || 0
      } else {
        const m = /^([A-Ha-h])(\d{1,2})$/.exec(wellRaw)
        if (m) {
          const rowLetter = m[1].toUpperCase()
          const colNum = parseInt(m[2], 10)
          const rowIndex = rowLetter.charCodeAt(0) - 'A'.charCodeAt(0)
          if (colNum >= 1 && colNum <= 12 && rowIndex >= 0 && rowIndex <= 7) {
            well = rowIndex * 12 + colNum
          }
        }
      }

      const values = {
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

      await pool.query(`
        INSERT INTO "ExtractionWorklistRows" (
          "Id","WorklistId","Well","SampleId","SampleName","Sex","SampleType","Comment",
          "TestRequested","NanoDropNgUl","A260_230","A260_280","Gel","QubitNgUl",
          "DilutionFactor","GelDilution","dH20Volume","LoadingDyeBuffer","CreatedAt","UpdatedAt"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      `, [
        values.Id, values.WorklistId, values.Well, values.SampleId, values.SampleName, 
        values.Sex, values.SampleType, values.Comment, values.TestRequested, values.NanoDropNgUl, 
        values.A260_230, values.A260_280, values.Gel, values.QubitNgUl, values.DilutionFactor, 
        values.GelDilution, values.dH20Volume, values.LoadingDyeBuffer, values.CreatedAt, values.UpdatedAt
      ])
    }

    return NextResponse.json({
      id: worklistId,
      name: worklistName,
      rowCount: parsed.rows.length,
      blobUrl,
      message: 'Worklist imported successfully'
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import worklist' },
      { status: 500 }
    )
  }
}

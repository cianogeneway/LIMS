import ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'

// Usage: npx tsx scripts/convert-assets-to-json.ts <input-file>
// Supported input file: .xlsx or .csv
// Output: data/instruments-import.json

const inputFile = process.argv[2] || path.join(__dirname, '../data/instruments.xlsx')
const outputFile = path.join(__dirname, '../data/instruments-import.json')

function parseCurrency(value: any): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  let s = String(value).trim()
  if (!s) return null
  // Remove currency letters (R, $) and other non-digit/.,, separators
  s = s.replace(/[R$€£]/g, '')
  // Replace non-breaking spaces
  s = s.replace(/\u00A0/g, '')
  // Remove regular spaces used as thousand separators
  s = s.replace(/\s+/g, '')
  // If contains comma and no dot, treat comma as decimal separator
  if (s.indexOf(',') >= 0 && s.indexOf('.') === -1) {
    s = s.replace(',', '.')
  }
  // Remove any accidental other characters
  s = s.replace(/[^0-9.-]/g, '')
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : null
}

function parseDate(value: any): string | undefined {
  if (!value && value !== 0) return undefined
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  const s = String(value).trim()
  if (!s) return undefined
  // Common formats: dd/mm/yyyy or yyyy-mm-dd or dd-mm-yyyy
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (dmy) {
    let day = dmy[1].padStart(2, '0')
    let month = dmy[2].padStart(2, '0')
    let year = dmy[3]
    if (year.length === 2) {
      year = Number(year) > 50 ? '19' + year : '20' + year
    }
    return `${year}-${month}-${day}`
  }
  // Try Date parse fallback
  const dt = new Date(s)
  if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10)
  return undefined
}

function headerMap(header: string): string {
  const h = header.toLowerCase().trim()
  if (h.includes('supplier')) return 'supplier'
  if (h.includes('company') || h.includes('manufacture') || h.includes('manufacturer')) return 'manufacturer'
  if (h.includes('invoice')) return 'invoiceDate'
  if (h.includes('serial')) return 'serialNumber'
  if (h.includes('asset')) return 'assetNumber'
  if (h.includes('product description')) return 'productDescription'
  if (h.includes('short') && h.includes('description')) return 'shortDescription'
  if (h.includes('area')) return 'areaOfUse'
  if (h.includes('smallest') || h.includes('smallest single')) return 'smallestSingleUnit'
  if (h.includes('single unit') && h.includes('meas')) return 'unitMeasurement'
  if (h.includes('major unit') || h.includes('major')) return 'majorUnitPrice'
  if (h.includes('single unit') && h.includes('price')) return 'singleUnitPrice'
  if (h.includes('insurance') || h.includes('replacement')) return 'insuranceReplacementValue'
  if (h.includes('retired') || h.includes('out of service') || h.includes('decommission')) return 'retired'
  return h.replace(/\s+/g, '_')
}

async function run() {
  console.log('Reading', inputFile)
  const ext = path.extname(inputFile).toLowerCase()
  const workbook = new ExcelJS.Workbook()

  if (ext === '.csv') {
    await workbook.csv.readFile(inputFile)
  } else {
    await workbook.xlsx.readFile(inputFile)
  }

  const sheet = workbook.worksheets[0]
  if (!sheet) {
    console.error('No worksheet found in file')
    process.exit(1)
  }

  // Read header row
  const headerRow = sheet.getRow(1)
  const headers: string[] = []
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers.push(cell.value ? String(cell.value) : `col_${colNumber}`)
  })

  const mappedHeaders = headers.map(headerMap)

  const result: any[] = []
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r)
    if (row.values.length === 0) continue
    const obj: any = {}
    for (let c = 1; c <= headers.length; c++) {
      const key = mappedHeaders[c - 1]
      const cell = row.getCell(c)
      const raw = cell.value
      if (!raw && raw !== 0) continue
      switch (key) {
        case 'invoiceDate':
          obj.invoiceDate = parseDate(raw)
          break
        case 'serialNumber':
          obj.serialNumber = String(raw).trim()
          break
        case 'assetNumber':
          obj.productCode = String(raw).trim()
          break
        case 'majorUnitPrice':
          obj.unitPrice2016_2018 = parseCurrency(raw)
          break
        case 'singleUnitPrice':
          // We don't know which year; store in unitPrice2023 as fallback
          obj.unitPrice2023 = parseCurrency(raw)
          break
        case 'insuranceReplacementValue':
          obj.insuranceReplacementValue = parseCurrency(raw)
          break
        case 'unitMeasurement':
          obj.unitMeasurement = String(raw).trim()
          break
        case 'productDescription':
          obj.productDescription = String(raw).trim()
          break
        case 'shortDescription':
          obj.shortDescription = String(raw).trim()
          break
        case 'supplier':
          obj.supplier = String(raw).trim()
          break
        case 'manufacturer':
          obj.manufacturer = String(raw).trim()
          break
        case 'areaOfUse':
          obj.areaOfUse = String(raw).trim()
          break
        case 'retired':
          obj.retired = String(raw).trim()
          break
        default:
          // store any other column under its header key
          obj[key] = typeof raw === 'object' && 'text' in raw ? raw.text : String(raw).trim()
      }
    }

    // Validate required fields: serialNumber, productDescription
    if (!obj.serialNumber || !obj.productDescription) {
      console.warn(`Skipping row ${r}: missing serialNumber or productDescription`)
      continue
    }

    // Use shortDescription as name if available
    if (!obj.shortDescription) obj.shortDescription = obj.productDescription

    result.push(obj)
  }

  // Write output
  fs.mkdirSync(path.dirname(outputFile), { recursive: true })
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf-8')
  console.log(`Wrote ${result.length} records to ${outputFile}`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})

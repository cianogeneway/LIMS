import * as fs from 'fs'
import * as path from 'path'

function parseCurrency(value: any): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  let s = String(value).trim()
  if (!s) return null
  s = s.replace(/[R$€£]/g, '')
  s = s.replace(/\u00A0/g, '')
  // remove spaces used as thousands separators but keep commas for decimals
  s = s.replace(/\s+/g, '')
  if (s.indexOf(',') >= 0 && s.indexOf('.') === -1) {
    s = s.replace(',', '.')
  }
  s = s.replace(/[^0-9.-]/g, '')
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : null
}

function parseDate(value: any): string | undefined {
  if (!value && value !== 0) return undefined
  const s = String(value).trim()
  if (!s) return undefined
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
  const dt = new Date(s)
  if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10)
  return undefined
}

function headerMap(header: string): string {
  const h = header.toLowerCase().trim()
  if (h.includes('supplier')) return 'supplier'
  if (h.includes('company') || h.includes('manufacture') || h.includes('manufacturer')) return 'manufacturer'
  if (h.includes('invoice date')) return 'invoiceDate'
  if (h.includes('invoice number')) return 'invoiceNumber'
  if (h.includes('serial')) return 'serialNumber'
  if (h.includes('asset') || h.includes('product code')) return 'productCode'
  if (h.includes('product description')) return 'productDescription'
  if (h.includes('short') && h.includes('description')) return 'shortDescription'
  if (h.includes('area')) return 'areaOfUse'
  if (h.includes('smallest') || h.includes('smallest single')) return 'smallestSingleUnit'
  if (h.includes('single unit') && h.includes('meas')) return 'unitMeasurement'
  if (h.includes('major unit') || h.includes('major')) return 'unitPrice2016_2018'
  if (h.includes('single unit') && h.includes('price')) return 'unitPrice2023'
  if (h.includes('insurance') || h.includes('replacement')) return 'insuranceReplacementValue'
  if (h.includes('maintenance')) return 'maintenanceType'
  if (h.includes('service due')) return 'serviceDueDate'
  return h.replace(/\s+/g, '_')
}

async function run() {
  const input = process.argv[2] || path.join(__dirname, '../data/assets-paste-2.tsv')
  const out = path.join(__dirname, '../data/instruments-import.json')

  if (!fs.existsSync(input)) {
    console.error('Input file not found:', input)
    process.exit(1)
  }

  const content = fs.readFileSync(input, 'utf-8')
  const lines = content.split(/\r?\n/).filter(l => l.trim() !== '')
  if (lines.length < 2) {
    console.error('No data rows found')
    process.exit(1)
  }

  const headers = lines[0].split('\t').map(h => h.trim())
  const mapped = headers.map(headerMap)

  const result: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t')
    if (cols.length === 0) continue

    // Build base object from the row
    const base: any = {}
    for (let c = 0; c < mapped.length; c++) {
      const key = mapped[c]
      const raw = cols[c] ? cols[c].trim() : ''
      if (!raw) continue
      switch (key) {
        case 'invoiceDate':
          base.invoiceDate = parseDate(raw)
          break
        case 'serialNumber':
          base._serialRaw = raw
          break
        case 'productCode':
          base.productCode = raw
          break
        case 'unitPrice2016_2018':
          base.unitPrice2016_2018 = parseCurrency(raw)
          break
        case 'unitPrice2023':
          base.unitPrice2023 = parseCurrency(raw)
          break
        case 'insuranceReplacementValue':
          base.insuranceReplacementValue = parseCurrency(raw)
          break
        case 'unitMeasurement':
          base.unitMeasurement = raw
          break
        case 'productDescription':
          base.productDescription = raw
          break
        case 'shortDescription':
          base.shortDescription = raw
          break
        case 'supplier':
          base.supplier = raw
          break
        case 'manufacturer':
          base.manufacturer = raw
          break
        case 'areaOfUse':
          base.areaOfUse = raw
          break
        case 'maintenanceType':
          base.maintenanceType = raw
          break
        case 'serviceDueDate':
          base.serviceDueDate = parseDate(raw)
          break
        default:
          base[key] = raw
      }
    }

    // If serial raw contains multiple serials, split
    const serialRaw: string = base._serialRaw || ''
    const serials = serialRaw.split(/[;,\/]+/).map(s => s.trim()).filter(Boolean)

    if (serials.length === 0) {
      console.warn(`Skipping row ${i + 1}: missing serialNumber`)
      continue
    }

    for (const s of serials) {
      const obj: any = { ...base }
      obj.serialNumber = s
      delete obj._serialRaw

      // Ensure required fields
      if (!obj.serialNumber || !obj.productDescription) {
        console.warn(`Skipping split record at row ${i + 1} serial '${s}': missing required fields`)
        continue
      }

      // Ensure shortDescription
      if (!obj.shortDescription) obj.shortDescription = obj.productDescription

      result.push(obj)
    }
  }

  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, JSON.stringify(result, null, 2), 'utf-8')
  console.log(`Wrote ${result.length} records to ${out}`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})

/**
 * Direct import script - imports instruments directly into database
 * Usage: npx tsx scripts/import-directly.ts "path/to/your/file.xlsx"
 */

import { pool } from '../lib/db'
import * as fs from 'fs'
import * as path from 'path'

// Try to use pandas via Python if available, otherwise require manual JSON
const excelPath = process.argv[2]

if (!excelPath) {
  console.error('Usage: npx tsx scripts/import-directly.ts "path/to/file.xlsx"')
  process.exit(1)
}

if (!fs.existsSync(excelPath)) {
  console.error(`File not found: ${excelPath}`)
  process.exit(1)
}

async function runMigration() {
  const client = await pool.connect()
  try {
    console.log('Running database migration...')
    const queries = [
      `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "Supplier" text`,
      `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "Manufacturer" text`,
      `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "InvoiceDate" timestamp with time zone`,
      `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "InvoiceNumber" text`,
      `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "ProductDescription" text`,
      `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "ShortDescription" text`,
      `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "AreaOfUse" text`,
      `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "ProductCode" text`,
      `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "UnitPrice2016_2018" numeric(18, 2)`,
      `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "UnitPrice2019" numeric(18, 2)`,
      `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "UnitPrice2023" numeric(18, 2)`,
      `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "InsuranceReplacementValue" numeric(18, 2)`,
      `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "MaintenanceType" text`,
      `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "ServiceDueDate" timestamp with time zone`,
      `ALTER TABLE "Instruments" ADD COLUMN IF NOT EXISTS "UnitMeasurement" text`,
      `CREATE INDEX IF NOT EXISTS "IX_Instruments_SerialNumber" ON "Instruments" ("SerialNumber")`,
      `CREATE INDEX IF NOT EXISTS "IX_Instruments_AreaOfUse" ON "Instruments" ("AreaOfUse")`,
      `CREATE INDEX IF NOT EXISTS "IX_Instruments_ServiceDueDate" ON "Instruments" ("ServiceDueDate")`,
    ]

    for (const query of queries) {
      try {
        await client.query(query)
      } catch (error: any) {
        // Ignore errors (columns might already exist)
      }
    }
    console.log('✓ Migration complete')
  } finally {
    client.release()
  }
}

async function convertAndImport() {
  // Use Python to convert Excel to JSON, then import
  const { execSync } = require('child_process')
  
  const tempJsonPath = path.join(__dirname, '../data/temp-instruments.json')
  
  // Ensure data directory exists
  const dataDir = path.dirname(tempJsonPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  console.log('Converting Excel to JSON...')
  try {
    const pythonScript = `
import json
import pandas as pd
import sys

excel_path = r'${excelPath.replace(/\\/g, '\\\\')}'
output_path = r'${tempJsonPath.replace(/\\/g, '\\\\')}'

df = pd.read_excel(excel_path)
print(f'Found {len(df)} rows')

column_mapping = {
    'Supplier': 'supplier',
    'Company / Manufacture': 'manufacturer',
    'Manufacturer': 'manufacturer',
    'Invoice Date': 'invoiceDate',
    'Invoice Number': 'invoiceNumber',
    'Serial Number': 'serialNumber',
    'Product Description': 'productDescription',
    'Short Description': 'shortDescription',
    'Area of use': 'areaOfUse',
    'Area of Use': 'areaOfUse',
    'Company / Mnfrct Product Code': 'productCode',
    'Product Code': 'productCode',
    'Single Unit Price (excl VAT) 2016 - 2018': 'unitPrice2016_2018',
    'Single Unit Price (excl VAT) 2019': 'unitPrice2019',
    'Single Unit Price (excl VAT) 2023': 'unitPrice2023',
    'Insurance purposes (Replacement value)': 'insuranceReplacementValue',
    'Type of Maintenance/Service': 'maintenanceType',
    'Service Due Date': 'serviceDueDate',
    'Smallest Single unit measurements for cost calculations': 'unitMeasurement',
}

instruments = []
for idx, row in df.iterrows():
    instrument = {}
    for excel_col, json_key in column_mapping.items():
        if excel_col in df.columns:
            value = row[excel_col]
            if pd.isna(value):
                continue
            if json_key in ['unitPrice2016_2018', 'unitPrice2019', 'unitPrice2023', 'insuranceReplacementValue']:
                if isinstance(value, str):
                    value = value.replace('R', '').replace('$', '').replace(',', '').strip()
                try:
                    instrument[json_key] = float(value) if value else None
                except:
                    pass
            elif json_key in ['invoiceDate', 'serviceDueDate']:
                if isinstance(value, pd.Timestamp):
                    instrument[json_key] = value.strftime('%Y-%m-%d')
                elif isinstance(value, str):
                    instrument[json_key] = value
            else:
                instrument[json_key] = str(value).strip() if value else None
    
    if 'serialNumber' not in instrument or not instrument['serialNumber']:
        continue
    
    if 'productDescription' not in instrument or not instrument['productDescription']:
        if 'shortDescription' in instrument and instrument['shortDescription']:
            instrument['productDescription'] = instrument['shortDescription']
        else:
            instrument['productDescription'] = instrument.get('serialNumber', 'Unknown')
    
    instruments.append(instrument)

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(instruments, f, indent=2, ensure_ascii=False)

print(f'Converted {len(instruments)} instruments')
`

    execSync(`python -c "${pythonScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, { stdio: 'inherit' })
    
    // Read the JSON and import
    const instruments = JSON.parse(fs.readFileSync(tempJsonPath, 'utf-8'))
    await importInstruments(instruments)
    
    // Clean up
    fs.unlinkSync(tempJsonPath)
  } catch (error: any) {
    console.error('Error converting file:', error.message)
    console.error('\nPlease ensure:')
    console.error('1. Python is installed')
    console.error('2. pandas and openpyxl are installed: pip install pandas openpyxl')
    process.exit(1)
  }
}

async function importInstruments(instruments: any[]) {
  const client = await pool.connect()
  
  try {
    console.log(`\nImporting ${instruments.length} instruments...`)
    
    let imported = 0
    let updated = 0
    let errors = 0

    for (const instrument of instruments) {
      try {
        // Check if exists
        const existing = await client.query(
          'SELECT "Id" FROM "Instruments" WHERE "SerialNumber" = $1',
          [instrument.serialNumber]
        )

        const id = existing.rows.length > 0 ? existing.rows[0].Id : crypto.randomUUID()
        const now = new Date()

        // Parse dates
        const invoiceDate = instrument.invoiceDate ? new Date(instrument.invoiceDate) : null
        const serviceDate = instrument.serviceDate ? new Date(instrument.serviceDate) : null
        const calibrationDate = instrument.calibrationDate ? new Date(instrument.calibrationDate) : null
        const serviceDueDate = instrument.serviceDueDate ? new Date(instrument.serviceDueDate) : null

        const name = instrument.shortDescription || instrument.productDescription || 'Unknown Instrument'

        if (existing.rows.length > 0) {
          await client.query(`
            UPDATE "Instruments"
            SET 
              "Name" = $1, "Supplier" = $2, "Manufacturer" = $3,
              "InvoiceDate" = $4, "InvoiceNumber" = $5, "ProductDescription" = $6,
              "ShortDescription" = $7, "AreaOfUse" = $8, "ProductCode" = $9,
              "UnitPrice2016_2018" = $10, "UnitPrice2019" = $11, "UnitPrice2023" = $12,
              "InsuranceReplacementValue" = $13, "MaintenanceType" = $14,
              "ServiceDueDate" = $15, "UnitMeasurement" = $16,
              "ServiceDate" = $17, "CalibrationDate" = $18, "UpdatedAt" = $19
            WHERE "Id" = $20
          `, [
            name, instrument.supplier || null, instrument.manufacturer || null,
            invoiceDate, instrument.invoiceNumber || null, instrument.productDescription || null,
            instrument.shortDescription || null, instrument.areaOfUse || null, instrument.productCode || null,
            instrument.unitPrice2016_2018 || null, instrument.unitPrice2019 || null, instrument.unitPrice2023 || null,
            instrument.insuranceReplacementValue || null, instrument.maintenanceType || null,
            serviceDueDate, instrument.unitMeasurement || null,
            serviceDate, calibrationDate, now, id,
          ])
          updated++
        } else {
          await client.query(`
            INSERT INTO "Instruments" (
              "Id", "Name", "SerialNumber", "Supplier", "Manufacturer",
              "InvoiceDate", "InvoiceNumber", "ProductDescription", "ShortDescription",
              "AreaOfUse", "ProductCode", "UnitPrice2016_2018", "UnitPrice2019",
              "UnitPrice2023", "InsuranceReplacementValue", "MaintenanceType",
              "ServiceDueDate", "UnitMeasurement", "ServiceDate", "CalibrationDate",
              "CreatedAt", "UpdatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          `, [
            id, name, instrument.serialNumber, instrument.supplier || null, instrument.manufacturer || null,
            invoiceDate, instrument.invoiceNumber || null, instrument.productDescription || null, instrument.shortDescription || null,
            instrument.areaOfUse || null, instrument.productCode || null, instrument.unitPrice2016_2018 || null, instrument.unitPrice2019 || null,
            instrument.unitPrice2023 || null, instrument.insuranceReplacementValue || null, instrument.maintenanceType || null,
            serviceDueDate, instrument.unitMeasurement || null, serviceDate, calibrationDate,
            now, now,
          ])
          imported++
        }
      } catch (error: any) {
        console.error(`Error importing ${instrument.productDescription || instrument.serialNumber}:`, error.message)
        errors++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('IMPORT COMPLETE!')
    console.log('='.repeat(60))
    console.log(`✓ Imported: ${imported}`)
    console.log(`✓ Updated: ${updated}`)
    if (errors > 0) {
      console.log(`⚠ Errors: ${errors}`)
    }
    console.log('\nView your instruments at: http://localhost:3000/instruments')
  } finally {
    client.release()
    await pool.end()
  }
}

async function main() {
  console.log('='.repeat(60))
  console.log('DIRECT INSTRUMENTS IMPORT')
  console.log('='.repeat(60))
  console.log(`File: ${excelPath}\n`)
  
  await runMigration()
  await convertAndImport()
}

main().catch(console.error)



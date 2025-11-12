/**
 * Script to import instruments/equipment from the asset register
 * 
 * This script expects a JSON file with the following structure:
 * [
 *   {
 *     "supplier": "AEC Amersham",
 *     "manufacturer": "Thermo Scientific",
 *     "invoiceDate": "2015-08-26",
 *     "invoiceNumber": "INV-12345",
 *     "serialNumber": "72211501612",
 *     "productDescription": "Eppendorf Research Plus Pipette",
 *     "shortDescription": "Pipette",
 *     "areaOfUse": "Extraction Room",
 *     "productCode": "PROD-001",
 *     "unitPrice2016_2018": 1500.00,
 *     "unitPrice2019": 1600.00,
 *     "unitPrice2023": 1800.00,
 *     "insuranceReplacementValue": 2000.00,
 *     "maintenanceType": "Annual Service",
 *     "serviceDueDate": "2024-12-31",
 *     "unitMeasurement": "1 each"
 *   },
 *   ...
 * ]
 * 
 * Usage:
 * 1. Export the spreadsheet to JSON format
 * 2. Update the file path below
 * 3. Run: npx tsx scripts/import-instruments.ts
 */

import { pool } from '../lib/db'
import crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

interface InstrumentImport {
  supplier?: string
  manufacturer?: string
  invoiceDate?: string
  invoiceNumber?: string
  serialNumber: string
  productDescription: string
  shortDescription?: string
  areaOfUse?: string
  productCode?: string
  unitPrice2016_2018?: number
  unitPrice2019?: number
  unitPrice2023?: number
  insuranceReplacementValue?: number
  maintenanceType?: string
  serviceDueDate?: string
  unitMeasurement?: string
  serviceDate?: string
  calibrationDate?: string
}

async function importInstruments() {
  const client = await pool.connect()
  
  try {
    // Read the JSON file
    const filePath = path.join(__dirname, '../data/instruments-import.json')
    
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`)
      console.log('\nPlease create a JSON file with the instrument data.')
      console.log('See the script comments for the expected format.')
      process.exit(1)
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const instruments: InstrumentImport[] = JSON.parse(fileContent)

    console.log(`Importing ${instruments.length} instruments...`)

    let imported = 0
    let updated = 0
    let errors = 0

    for (const instrument of instruments) {
      try {
        // Check if instrument already exists by serial number
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

        // Use productDescription as name, or shortDescription if available
        const name = instrument.shortDescription || instrument.productDescription || 'Unknown Instrument'

        if (existing.rows.length > 0) {
          // Update existing instrument
          await client.query(`
            UPDATE "Instruments"
            SET 
              "Name" = $1,
              "Supplier" = $2,
              "Manufacturer" = $3,
              "InvoiceDate" = $4,
              "InvoiceNumber" = $5,
              "ProductDescription" = $6,
              "ShortDescription" = $7,
              "AreaOfUse" = $8,
              "ProductCode" = $9,
              "UnitPrice2016_2018" = $10,
              "UnitPrice2019" = $11,
              "UnitPrice2023" = $12,
              "InsuranceReplacementValue" = $13,
              "MaintenanceType" = $14,
              "ServiceDueDate" = $15,
              "UnitMeasurement" = $16,
              "ServiceDate" = $17,
              "CalibrationDate" = $18,
              "UpdatedAt" = $19
            WHERE "Id" = $20
          `, [
            name,
            instrument.supplier || null,
            instrument.manufacturer || null,
            invoiceDate,
            instrument.invoiceNumber || null,
            instrument.productDescription || null,
            instrument.shortDescription || null,
            instrument.areaOfUse || null,
            instrument.productCode || null,
            instrument.unitPrice2016_2018 || null,
            instrument.unitPrice2019 || null,
            instrument.unitPrice2023 || null,
            instrument.insuranceReplacementValue || null,
            instrument.maintenanceType || null,
            serviceDueDate,
            instrument.unitMeasurement || null,
            serviceDate,
            calibrationDate,
            now,
            id,
          ])
          updated++
        } else {
          // Insert new instrument
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
            id,
            name,
            instrument.serialNumber,
            instrument.supplier || null,
            instrument.manufacturer || null,
            invoiceDate,
            instrument.invoiceNumber || null,
            instrument.productDescription || null,
            instrument.shortDescription || null,
            instrument.areaOfUse || null,
            instrument.productCode || null,
            instrument.unitPrice2016_2018 || null,
            instrument.unitPrice2019 || null,
            instrument.unitPrice2023 || null,
            instrument.insuranceReplacementValue || null,
            instrument.maintenanceType || null,
            serviceDueDate,
            instrument.unitMeasurement || null,
            serviceDate,
            calibrationDate,
            now,
            now,
          ])
          imported++
        }

        console.log(`✓ ${name} (${instrument.serialNumber})`)
      } catch (error) {
        console.error(`✗ Error importing ${instrument.productDescription}:`, error)
        errors++
      }
    }

    console.log('\n=== Import Summary ===')
    console.log(`Imported: ${imported}`)
    console.log(`Updated: ${updated}`)
    console.log(`Errors: ${errors}`)
    console.log(`Total: ${instruments.length}`)
  } finally {
    client.release()
    await pool.end()
  }
}

// Run the import
importInstruments().catch(console.error)


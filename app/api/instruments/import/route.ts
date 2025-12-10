import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instruments = await req.json()
    const client = await pool.connect()

    try {
      let imported = 0
      let updated = 0
      let errors = 0
      const errorDetails: string[] = []

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
        } catch (error: any) {
          errors++
          errorDetails.push(`${instrument.productDescription || 'Unknown'}: ${error.message}`)
        }
      }

      return NextResponse.json({
        success: true,
        imported,
        updated,
        errors,
        errorDetails: errors > 0 ? errorDetails : undefined,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Instrument import error:', error)
    return NextResponse.json(
      { error: 'Failed to import instruments' },
      { status: 500 }
    )
  }
}




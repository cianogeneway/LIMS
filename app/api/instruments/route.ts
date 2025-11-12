export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'
import crypto from 'crypto'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await pool.connect()
    try {
      const url = new URL(req.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
      const q = url.searchParams.get('q') || ''

      const offset = (Math.max(1, page) - 1) * pageSize

      // Build where clause for search
      const whereClauses: string[] = []
      const params: any[] = []
      let paramIdx = 1
      if (q) {
        whereClauses.push(`(i."Name" ILIKE $${paramIdx} OR i."SerialNumber" ILIKE $${paramIdx} OR i."ProductDescription" ILIKE $${paramIdx} OR i."Manufacturer" ILIKE $${paramIdx})`)
        params.push(`%${q}%`)
        paramIdx++
      }

      const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

      // Total count
      const countRes = await client.query(`SELECT COUNT(*)::int as count FROM "Instruments" i ${where}`, params)
      const total = countRes.rows[0].count as number

      // Query with pagination
      const query = `
        SELECT 
          i.*,
          COUNT(DISTINCT w."Id") as worklist_count,
          COUNT(DISTINCT m."Id") as maintenance_count
        FROM "Instruments" i
        LEFT JOIN "Worklists" w ON w."InstrumentId" = i."Id"
        LEFT JOIN "MaintenanceLogs" m ON m."InstrumentId" = i."Id"
        ${where}
        GROUP BY i."Id"
        ORDER BY i."CreatedAt" DESC
        LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
      `
      params.push(pageSize, offset)

      const result = await client.query(query, params)

      const instruments = result.rows.map(row => ({
        id: row.Id,
        name: row.Name,
        serialNumber: row.SerialNumber,
        supplier: row.Supplier,
        manufacturer: row.Manufacturer,
        invoiceDate: row.InvoiceDate,
        invoiceNumber: row.InvoiceNumber,
        productDescription: row.ProductDescription,
        shortDescription: row.ShortDescription,
        areaOfUse: row.AreaOfUse,
        productCode: row.ProductCode,
        unitPrice2016_2018: row.UnitPrice2016_2018,
        unitPrice2019: row.UnitPrice2019,
        unitPrice2023: row.UnitPrice2023,
        insuranceReplacementValue: row.InsuranceReplacementValue,
        maintenanceType: row.MaintenanceType,
        serviceDueDate: row.ServiceDueDate,
        unitMeasurement: row.UnitMeasurement,
        serviceDate: row.ServiceDate,
        calibrationDate: row.CalibrationDate,
        createdAt: row.CreatedAt,
        updatedAt: row.UpdatedAt,
        _count: {
          worklists: parseInt(row.worklist_count) || 0,
          maintenanceLogs: parseInt(row.maintenance_count) || 0,
        },
      }))

      return NextResponse.json({ data: instruments, total })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Instruments fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch instruments' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const client = await pool.connect()
    
    try {
      const id = crypto.randomUUID()
      const now = new Date()
      
      await client.query(`
        INSERT INTO "Instruments" ("Id", "Name", "SerialNumber", "ServiceDate", "CalibrationDate", "CreatedAt", "UpdatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        id,
        data.name,
        data.serialNumber || null,
        data.serviceDate ? new Date(data.serviceDate) : null,
        data.calibrationDate ? new Date(data.calibrationDate) : null,
        now,
        now,
      ])

      return NextResponse.json({
        id,
        name: data.name,
        serialNumber: data.serialNumber,
        serviceDate: data.serviceDate ? new Date(data.serviceDate) : undefined,
        calibrationDate: data.calibrationDate ? new Date(data.calibrationDate) : undefined,
        createdAt: now,
        updatedAt: now,
        _count: { worklists: 0, maintenanceLogs: 0 },
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Instrument creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create instrument' },
      { status: 500 }
    )
  }
}


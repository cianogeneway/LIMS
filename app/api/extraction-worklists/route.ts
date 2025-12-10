import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const pageSize = Math.min(100, parseInt(url.searchParams.get('pageSize') || '10'))
    const q = url.searchParams.get('q') || ''
    const category = url.searchParams.get('category') || ''
    const offset = (page - 1) * pageSize

    console.log('Category filter:', category)

    const client = await pool.connect()
    try {
      let countQuery = `SELECT COUNT(*) as total FROM "ExtractionWorklists"`
      let dataQuery = `SELECT * FROM "ExtractionWorklists"`
      const params: any[] = []
      const whereClauses: string[] = []

      if (q) {
        whereClauses.push(`(
          "Name" ILIKE $${params.length + 1}
          OR "ExtractionKitLot" ILIKE $${params.length + 1}
          OR "PerformedBy" ILIKE $${params.length + 1}
        )`)
        params.push(`%${q}%`)
      }

      if (category) {
        whereClauses.push(`"Category" = $${params.length + 1}`)
        params.push(category)
      }

      if (whereClauses.length > 0) {
        const whereClause = ` WHERE ` + whereClauses.join(' AND ')
        countQuery += whereClause
        dataQuery += whereClause
      }

      console.log('Count Query:', countQuery)
      console.log('Data Query:', dataQuery)
      console.log('Params:', params)

      dataQuery += `
        ORDER BY "Date" DESC, "CreatedAt" DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `
      params.push(pageSize, offset)

      // Build count params based on search and category filters
      const countParams: any[] = []
      if (q) countParams.push(`%${q}%`)
      if (category) countParams.push(category)

      const countResult = await client.query(countQuery, countParams)
      const total = parseInt(countResult.rows[0].total) || 0

      const result = await client.query(dataQuery, params)
      
      const worklists = result.rows.map(row => ({
        id: row.Id,
        name: row.Name,
        worklistType: row.WorklistType,
        category: row.Category,
        status: row.Status,
        date: row.Date,
        performedBy: row.PerformedBy,
        extractionKitLot: row.ExtractionKitLot,
        createdAt: row.CreatedAt,
        updatedAt: row.UpdatedAt,
        createdBy: row.CreatedBy,
      }))

      return NextResponse.json({ data: worklists, total })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('ExtractionWorklists fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch worklists' },
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
        INSERT INTO "ExtractionWorklists" (
          "Id", "Name", "WorklistType", "Status", "Date", "PerformedBy",
          "ExtractionKitLot", "QubitMixX1", "QubitMixXn4", "QubitReagent",
          "QubitBuffer", "KitLot", "KitExpiryDate", "AliquoteInfo",
          "StandardsInfo", "CreatedAt", "UpdatedAt", "CreatedBy"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        id,
        data.name || 'Automated DNA Extraction 32 Format',
        data.worklistType || 'AUTOMATED_DNA_EXTRACTION_32_FORMAT',
        data.status || 'DRAFT',
        data.date || now,
        data.performedBy || null,
        data.extractionKitLot || null,
        data.qubitMixX1 || 1,
        data.qubitMixXn4 || null,
        data.qubitReagent || 1,
        data.qubitBuffer || 199,
        data.kitLot || null,
        data.kitExpiryDate || null,
        data.aliquoteInfo || 'Aliquote 198ul and 2ul DNA',
        data.standardsInfo || 'Standards 190ul, 10ul Standard',
        now,
        now,
        session.user?.email || null,
      ])

      // Create 32 empty rows
      for (let i = 1; i <= 32; i++) {
        const rowId = crypto.randomUUID()
        await client.query(`
          INSERT INTO "ExtractionWorklistRows" (
            "Id", "WorklistId", "Well", "CreatedAt", "UpdatedAt"
          ) VALUES ($1, $2, $3, $4, $5)
        `, [rowId, id, i, now, now])
      }

      return NextResponse.json({
        id,
        name: data.name || 'Automated DNA Extraction 32 Format',
        worklistType: data.worklistType || 'AUTOMATED_DNA_EXTRACTION_32_FORMAT',
        status: data.status || 'DRAFT',
        date: data.date || now,
        performedBy: data.performedBy || null,
        extractionKitLot: data.extractionKitLot || null,
        createdAt: now,
        updatedAt: now,
        createdBy: session.user?.email || null,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('ExtractionWorklist creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create worklist' },
      { status: 500 }
    )
  }
}

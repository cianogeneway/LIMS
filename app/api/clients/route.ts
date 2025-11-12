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
    const offset = (page - 1) * pageSize

    const client = await pool.connect()
    try {
      let countQuery = `
        SELECT COUNT(*) as total
        FROM "Clients" c
      `
      let dataQuery = `
        SELECT 
          c.*,
          COUNT(s."Id") as sample_count
        FROM "Clients" c
        LEFT JOIN "Samples" s ON s."ClientId" = c."Id"
      `
      const params: any[] = []

      if (q) {
        const whereClause = `
          WHERE c."CompanyName" ILIKE $${params.length + 1}
          OR c."Email" ILIKE $${params.length + 1}
          OR c."ContactPerson" ILIKE $${params.length + 1}
        `
        countQuery += whereClause
        dataQuery += whereClause
        params.push(`%${q}%`)
      }

      dataQuery += `
        GROUP BY c."Id"
        ORDER BY c."CreatedAt" DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `
      params.push(pageSize, offset)

      const countResult = await client.query(
        countQuery,
        q ? [`%${q}%`] : []
      )
      const total = parseInt(countResult.rows[0].total) || 0

      const result = await client.query(dataQuery, params)
      
      const clients = result.rows.map(row => ({
        id: row.Id,
        companyName: row.CompanyName,
        organisationType: row.OrganisationType,
        vatRegistration: row.VatRegistration,
        address: row.Address,
        email: row.Email,
        contactNumber: row.ContactNumber,
        contactPerson: row.ContactPerson,
        sampleType: row.SampleType,
        createdAt: row.CreatedAt,
        updatedAt: row.UpdatedAt,
        _count: { samples: parseInt(row.sample_count) || 0 },
      }))
      
      return NextResponse.json({ data: clients, total })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Clients fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
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
        INSERT INTO "Clients" (
          "Id", "CompanyName", "OrganisationType", "VatRegistration", 
          "Address", "Email", "ContactNumber", "ContactPerson", 
          "SampleType", "CreatedAt", "UpdatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        id, data.companyName, data.organisationType, data.vatRegistration || null,
        data.address, data.email, data.contactNumber, data.contactPerson,
        data.sampleType, now, now
      ])
      
      const newClient = {
        id,
        ...data,
        createdAt: now,
        updatedAt: now,
        _count: { samples: 0 },
      }
      
      return NextResponse.json(newClient)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Client creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}



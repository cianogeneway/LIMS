export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'

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
      let countQuery = `SELECT COUNT(*) as total FROM "Suppliers"`
      let dataQuery = `SELECT * FROM "Suppliers"`
      const params: any[] = []

      if (q) {
        const whereClause = `
          WHERE "Name" ILIKE $${params.length + 1}
          OR "Email" ILIKE $${params.length + 1}
          OR "ContactPerson" ILIKE $${params.length + 1}
        `
        countQuery += whereClause
        dataQuery += whereClause
        params.push(`%${q}%`)
      }

      dataQuery += `
        ORDER BY "CreatedAt" DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `
      params.push(pageSize, offset)

      const countResult = await client.query(
        countQuery,
        q ? [`%${q}%`] : []
      )
      const total = parseInt(countResult.rows[0].total) || 0

      const result = await client.query(dataQuery, params)
      
      const suppliers = result.rows.map(row => ({
        id: row.Id,
        name: row.Name,
        contactPerson: row.ContactPerson,
        email: row.Email,
        phone: row.Phone,
        address: row.Address,
        createdAt: row.CreatedAt,
        updatedAt: row.UpdatedAt,
      }))

      return NextResponse.json({ data: suppliers, total })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Suppliers fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
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
        INSERT INTO "Suppliers" ("Id", "Name", "ContactPerson", "Email", "Phone", "Address", "CreatedAt", "UpdatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        id, data.name, data.contactPerson || null, data.email || null,
        data.phone || null, data.address || null, now, now
      ])

      return NextResponse.json({
        id,
        name: data.name,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        address: data.address,
        createdAt: now,
        updatedAt: now,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Supplier creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}


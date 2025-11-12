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
      let countQuery = `SELECT COUNT(*) as total FROM "StockItems"`
      let dataQuery = `
        SELECT 
          si.*,
          s."Name" as supplier_name
        FROM "StockItems" si
        LEFT JOIN "Suppliers" s ON s."Id" = si."SupplierId"
      `
      const params: any[] = []

      if (q) {
        const whereClause = `
          WHERE si."Name" ILIKE $${params.length + 1}
          OR si."Code" ILIKE $${params.length + 1}
        `
        countQuery += whereClause
        dataQuery += whereClause
        params.push(`%${q}%`)
      }

      dataQuery += `
        ORDER BY si."CreatedAt" DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `
      params.push(pageSize, offset)

      const countResult = await client.query(
        countQuery,
        q ? [`%${q}%`] : []
      )
      const total = parseInt(countResult.rows[0].total) || 0

      const result = await client.query(dataQuery, params)
      
      const stockItems = result.rows.map(row => ({
        id: row.Id,
        name: row.Name,
        code: row.Code,
        supplierId: row.SupplierId,
        supplier: row.SupplierId ? {
          id: row.SupplierId,
          name: row.supplier_name,
        } : null,
        currentPrice: parseFloat(row.CurrentPrice) || 0,
        unit: row.Unit,
        createdAt: row.CreatedAt,
        updatedAt: row.UpdatedAt,
        stockBatches: [],
      }))

      return NextResponse.json({ data: stockItems, total })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Stock fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock' },
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
        INSERT INTO "StockItems" ("Id", "Name", "Code", "SupplierId", "CurrentPrice", "Unit", "CreatedAt", "UpdatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        id, data.name, data.code || null, data.supplierId, data.currentPrice, data.unit || null, now, now
      ])

      return NextResponse.json({
        id,
        name: data.name,
        code: data.code,
        supplierId: data.supplierId,
        currentPrice: data.currentPrice,
        unit: data.unit,
        createdAt: now,
        updatedAt: now,
        stockBatches: [],
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Stock item creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create stock item' },
      { status: 500 }
    )
  }
}


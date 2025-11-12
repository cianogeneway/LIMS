import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'
import bcrypt from 'bcryptjs'

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
      let countQuery = `SELECT COUNT(*) as total FROM "Users"`
      let dataQuery = `SELECT "Id", "Email", "Name", "Role", "CreatedAt" FROM "Users"`
      const params: any[] = []

      if (q) {
        const whereClause = `
          WHERE "Email" ILIKE $${params.length + 1}
          OR "Name" ILIKE $${params.length + 1}
          OR "Role" ILIKE $${params.length + 1}
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
      
      const users = result.rows.map(row => ({
        id: row.Id,
        email: row.Email,
        name: row.Name,
        role: row.Role,
        createdAt: row.CreatedAt,
      }))

      return NextResponse.json({ data: users, total })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
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

    const { email, password, name, role } = await req.json()

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    try {
      const id = crypto.randomUUID()
      const hashedPassword = await bcrypt.hash(password, 10)
      const now = new Date()

      await client.query(`
        INSERT INTO "Users" ("Id", "Email", "Password", "Name", "Role", "CreatedAt", "UpdatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [id, email, hashedPassword, name, role, now, now])

      return NextResponse.json({
        id,
        email,
        name,
        role,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}



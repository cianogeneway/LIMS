import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, password, name, role } = await req.json()
    const client = await pool.connect()
    
    try {
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10)
        await client.query(`
          UPDATE "Users"
          SET "Email" = $1, "Password" = $2, "Name" = $3, "Role" = $4, "UpdatedAt" = $5
          WHERE "Id" = $6
        `, [email, hashedPassword, name, role, new Date(), params.id])
      } else {
        await client.query(`
          UPDATE "Users"
          SET "Email" = $1, "Name" = $2, "Role" = $3, "UpdatedAt" = $4
          WHERE "Id" = $5
        `, [email, name, role, new Date(), params.id])
      }
      
      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await pool.connect()
    
    try {
      await client.query('DELETE FROM "Users" WHERE "Id" = $1', [params.id])
      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('User deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Client } from 'pg'

export const dynamic = 'force-dynamic'

async function getDbClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })
  await client.connect()
  return client
}

// GET all reference ranges
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await getDbClient()

  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const testName = searchParams.get('testName')
    const isActive = searchParams.get('isActive')

    let query = 'SELECT * FROM "ReferenceRanges"'
    const params: any[] = []
    const conditions: string[] = []

    if (category) {
      conditions.push(`"Category" = $${params.length + 1}`)
      params.push(category)
    }

    if (testName) {
      conditions.push(`"TestName" ILIKE $${params.length + 1}`)
      params.push(`%${testName}%`)
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(`"IsActive" = $${params.length + 1}`)
      params.push(isActive === 'true')
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY "TestName", "ParameterName"'

    const result = await client.query(query, params)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching reference ranges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reference ranges' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}

// POST - Create new reference range
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await getDbClient()

  try {
    const data = await req.json()
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await client.query(
      `INSERT INTO "ReferenceRanges" (
        "Id", "TestName", "TestCode", "ParameterName", "MinValue", "MaxValue", "Unit",
        "AgeGroup", "Gender", "Interpretation", "CriticalLow", "CriticalHigh",
        "Category", "IsActive", "CreatedBy", "CreatedAt", "UpdatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        id,
        data.testName,
        data.testCode || null,
        data.parameterName,
        data.minValue || null,
        data.maxValue || null,
        data.unit || null,
        data.ageGroup || null,
        data.gender || 'All',
        data.interpretation || null,
        data.criticalLow || null,
        data.criticalHigh || null,
        data.category || null,
        data.isActive !== false,
        session.user?.email || 'system',
        now,
        now,
      ]
    )

    return NextResponse.json({ id }, { status: 201 })
  } catch (error) {
    console.error('Error creating reference range:', error)
    return NextResponse.json(
      { error: 'Failed to create reference range' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}

// DELETE - Delete reference range
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await getDbClient()

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await client.query('DELETE FROM "ReferenceRanges" WHERE "Id" = $1', [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting reference range:', error)
    return NextResponse.json(
      { error: 'Failed to delete reference range' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}

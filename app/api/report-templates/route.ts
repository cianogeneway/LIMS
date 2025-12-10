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

// GET all report templates
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await getDbClient()

  try {
    const { searchParams } = new URL(req.url)
    const templateType = searchParams.get('templateType')
    const isActive = searchParams.get('isActive')

    let query = 'SELECT * FROM "ReportTemplates"'
    const params: any[] = []
    const conditions: string[] = []

    if (templateType) {
      conditions.push(`"TemplateType" = $${params.length + 1}`)
      params.push(templateType)
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(`"IsActive" = $${params.length + 1}`)
      params.push(isActive === 'true')
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY "TemplateType", "TemplateName"'

    const result = await client.query(query, params)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching report templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report templates' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}

// POST - Create new report template
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
      `INSERT INTO "ReportTemplates" (
        "Id", "TemplateName", "TemplateType", "Description", "HeaderContent",
        "FooterContent", "BodyTemplate", "IncludeReferenceRanges", "IncludeInterpretation",
        "IncludeQCMetrics", "IsDefault", "IsActive", "CreatedBy", "CreatedAt", "UpdatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        id,
        data.templateName,
        data.templateType,
        data.description || null,
        data.headerContent || null,
        data.footerContent || null,
        data.bodyTemplate || null,
        data.includeReferenceRanges !== false,
        data.includeInterpretation !== false,
        data.includeQCMetrics || false,
        data.isDefault || false,
        data.isActive !== false,
        session.user?.email || 'system',
        now,
        now,
      ]
    )

    return NextResponse.json({ id }, { status: 201 })
  } catch (error) {
    console.error('Error creating report template:', error)
    return NextResponse.json(
      { error: 'Failed to create report template' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}

// DELETE - Delete report template
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

    await client.query('DELETE FROM "ReportTemplates" WHERE "Id" = $1', [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting report template:', error)
    return NextResponse.json(
      { error: 'Failed to delete report template' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}

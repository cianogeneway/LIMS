import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'

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

    const data = await req.json()
    const client = await pool.connect()
    
    try {
      const reviewDate = data.reviewDate ? new Date(data.reviewDate) : null
      const nextReviewDate = reviewDate ? new Date(new Date(reviewDate).setFullYear(reviewDate.getFullYear() + 1)) : null
      
      await client.query(`
        UPDATE "SOPs"
        SET 
          "Title" = $1,
          "Version" = $2,
          "Status" = $3,
          "ReviewDate" = $4,
          "NextReviewDate" = $5,
          "WorkingDocumentUrl" = $6,
          "ActiveDocumentUrl" = $7,
          "ArchivedDocumentUrl" = $8,
          "UpdatedAt" = $9
        WHERE "Id" = $10
      `, [
        data.title, data.version, data.status, reviewDate, nextReviewDate,
        data.workingDocumentUrl || null, data.activeDocumentUrl || null, data.archivedDocumentUrl || null,
        new Date(), params.id
      ])
      
      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('SOP update error:', error)
    return NextResponse.json(
      { error: 'Failed to update SOP' },
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
      await client.query('DELETE FROM "SOPs" WHERE "Id" = $1', [params.id])
      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('SOP deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete SOP' },
      { status: 500 }
    )
  }
}


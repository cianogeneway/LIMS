export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await pool.connect()
    try {
      const result = await client.query(`
        SELECT * FROM "SOPs"
        ORDER BY "CreatedAt" DESC
      `)
      
      const sops = result.rows.map(row => ({
        id: row.Id,
        title: row.Title,
        version: row.Version,
        status: row.Status,
        reviewDate: row.ReviewDate,
        nextReviewDate: row.NextReviewDate,
        workingDocumentUrl: row.WorkingDocumentUrl,
        activeDocumentUrl: row.ActiveDocumentUrl,
        archivedDocumentUrl: row.ArchivedDocumentUrl,
        fileUrl: row.FileUrl,
        createdAt: row.CreatedAt,
        updatedAt: row.UpdatedAt,
      }))

      return NextResponse.json(sops)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('SOPs fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SOPs' },
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
      const reviewDate = data.reviewDate ? new Date(data.reviewDate) : null
      const nextReviewDate = reviewDate ? new Date(new Date(reviewDate).setFullYear(reviewDate.getFullYear() + 1)) : null
      
      await client.query(`
        INSERT INTO "SOPs" (
          "Id", "Title", "Version", "Status", "ReviewDate", "NextReviewDate",
          "WorkingDocumentUrl", "ActiveDocumentUrl", "ArchivedDocumentUrl", "FileUrl",
          "CreatedAt", "UpdatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        id, data.title, data.version, data.status, reviewDate, nextReviewDate,
        data.workingDocumentUrl || null, data.activeDocumentUrl || null, data.archivedDocumentUrl || null,
        data.fileUrl || null,
        now, now
      ])
      
      const sop = {
        id,
        title: data.title,
        version: data.version,
        status: data.status,
        reviewDate,
        nextReviewDate,
        workingDocumentUrl: data.workingDocumentUrl || null,
        activeDocumentUrl: data.activeDocumentUrl || null,
        archivedDocumentUrl: data.archivedDocumentUrl || null,
        fileUrl: data.fileUrl || null,
        createdAt: now,
        updatedAt: now,
      }

      return NextResponse.json(sop)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('SOP creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create SOP' },
      { status: 500 }
    )
  }
}


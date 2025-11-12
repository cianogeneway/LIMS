import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'
import { sendSampleAcceptanceEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accepted, rejectionReason } = await req.json()
    const client = await pool.connect()
    
    try {
      // Get sample with client info for email
      const sampleResult = await client.query(`
        SELECT s.*, c."Email" as client_email, c."CompanyName"
        FROM "Samples" s
        JOIN "Clients" c ON s."ClientId" = c."Id"
        WHERE s."Id" = $1
      `, [params.id])

      if (sampleResult.rows.length === 0) {
        return NextResponse.json({ error: 'Sample not found' }, { status: 404 })
      }

      const sample = sampleResult.rows[0]
      const sampleId = sample.SampleId || sample.SampleKitId || params.id

      // Update sample acceptance status
      await client.query(`
        UPDATE "Samples"
        SET 
          "AcceptanceStatus" = $1,
          "RejectionReason" = $2,
          "Status" = $3,
          "UpdatedAt" = $4
        WHERE "Id" = $5
      `, [
        accepted ? 'ACCEPTED' : 'REJECTED',
        accepted ? null : (rejectionReason || 'No reason provided'),
        accepted ? 'ACCEPTED' : 'REJECTED',
        new Date(),
        params.id
      ])

      // Send email notification
      if (sample.client_email) {
        await sendSampleAcceptanceEmail(
          sample.client_email,
          sampleId,
          accepted,
          accepted ? undefined : (rejectionReason || 'No reason provided')
        )
      }

      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Sample acceptance error:', error)
    return NextResponse.json(
      { error: 'Failed to update sample acceptance' },
      { status: 500 }
    )
  }
}


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
      await client.query(`
        UPDATE "Samples"
        SET 
          "SampleId" = $1,
          "SampleKitId" = $2,
          "ClientId" = $3,
          "SampleType" = $4,
          "PatientName" = $5,
          "IdNumber" = $6,
          "Dob" = $7,
          "Age" = $8,
          "Sex" = $9,
          "ContactNumber" = $10,
          "Email" = $11,
          "SampleTypeEnum" = $12,
          "DateCollected" = $13,
          "CollectedBy" = $14,
          "ReferringPractitionerId" = $15,
          "Status" = $16,
          "AcceptanceStatus" = $17,
          "RejectionReason" = $18,
          "UpdatedAt" = $19
        WHERE "Id" = $20
      `, [
        data.sampleId || null,
        data.sampleKitId || null,
        data.clientId,
        data.sampleType,
        data.patientName || null,
        data.idNumber || null,
        data.dob ? new Date(data.dob) : null,
        data.age || null,
        data.sex || null,
        data.contactNumber || null,
        data.email || null,
        data.sampleTypeEnum || null,
        data.dateCollected ? new Date(data.dateCollected) : null,
        data.collectedBy || null,
        data.referringPractitionerId || null,
        data.status,
        data.acceptanceStatus || null,
        data.rejectionReason || null,
        new Date(),
        params.id
      ])
      
      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Sample update error:', error)
    return NextResponse.json(
      { error: 'Failed to update sample' },
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
      await client.query('DELETE FROM "Samples" WHERE "Id" = $1', [params.id])
      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Sample deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete sample' },
      { status: 500 }
    )
  }
}

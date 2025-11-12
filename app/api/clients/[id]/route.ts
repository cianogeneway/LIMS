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
    const dbClient = await pool.connect()
    
    try {
      await dbClient.query(`
        UPDATE "Clients"
        SET 
          "CompanyName" = $1,
          "OrganisationType" = $2,
          "VatRegistration" = $3,
          "Address" = $4,
          "Email" = $5,
          "ContactNumber" = $6,
          "ContactPerson" = $7,
          "SampleType" = $8,
          "UpdatedAt" = $9
        WHERE "Id" = $10
      `, [
        data.companyName, data.organisationType, data.vatRegistration || null,
        data.address, data.email, data.contactNumber, data.contactPerson,
        data.sampleType, new Date(), params.id
      ])
      
      return NextResponse.json({ success: true })
    } finally {
      dbClient.release()
    }
  } catch (error) {
    console.error('Client update error:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
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

    const dbClient = await pool.connect()
    
    try {
      await dbClient.query('DELETE FROM "Clients" WHERE "Id" = $1', [params.id])
      return NextResponse.json({ success: true })
    } finally {
      dbClient.release()
    }
  } catch (error) {
    console.error('Client deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}


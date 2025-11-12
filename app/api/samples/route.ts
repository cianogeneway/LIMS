import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'
import { generateSampleId } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '10'))
    const q = searchParams.get('q') || ''
    const offset = (page - 1) * pageSize

    const client = await pool.connect()
    try {
      let countQuery = `SELECT COUNT(*) as total FROM "Samples" s`
      let dataQuery = `
        SELECT 
          s.*,
          c."CompanyName" as client_company_name,
          c."Email" as client_email
        FROM "Samples" s
        LEFT JOIN "Clients" c ON c."Id" = s."ClientId"
        WHERE 1=1
      `
      const params: any[] = []
      let paramIndex = 1

      if (clientId) {
        dataQuery += ` AND s."ClientId" = $${paramIndex}`
        countQuery += ` WHERE s."ClientId" = $${paramIndex}`
        params.push(clientId)
        paramIndex++
      }
      if (status) {
        const whereOp = clientId ? ' AND' : ' WHERE'
        dataQuery += `${whereOp} s."Status" = $${paramIndex}`
        countQuery += `${whereOp} s."Status" = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      if (q) {
        const whereOp = clientId || status ? ' AND' : ' WHERE'
        dataQuery += `${whereOp} (s."SampleId" ILIKE $${paramIndex} OR s."SampleKitId" ILIKE $${paramIndex} OR c."CompanyName" ILIKE $${paramIndex})`
        countQuery += `${whereOp} (s."SampleId" ILIKE $${paramIndex} OR s."SampleKitId" ILIKE $${paramIndex} OR c."CompanyName" ILIKE $${paramIndex})`
        params.push(`%${q}%`)
        paramIndex++
      }

      dataQuery += ` ORDER BY s."CreatedAt" DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(pageSize, offset)

      const countResult = await client.query(countQuery)
      const total = parseInt(countResult.rows[0].total) || 0

      const result = await client.query(dataQuery, params)
      
      const samples = result.rows.map(row => ({
        id: row.Id,
        sampleId: row.SampleId,
        sampleKitId: row.SampleKitId,
        clientId: row.ClientId,
        client: row.ClientId ? {
          id: row.ClientId,
          companyName: row.client_company_name,
          email: row.client_email,
        } : null,
        sampleType: row.SampleType,
        patientName: row.PatientName,
        idNumber: row.IdNumber,
        dob: row.Dob,
        age: row.Age,
        sex: row.Sex,
        contactNumber: row.ContactNumber,
        email: row.Email,
        sampleTypeEnum: row.SampleTypeEnum,
        dateCollected: row.DateCollected,
        collectedBy: row.CollectedBy,
        referringPractitionerId: row.ReferringPractitionerId,
        dateReceivedInLab: row.DateReceivedInLab,
        status: row.Status,
        acceptanceStatus: row.AcceptanceStatus,
        rejectionReason: row.RejectionReason,
        createdAt: row.CreatedAt,
        updatedAt: row.UpdatedAt,
        workflows: [],
      }))

      return NextResponse.json({ data: samples, total })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Samples fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch samples' },
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
    const dbClient = await pool.connect()

    try {
      // Handle batch upload
      if (Array.isArray(data)) {
        const newSamples = []
        const now = new Date()

        for (const sampleData of data) {
          const id = crypto.randomUUID()
          const sampleId = sampleData.sampleId || generateSampleId()

          await dbClient.query(`
            INSERT INTO "Samples" (
              "Id", "SampleId", "SampleKitId", "ClientId", "SampleType",
              "DateReceivedInLab", "Status", "CreatedAt", "UpdatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            id, sampleId, null, sampleData.clientId, 'DE_IDENTIFIED',
            now, 'RECEIVED_BY_LAB', now, now
          ])

          newSamples.push({
            id,
            sampleId,
            sampleKitId: null,
            clientId: sampleData.clientId,
            sampleType: 'DE_IDENTIFIED',
            dateReceivedInLab: now,
            status: 'RECEIVED_BY_LAB',
            createdAt: now,
            updatedAt: now,
            workflows: [],
          })
        }

        return NextResponse.json(newSamples)
      }

      // Single sample
      const id = crypto.randomUUID()
      const now = new Date()
      const sampleId = data.sampleType === 'DE_IDENTIFIED' ? (data.sampleId || generateSampleId()) : null

      await dbClient.query(`
        INSERT INTO "Samples" (
          "Id", "SampleId", "SampleKitId", "ClientId", "SampleType",
          "PatientName", "IdNumber", "Dob", "Age", "Sex",
          "ContactNumber", "Email", "SampleTypeEnum", "DateCollected",
          "CollectedBy", "ReferringPractitionerId", "DateReceivedInLab",
          "Status", "AcceptanceStatus", "RejectionReason",
          "CreatedAt", "UpdatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      `, [
        id,
        sampleId,
        data.sampleType === 'KNOWN' ? data.sampleKitId : null,
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
        now,
        'RECEIVED_BY_LAB',
        null,
        null,
        now,
        now,
      ])

      const sample = {
        id,
        sampleId,
        sampleKitId: data.sampleType === 'KNOWN' ? data.sampleKitId : undefined,
        clientId: data.clientId,
        sampleType: data.sampleType,
        patientName: data.patientName,
        idNumber: data.idNumber,
        dob: data.dob ? new Date(data.dob) : undefined,
        age: data.age,
        sex: data.sex,
        contactNumber: data.contactNumber,
        email: data.email,
        sampleTypeEnum: data.sampleTypeEnum,
        dateCollected: data.dateCollected ? new Date(data.dateCollected) : undefined,
        collectedBy: data.collectedBy,
        referringPractitionerId: data.referringPractitionerId,
        dateReceivedInLab: now,
        status: 'RECEIVED_BY_LAB',
        acceptanceStatus: null,
        rejectionReason: null,
        createdAt: now,
        updatedAt: now,
        workflows: [],
      }

      return NextResponse.json(sample)
    } finally {
      dbClient.release()
    }
  } catch (error) {
    console.error('Sample creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create sample' },
      { status: 500 }
    )
  }
}


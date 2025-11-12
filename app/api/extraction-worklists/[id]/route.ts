import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = params.id
    const client = await pool.connect()

    try {
      // Get worklist header
      const headerResult = await client.query(
        `SELECT * FROM "ExtractionWorklists" WHERE "Id" = $1`,
        [id]
      )

      if (headerResult.rows.length === 0) {
        return NextResponse.json({ error: 'Worklist not found' }, { status: 404 })
      }

      const header = headerResult.rows[0]

      // Get all 32 rows
      const rowsResult = await client.query(
        `SELECT * FROM "ExtractionWorklistRows" WHERE "WorklistId" = $1 ORDER BY "Well" ASC`,
        [id]
      )

      // Get QC results if any exist
      const qcResult = await client.query(
        `SELECT * FROM "ExtractionQCResults" WHERE "WorklistId" = $1 ORDER BY "CreatedAt" DESC`,
        [id]
      )

      const worklist = {
        id: header.Id,
        name: header.Name,
        worklistType: header.WorklistType,
        status: header.Status,
        date: header.Date,
        performedBy: header.PerformedBy,
        extractionKitLot: header.ExtractionKitLot,
        qubitMixX1: header.QubitMixX1,
        qubitMixXn4: header.QubitMixXn4,
        qubitReagent: header.QubitReagent,
        qubitBuffer: header.QubitBuffer,
        kitLot: header.KitLot,
        kitExpiryDate: header.KitExpiryDate,
        aliquoteInfo: header.AliquoteInfo,
        standardsInfo: header.StandardsInfo,
        createdAt: header.CreatedAt,
        updatedAt: header.UpdatedAt,
        createdBy: header.CreatedBy,
        rows: rowsResult.rows.map(row => ({
          id: row.Id,
          well: row.Well,
          sampleId: row.SampleId,
          sampleName: row.SampleName,
          sex: row.Sex,
          sampleType: row.SampleType,
          comment: row.Comment,
          testRequested: row.TestRequested,
          nanoDropNgUl: row.NanoDropNgUl,
          a260_230: row.A260_230,
          a260_280: row.A260_280,
          gel: row.Gel,
          qubitNgUl: row.QubitNgUl,
          dilutionFactor: row.DilutionFactor,
          gelDilution: row.GelDilution,
          dH20Volume: row.dH20Volume,
          loadingDyeBuffer: row.LoadingDyeBuffer,
          createdAt: row.CreatedAt,
          updatedAt: row.UpdatedAt,
        })),
        qcResults: qcResult.rows.map(qc => ({
          id: qc.Id,
          sampleId: qc.SampleId,
          extractionType: qc.ExtractionType,
          qcMethod: qc.QCMethod,
          concentration: qc.Concentration,
          ratio260_280: qc.Ratio260_280,
          ratio260_230: qc.Ratio260_230,
          gelResult: qc.GelResult,
          qubitConcentration: qc.QubitConcentration,
          passed: qc.Passed,
          override: qc.Override,
          createdAt: qc.CreatedAt,
          updatedAt: qc.UpdatedAt,
        })),
      }

      return NextResponse.json(worklist)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('ExtractionWorklist fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch worklist' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = params.id
    const data = await req.json()
    const client = await pool.connect()

    try {
      const now = new Date()

      // Update header if provided
      if (data.header) {
        const h = data.header
        await client.query(`
          UPDATE "ExtractionWorklists"
          SET "Name" = $1, "Status" = $2, "Date" = $3, "PerformedBy" = $4,
              "ExtractionKitLot" = $5, "QubitMixX1" = $6, "QubitMixXn4" = $7,
              "QubitReagent" = $8, "QubitBuffer" = $9, "KitLot" = $10,
              "KitExpiryDate" = $11, "AliquoteInfo" = $12, "StandardsInfo" = $13,
              "UpdatedAt" = $14
          WHERE "Id" = $15
        `, [
          h.name, h.status, h.date, h.performedBy, h.extractionKitLot,
          h.qubitMixX1, h.qubitMixXn4, h.qubitReagent, h.qubitBuffer,
          h.kitLot, h.kitExpiryDate, h.aliquoteInfo, h.standardsInfo, now, id
        ])
      }

      // Update rows if provided
      if (data.rows && Array.isArray(data.rows)) {
        for (const row of data.rows) {
          await client.query(`
            UPDATE "ExtractionWorklistRows"
            SET "SampleId" = $1, "SampleName" = $2, "Sex" = $3,
                "SampleType" = $4, "Comment" = $5, "TestRequested" = $6,
                "NanoDropNgUl" = $7, "A260_230" = $8, "A260_280" = $9,
                "Gel" = $10, "QubitNgUl" = $11, "DilutionFactor" = $12,
                "GelDilution" = $13, "dH20Volume" = $14, "LoadingDyeBuffer" = $15,
                "UpdatedAt" = $16
            WHERE "Id" = $17
          `, [
            row.sampleId, row.sampleName, row.sex, row.sampleType,
            row.comment, row.testRequested, row.nanoDropNgUl, row.a260_230,
            row.a260_280, row.gel, row.qubitNgUl, row.dilutionFactor,
            row.gelDilution, row.dH20Volume, row.loadingDyeBuffer, now, row.id
          ])
        }
      }

      return NextResponse.json({ success: true, updatedAt: now })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('ExtractionWorklist update error:', error)
    return NextResponse.json(
      { error: 'Failed to update worklist' },
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

    const id = params.id
    const client = await pool.connect()

    try {
      // Delete in order: QC results, then rows, then header
      await client.query(
        `DELETE FROM "ExtractionQCResults" WHERE "WorklistId" = $1`,
        [id]
      )
      await client.query(
        `DELETE FROM "ExtractionWorklistRows" WHERE "WorklistId" = $1`,
        [id]
      )
      await client.query(
        `DELETE FROM "ExtractionWorklists" WHERE "Id" = $1`,
        [id]
      )

      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('ExtractionWorklist delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete worklist' },
      { status: 500 }
    )
  }
}

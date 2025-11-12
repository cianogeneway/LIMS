import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'
import { sendQCFailureEmail, sendResultsAvailableEmail } from '@/lib/email'
import { validatePathologyResult } from '@/lib/pathology-ranges'

export const dynamic = 'force-dynamic'

/**
 * Validate workflow results based on workflow type
 */
function validateWorkflowResult(
  workflowType: string,
  workflowSubType: string,
  resultData: any
): { passed: boolean; reason?: string } {
  switch (workflowType) {
    case 'OPENARRAY':
      // Call Rate: Greater than 97%
      const callRate = resultData.callRate
      if (callRate === undefined || callRate <= 97) {
        return { passed: false, reason: `Call rate ${callRate}% is below 97% threshold` }
      }
      return { passed: true }

    case 'QPCR':
      // Pass/Fail based on result data
      return { passed: resultData.passed === true, reason: resultData.reason }

    case 'MICROARRAY':
      // DQC: >= 0.82, QC call_rate: >= 97, Average call rate: >= 98.5, MAPD: <= 0.35, Waviness SD: <= 0
      const dqc = resultData.dqc
      const qcCallRate = resultData.qcCallRate
      const avgCallRate = resultData.avgCallRate
      const mapd = resultData.mapd
      const wavinessSD = resultData.wavinessSD

      if (dqc !== undefined && dqc < 0.82) {
        return { passed: false, reason: `DQC ${dqc} is below 0.82 threshold` }
      }
      if (qcCallRate !== undefined && qcCallRate < 97) {
        return { passed: false, reason: `QC call rate ${qcCallRate}% is below 97% threshold` }
      }
      if (avgCallRate !== undefined && avgCallRate < 98.5) {
        return { passed: false, reason: `Average call rate ${avgCallRate}% is below 98.5% threshold` }
      }
      if (mapd !== undefined && mapd > 0.35) {
        return { passed: false, reason: `MAPD ${mapd} is above 0.35 threshold` }
      }
      if (wavinessSD !== undefined && wavinessSD > 0) {
        return { passed: false, reason: `Waviness SD ${wavinessSD} is above 0 threshold` }
      }
      return { passed: true }

    case 'NEXT_GENERATION_SEQUENCING':
      if (workflowSubType === 'SHOTGUN') {
        // Data output: >= 500Mb
        const dataOutput = resultData.dataOutput // in MB
        if (dataOutput === undefined || dataOutput < 500) {
          return { passed: false, reason: `Data output ${dataOutput}MB is below 500MB threshold` }
        }
      }
      return { passed: true }

    case 'FRAGMENT_ANALYSIS':
      if (workflowSubType === 'PATERNITY_KINSHIP') {
        // Pass/Fail
        return { passed: resultData.passed === true, reason: resultData.reason }
      }
      return { passed: true }

    case 'SANGER_SEQUENCING':
      // Pass/Fail
      return { passed: resultData.passed === true, reason: resultData.reason }

    case 'PATHOLOGY':
      // Pathology validation uses reference ranges
      // This will be handled separately with sample sex/age
      return { passed: true, reason: 'Pathology validation requires sample demographics' }

    default:
      // For other workflow types, assume passed if no validation needed
      return { passed: resultData.passed !== false }
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const { sampleId, workflowType, workflowSubType, resultData, override } = data

    if (!sampleId || !workflowType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    try {
      // Get sample info for email
      const sampleResult = await client.query(`
        SELECT s.*, c."Email" as client_email, c."CompanyName"
        FROM "Samples" s
        JOIN "Clients" c ON s."ClientId" = c."Id"
        WHERE s."Id" = $1
      `, [sampleId])

      if (sampleResult.rows.length === 0) {
        return NextResponse.json({ error: 'Sample not found' }, { status: 404 })
      }

      const sample = sampleResult.rows[0]

      // Validate result
      let validation: { passed: boolean; reason?: string; evaluations?: any[] }
      
      if (workflowType === 'PATHOLOGY') {
        // Use pathology-specific validation with reference ranges
        const pathologyValidation = validatePathologyResult(
          workflowSubType || '',
          resultData,
          sample.Sex,
          sample.Age
        )
        validation = {
          passed: pathologyValidation.passed,
          reason: pathologyValidation.reason,
          evaluations: pathologyValidation.evaluations,
        }
      } else {
        validation = validateWorkflowResult(workflowType, workflowSubType, resultData)
      }
      
      const passed = override || validation.passed

      // Create workflow result
      const id = crypto.randomUUID()
      const now = new Date()

      // Include evaluations in result data for pathology
      const resultDataToStore = workflowType === 'PATHOLOGY' && validation.evaluations
        ? { ...resultData, evaluations: validation.evaluations }
        : resultData

      await client.query(`
        INSERT INTO "WorkflowResults" (
          "Id", "SampleId", "WorkflowType", "WorkflowSubType",
          "Passed", "ResultData", "CreatedAt", "UpdatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        id,
        sampleId,
        workflowType,
        workflowSubType || null,
        passed,
        JSON.stringify(resultDataToStore),
        now,
        now,
      ])

      // Update sample status
      let newStatus = sample.Status
      if (passed) {
        // Check if all workflows are complete
        const allWorkflowsResult = await client.query(`
          SELECT COUNT(*) as total,
                 SUM(CASE WHEN wr."Passed" = true THEN 1 ELSE 0 END) as passed
          FROM "SampleWorkflows" sw
          LEFT JOIN "WorkflowResults" wr ON sw."SampleId" = wr."SampleId" 
            AND sw."WorkflowType" = wr."WorkflowType"
            AND (sw."WorkflowSubType" = wr."WorkflowSubType" OR (sw."WorkflowSubType" IS NULL AND wr."WorkflowSubType" IS NULL))
          WHERE sw."SampleId" = $1
        `, [sampleId])

        const { total, passed: passedCount } = allWorkflowsResult.rows[0]
        if (parseInt(total) === parseInt(passedCount)) {
          newStatus = 'COMPLETED'
        } else {
          newStatus = 'PROCESSING'
        }
      } else {
        newStatus = 'FAILED'
      }

      await client.query(`
        UPDATE "Samples"
        SET "Status" = $1, "UpdatedAt" = $2
        WHERE "Id" = $3
      `, [newStatus, now, sampleId])

      // Send email notifications
      if (sample.client_email) {
        const sampleIdDisplay = sample.SampleId || sample.SampleKitId || sampleId
        if (!passed && !override) {
          await sendQCFailureEmail(
            sample.client_email,
            sampleIdDisplay,
            `${workflowType} ${workflowSubType || ''}`,
            validation.reason || 'Quality control failure'
          )
        } else if (newStatus === 'COMPLETED') {
          await sendResultsAvailableEmail(sample.client_email, sampleIdDisplay, true)
        } else if (newStatus === 'FAILED') {
          await sendResultsAvailableEmail(sample.client_email, sampleIdDisplay, false)
        }
      }

      return NextResponse.json({
        id,
        sampleId,
        workflowType,
        workflowSubType,
        passed,
        resultData,
        createdAt: now,
        updatedAt: now,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Workflow result error:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow result' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sampleId = searchParams.get('sampleId')

    const client = await pool.connect()
    
    try {
      let query = 'SELECT * FROM "WorkflowResults"'
      const params: any[] = []

      if (sampleId) {
        query += ' WHERE "SampleId" = $1'
        params.push(sampleId)
      }

      query += ' ORDER BY "CreatedAt" DESC'

      const result = await client.query(query, params)

      const results = result.rows.map(row => ({
        id: row.Id,
        sampleId: row.SampleId,
        workflowType: row.WorkflowType,
        workflowSubType: row.WorkflowSubType,
        passed: row.Passed,
        resultData: typeof row.ResultData === 'string' ? JSON.parse(row.ResultData) : row.ResultData,
        createdAt: row.CreatedAt,
        updatedAt: row.UpdatedAt,
      }))

      return NextResponse.json(results)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Workflow results fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow results' },
      { status: 500 }
    )
  }
}


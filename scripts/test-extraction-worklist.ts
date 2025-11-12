import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    'postgresql://rx:qwe12345_@rxg.postgres.database.azure.com:5432/Lims?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
})

async function testWorklistSystem() {
  const client = await pool.connect()
  try {
    console.log('🧪 Testing DNA Extraction Worklist System\n')

    // Test 1: Create a sample worklist
    console.log('Test 1: Creating sample worklist...')
    const worklistId = crypto.randomUUID()
    const now = new Date()

    await client.query(`
      INSERT INTO "ExtractionWorklists" (
        "Id", "Name", "WorklistType", "Status", "Date", "PerformedBy",
        "ExtractionKitLot", "QubitMixX1", "QubitMixXn4", "QubitReagent",
        "QubitBuffer", "KitLot", "KitExpiryDate", "AliquoteInfo",
        "StandardsInfo", "CreatedAt", "UpdatedAt", "CreatedBy"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    `, [
      worklistId,
      'Test DNA Extraction Worklist',
      'AUTOMATED_DNA_EXTRACTION_32_FORMAT',
      'DRAFT',
      now,
      'Test Technician',
      'KIT-TEST-001',
      1, 4, 1, 199,
      'KL-2024-001',
      new Date('2025-12-31'),
      'Aliquote 198ul and 2ul DNA',
      'Standards 190ul, 10ul Standard',
      now, now, 'test@example.com'
    ])
    console.log('✅ Created worklist:', worklistId)

    // Test 2: Create 32 empty rows
    console.log('\nTest 2: Creating 32 sample rows...')
    for (let i = 1; i <= 32; i++) {
      const rowId = crypto.randomUUID()
      await client.query(`
        INSERT INTO "ExtractionWorklistRows" (
          "Id", "WorklistId", "Well", "CreatedAt", "UpdatedAt"
        ) VALUES ($1, $2, $3, $4, $5)
      `, [rowId, worklistId, i, now, now])
    }
    console.log('✅ Created 32 rows')

    // Test 3: Update some sample data
    console.log('\nTest 3: Adding sample data to rows 1-5...')
    const samples = [
      { well: 1, sampleId: 'SAMPLE001', name: 'Patient Sample 001' },
      { well: 2, sampleId: 'SAMPLE002', name: 'Patient Sample 002' },
      { well: 3, sampleId: 'SAMPLE003', name: 'Patient Sample 003' },
      { well: 4, sampleId: 'SAMPLE004', name: 'Patient Sample 004' },
      { well: 5, sampleId: 'SAMPLE005', name: 'Patient Sample 005' },
    ]

    for (const sample of samples) {
      await client.query(`
        UPDATE "ExtractionWorklistRows"
        SET "SampleId" = $1, "SampleName" = $2, "SampleType" = $3,
            "NanoDropNgUl" = $4, "A260_230" = $5, "A260_280" = $6,
            "QubitNgUl" = $7, "DilutionFactor" = $8,
            "UpdatedAt" = $9
        WHERE "WorklistId" = $10 AND "Well" = $11
      `, [
        sample.sampleId,
        sample.name,
        'BLOOD',
        150.5,
        1.8,
        1.7,
        148.2,
        1.0,
        now,
        worklistId,
        sample.well
      ])
    }
    console.log('✅ Added sample data')

    // Test 4: Verify data
    console.log('\nTest 4: Verifying data...')
    const worklistResult = await client.query(
      `SELECT * FROM "ExtractionWorklists" WHERE "Id" = $1`,
      [worklistId]
    )
    console.log(`✅ Worklist found: "${worklistResult.rows[0].Name}"`)

    const rowsResult = await client.query(
      `SELECT * FROM "ExtractionWorklistRows" WHERE "WorklistId" = $1 ORDER BY "Well" ASC`,
      [worklistId]
    )
    console.log(`✅ Total rows: ${rowsResult.rows.length}`)
    console.log(`✅ Rows with sample data: ${rowsResult.rows.filter(r => r.SampleId).length}`)

    // Test 5: Test QC Results
    console.log('\nTest 5: Creating QC result...')
    const firstRow = rowsResult.rows[0]
    const qcId = crypto.randomUUID()

    await client.query(`
      INSERT INTO "ExtractionQCResults" (
        "Id", "WorklistId", "RowId", "SampleId",
        "ExtractionType", "QCMethod",
        "Concentration", "Ratio260_280", "Ratio260_230",
        "Passed", "CreatedAt", "UpdatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      qcId,
      worklistId,
      firstRow.Id,
      firstRow.SampleId,
      'DNA_EXTRACTION',
      'NANODROP',
      150.5,
      1.7,
      1.8,
      true,
      now,
      now
    ])
    console.log('✅ Created QC result')

    const qcResult = await client.query(
      `SELECT * FROM "ExtractionQCResults" WHERE "WorklistId" = $1`,
      [worklistId]
    )
    console.log(`✅ QC Results: ${qcResult.rows.length}`)

    console.log('\n' + '='.repeat(50))
    console.log('🎉 All tests passed!')
    console.log('='.repeat(50))
    console.log('\nSummary:')
    console.log(`- Worklist ID: ${worklistId}`)
    console.log(`- Total Rows: ${rowsResult.rows.length}`)
    console.log(`- Rows with data: ${rowsResult.rows.filter(r => r.SampleId).length}`)
    console.log(`- QC Results: ${qcResult.rows.length}`)
    console.log('\nYou can now access this worklist at:')
    console.log(`http://localhost:3000/extraction-worklists/${worklistId}`)

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

testWorklistSystem()

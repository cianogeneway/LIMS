import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://rx:qwe12345_@rxg.postgres.database.azure.com:5432/Lims?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function updateWorklistName(worklistId: string, newName: string) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'UPDATE "ExtractionWorklists" SET "Name" = $1 WHERE "Id" = $2',
      [newName, worklistId]
    );

    console.log(`Updated worklist ${worklistId} name to "${newName}"`);
    console.log(`Rows affected: ${result.rowCount}`);
  } catch (error) {
    console.error('Error updating worklist name:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Usage: npx tsx scripts/update-worklist-name.ts <worklistId> "<newName>"
const worklistId = process.argv[2];
const newName = process.argv[3];

if (!worklistId || !newName) {
  console.error('Usage: npx tsx scripts/update-worklist-name.ts <worklistId> "<newName>"');
  process.exit(1);
}

updateWorklistName(worklistId, newName);
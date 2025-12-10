/**
 * Quick import script - Run this after converting your spreadsheet to JSON
 * Usage: node scripts/quick-import.js [path-to-json-file]
 */

const fs = require('fs');
const path = require('path');

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const JSON_FILE = process.argv[2] || 'data/instruments-import.json';

async function runMigration() {
  console.log('Running database migration...');
  try {
    const response = await fetch(`${API_BASE}/api/instruments/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Note: In production, you'd need to include session cookie
    });
    
    const data = await response.json();
    if (response.ok && data.success) {
      console.log('✓ Migration completed successfully');
      return true;
    } else {
      console.log('⚠ Migration completed with warnings:', data);
      return true; // Continue anyway
    }
  } catch (error) {
    console.log('⚠ Migration check failed (may already be done):', error.message);
    return true; // Continue anyway
  }
}

async function importInstruments(jsonPath) {
  console.log(`\nReading JSON file: ${jsonPath}`);
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: File not found: ${jsonPath}`);
    process.exit(1);
  }
  
  const fileContent = fs.readFileSync(jsonPath, 'utf-8');
  const instruments = JSON.parse(fileContent);
  
  console.log(`Found ${instruments.length} instruments to import`);
  
  console.log('\nImporting instruments...');
  try {
    const response = await fetch(`${API_BASE}/api/instruments/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(instruments),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✓ Import completed successfully!');
      console.log(`  - Imported: ${data.imported}`);
      console.log(`  - Updated: ${data.updated}`);
      if (data.errors > 0) {
        console.log(`  - Errors: ${data.errors}`);
        if (data.errorDetails) {
          console.log('\nError details:');
          data.errorDetails.forEach((err, i) => {
            console.log(`  ${i + 1}. ${err}`);
          });
        }
      }
    } else {
      console.error('\n✗ Import failed:', data);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Import error:', error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Quick Instruments Import');
  console.log('='.repeat(60));
  
  // Note: This script requires the server to be running and you to be logged in
  // For a fully automated solution, use the web interface at /instruments/import
  
  console.log('\n⚠ Note: This script requires:');
  console.log('  1. Next.js server running (npm run dev)');
  console.log('  2. You to be logged in (session cookie)');
  console.log('\nFor easier import, use the web interface:');
  console.log('  http://localhost:3000/instruments/import\n');
  
  // Try to run migration
  await runMigration();
  
  // Import instruments
  const jsonPath = path.resolve(JSON_FILE);
  await importInstruments(jsonPath);
  
  console.log('\n' + '='.repeat(60));
  console.log('Done! Check your instruments at:');
  console.log('  http://localhost:3000/instruments');
  console.log('='.repeat(60));
}

main().catch(console.error);




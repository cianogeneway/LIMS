import { pool } from '../lib/db'

// Client data from both spreadsheets
// First spreadsheet: Company info (Company Name, Code, Contact Number, Email, Addresses)
// Second spreadsheet: Contact person info (Company, Title, Name, Surname, Email, Position, Job, Contact number)
const clients = [
  {
    companyName: 'Geneway',
    code: 'GWY',
    companyContactNumber: '+27 12 346 2469',
    companyEmail: 'info@geneway.co.za',
    physicalAddress: 'Alenti Office Park, Building B, 457 Witherite Road, The Willow, Pretoria, 0040',
    billingAddress: 'Alenti Office Park, Building B, 457 Witherite Road, The Willow, Pretoria, 0040',
    postalAddress: null,
    // Contact person from second spreadsheet
    contactPerson: 'Ms Ruchelle Bosch',
    contactEmail: 'ruchelle@geneway.co.za',
    contactNumber: '+27 12 346 2469',
    contactPosition: 'Administrator',
    contactJob: 'Sales'
  },
  {
    companyName: 'Optiway',
    code: 'OPT',
    companyContactNumber: '+27 12 346 2469',
    companyEmail: 'info@optiway.co.za',
    physicalAddress: 'Alenti Office Park, Building B, 457 Witherite Road, The Willow, Pretoria, 0040',
    billingAddress: 'Alenti Office Park, Building B, 457 Witherite Road, The Willow, Pretoria, 0040',
    postalAddress: null,
    contactPerson: 'Ms Christa North',
    contactEmail: 'Christa@optiway.co.za',
    contactNumber: '+27 012 346 2469',
    contactPosition: 'Clinical specialist',
    contactJob: 'Sales'
  },
  {
    companyName: 'Intelligene',
    code: 'INT',
    companyContactNumber: '+27 12 845 0024',
    companyEmail: 'info@intelligene.health',
    physicalAddress: 'Alenti Office Park, Building B, 457 Witherite Road, The Willow, Pretoria, 0040',
    billingAddress: 'Alenti Office Park, Building B, 457 Witherite Road, The Willow, Pretoria, 0040',
    postalAddress: null,
    contactPerson: 'Ms Elzhane Maas',
    contactEmail: 'Elzhane@intelligene.health',
    contactNumber: '+27 12 845 0024',
    contactPosition: 'Head of the lab',
    contactJob: 'Sales'
  },
  {
    companyName: 'Enbiosis SA',
    code: 'ENB',
    companyContactNumber: '+27 12 845 0045',
    companyEmail: 'info@enbiosissa.health',
    physicalAddress: 'Alenti Office Park, Building B, 457 Witherite Road, The Willow, Pretoria, 0040',
    billingAddress: 'Alenti Office Park, Building B, 457 Witherite Road, The Willow, Pretoria, 0040',
    postalAddress: null,
    contactPerson: 'Ms Lize Kruger',
    contactEmail: 'Lize@enbiosissa.health',
    contactNumber: '+27 12 845 0045',
    contactPosition: 'Sales Executive',
    contactJob: 'Sales'
  },
  {
    companyName: 'iScreen',
    code: 'iSCR',
    companyContactNumber: null,
    companyEmail: 'emma@i-screen.me',
    physicalAddress: '108 Main Street, Upper Hutt, Upper Hutt, 5018, New Zealand',
    billingAddress: '108 Main Street, Upper Hutt, Upper Hutt, 5018, New Zealand',
    postalAddress: null,
    contactPerson: 'Ms Emma Williams',
    contactEmail: 'emma@i-screen.me',
    contactNumber: null,
    contactPosition: 'CEO',
    contactJob: 'Sales'
  },
  {
    companyName: 'Antares Genomics',
    code: 'ATG',
    companyContactNumber: '+2772 542 2162',
    companyEmail: 'info@antaresgenomics.co.za',
    physicalAddress: '8th Floor, Convention Tower, Heerengracht Street, Foreshore, Cape Town, 8001',
    billingAddress: '8th Floor, Convention Tower, Heerengracht Street, Foreshore, Cape Town, 8001',
    postalAddress: null,
    contactPerson: 'Ms Eshara Chotto',
    contactEmail: 'eshara@antaresgenomics.co.za',
    contactNumber: '+27 72 542 2162',
    contactPosition: 'Business Development',
    contactJob: 'Sales'
  },
  {
    companyName: 'Enbiosis Turkey',
    code: 'ENBT',
    companyContactNumber: null,
    companyEmail: 'byagmur@enbiosis.com',
    physicalAddress: '25 Cabot Square, London E14 4QZ, UK',
    billingAddress: '25 Cabot Square, London E14 4QZ, UK',
    postalAddress: null,
    contactPerson: 'Mr Bugrahan Yagmur',
    contactEmail: 'byagmur@enbiosis.com',
    contactNumber: null,
    contactPosition: 'Sales',
    contactJob: 'Sales'
  },
  {
    companyName: 'NIBIO',
    code: 'NIBIO',
    companyContactNumber: null,
    companyEmail: 'inebotha.za@gmail.com',
    physicalAddress: null,
    billingAddress: null,
    postalAddress: null,
    contactPerson: 'Ms Ine Botha',
    contactEmail: 'inebotha.za@gmail.com',
    contactNumber: null,
    contactPosition: 'Student',
    contactJob: 'Research'
  }
]

async function importClients() {
  const client = await pool.connect()
  try {
    const now = new Date()
    let imported = 0
    let skipped = 0

    for (const clientData of clients) {
      // Check if client already exists
      const existing = await client.query(
        'SELECT "Id" FROM "Clients" WHERE "CompanyName" = $1',
        [clientData.companyName]
      )

      // Use contact person email if available, otherwise use company email
      const email = clientData.contactEmail || clientData.companyEmail || ''
      
      // Use contact person name from second spreadsheet
      const contactPerson = clientData.contactPerson || clientData.companyName
      
      // Use contact person number if available, otherwise company contact number, or empty string (required field)
      const contactNumber = clientData.contactNumber || clientData.companyContactNumber || ''
      
      // Use physical address if available, otherwise billing address, or empty string (required field)
      const address = clientData.physicalAddress || clientData.billingAddress || ''

      if (existing.rows.length > 0) {
        // Update existing client with contact person info from second spreadsheet
        await client.query(`
          UPDATE "Clients"
          SET 
            "Email" = $1,
            "ContactNumber" = $2,
            "ContactPerson" = $3,
            "Address" = $4,
            "UpdatedAt" = $5
          WHERE "CompanyName" = $6
        `, [
          email,
          contactNumber,
          contactPerson,
          address,
          now,
          clientData.companyName
        ])
        console.log(`Updated: ${clientData.companyName}`)
        imported++
      } else {
        // Insert new client
        const id = crypto.randomUUID()
        await client.query(`
          INSERT INTO "Clients" (
            "Id", 
            "CompanyName", 
            "OrganisationType", 
            "VatRegistration", 
            "Address", 
            "Email", 
            "ContactNumber", 
            "ContactPerson", 
            "SampleType", 
            "CreatedAt", 
            "UpdatedAt"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          id,
          clientData.companyName,
          'CLINIC', // Default organisation type
          null, // VAT registration not provided
          address,
          email,
          contactNumber,
          contactPerson,
          'KNOWN', // Default sample type
          now,
          now
        ])
        console.log(`Imported: ${clientData.companyName}`)
        imported++
      }
    }

    console.log(`\nImport/Update complete!`)
    console.log(`Processed: ${imported}`)
  } catch (error) {
    console.error('Import error:', error)
  } finally {
    client.release()
    process.exit(0)
  }
}

importClients()


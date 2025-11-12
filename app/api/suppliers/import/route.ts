import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

const suppliers = [
  { name: 'AEC Amersham', contactPerson: 'Ms Lulu Mmade', email: 'lulu@aecam.co.za', phone: null, address: null },
  { name: 'Labotec', contactPerson: 'Ms Thobeka Ntshalintshali', email: 'thobekan@labotec.co.za', phone: null, address: null },
  { name: 'Metro Home Center', contactPerson: null, email: null, phone: null, address: null },
  { name: 'Merck (Sigma-Aldrich)', contactPerson: null, email: null, phone: null, address: null },
  { name: 'Sep Sci', contactPerson: null, email: null, phone: null, address: null },
  { name: 'Lasec', contactPerson: 'Ms Kgothatso Meno', email: 'kgothatso.meno@lasec.com', phone: null, address: null },
  { name: 'Inqaba - General', contactPerson: 'Mr Ernest Mokoena', email: 'ernest.mokoena@inqababiotec.co.za', phone: null, address: '525 Justice Mahomed Street Muckleneuk, Pretoria, Gauteng, 0002, South Africa' },
  { name: 'Inqaba - Bioinformatics', contactPerson: 'Mr Hamilton Ganesan', email: 'hamilton.ganesan@inqababiotec.co.za', phone: null, address: '525 Justice Mahomed Street Muckleneuk, Pretoria, Gauteng, 0002, South Africa' },
  { name: 'LTC Thermo - General', contactPerson: 'Ms Tsholofelo Rampa', email: 'tsholofelo.rampa@thermofisher.com', phone: '27609787379', address: 'Building 15, The Woodlands Office Park, Woodlands Drive, Woodmead, 2191, Johannesburg, South Africa' },
  { name: 'LTC Thermo - Microarray', contactPerson: 'Ms Lynda Demir Kassama', email: 'lynda.kassama@thermofisher.com', phone: null, address: 'Building 15, The Woodlands Office Park, Woodlands Drive, Woodmead, 2191, Johannesburg, South Africa' },
  { name: 'LTC Thermo - Fertility', contactPerson: 'Ms Jenna van den Mu', email: 'Jenna.vandenMunckhof@thermofisher.com', phone: '+27 (71) 350 2054', address: 'Building 15, The Woodlands Office Park, Woodlands Drive, Woodmead, 2191, Johannesburg, South Africa' },
  { name: 'Selectech', contactPerson: null, email: null, phone: null, address: null },
  { name: 'Davies Diagnostics', contactPerson: 'Ms Thembeka Shezi', email: 'thembeka@daviesdiag.co.za', phone: null, address: null },
  { name: 'Sartorius', contactPerson: 'Ms Ntombi Boshoma', email: 'ntombi.boshoma@sartorius.com', phone: null, address: null },
  { name: 'Biodex', contactPerson: 'Ms Thandi Ndlangamandla', email: 'thandeka@biodex.co.za', phone: null, address: 'Unit 13, Meadowhill Industrial Park, 3 Essex Street, Meadowdale, South Africa' },
  { name: 'Whitehead Scientific - NGS', contactPerson: null, email: null, phone: null, address: null },
  { name: 'Whitehead Scientific - General', contactPerson: 'Ms Shaunagh Lombard', email: 'shaunagh@whitesci.co.za', phone: null, address: null },
  { name: 'Takealot', contactPerson: null, email: null, phone: null, address: null },
  { name: 'Tshwane Electronic Waste company', contactPerson: null, email: null, phone: null, address: null },
  { name: 'Chassis', contactPerson: null, email: null, phone: null, address: null },
  { name: 'ESCO', contactPerson: 'Ms Lize-Marie Chapman', email: 'lizemarie.chapman@escolifesciences.com', phone: null, address: null },
  { name: 'Vivid Air', contactPerson: 'Mr Yanga Mandlevu', email: 'yanga@vividair.co.za', phone: null, address: 'Unit 3 Route 21 Corporate Park, 97 Savereign Drive, Irene, 0060' },
  { name: 'Separations - NGS & Microarray', contactPerson: 'Ms Martiza Hanekom', email: 'Maritza@Separations.co.za', phone: '+27 82 374 6325', address: '9 Will Scarlet, Robindale, Randburg, 2194' },
  { name: 'Separations - General', contactPerson: null, email: null, phone: null, address: null },
  { name: 'Makro', contactPerson: null, email: null, phone: null, address: null },
  { name: 'Cash Converters', contactPerson: null, email: null, phone: null, address: null },
  { name: 'Qiagene', contactPerson: 'Ms Neo Monoto', email: 'neo.monoto@qiagen.com', phone: '+27 63 651 3041', address: 'Block C, Cedar Tree Office Park, Cnr Cedar Road, Stinkwood Close, Broad Acres, Johannesburg, 2044' },
  { name: 'DB Diagnostics', contactPerson: null, email: null, phone: null, address: null },
  { name: 'Chemistore', contactPerson: 'Mr Vhukhudo Nemushun', email: 'vhukhudo@chemistore.co.za', phone: '+27 11 568 4722', address: null },
  { name: 'Want it all', contactPerson: 'Mr Stuart', email: 'enquiries@wantitall.co.za', phone: null, address: null },
  { name: 'Lister Trading', contactPerson: 'Ms Marie de Caores', email: 'marie@lisertrading.co.za', phone: '+27 11 615 8843/4', address: null },
  { name: 'The Scientific Group', contactPerson: 'Mr Jabulile Ndhlovu', email: 'jabulile@scientificgroup.com', phone: null, address: null },
  { name: 'Eco Eye Waste Management', contactPerson: 'Mr Wilco Strydom', email: 'hcrw@ecoeyemed.co.za', phone: null, address: '320 Main Reef Road, Driefontein, Germiston' },
  { name: 'Anatech', contactPerson: 'Ms Colette Stapelberg', email: 'colette@anatech.co.za', phone: null, address: null },
  { name: 'Zymo Research', contactPerson: 'Ms Reeva Erasmus', email: 'reeva@directgenomics.co.za', phone: null, address: null },
]

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await pool.connect()
    try {
      const now = new Date()
      let imported = 0
      let skipped = 0
      const errors: string[] = []

      for (const supplier of suppliers) {
        try {
          // Check if supplier already exists
          const existing = await client.query(
            'SELECT "Id" FROM "Suppliers" WHERE "Name" = $1',
            [supplier.name]
          )

          if (existing.rows.length > 0) {
            skipped++
            continue
          }

          const id = crypto.randomUUID()
          await client.query(`
            INSERT INTO "Suppliers" ("Id", "Name", "ContactPerson", "Email", "Phone", "Address", "CreatedAt", "UpdatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            id,
            supplier.name,
            supplier.contactPerson || null,
            supplier.email || null,
            supplier.phone || null,
            supplier.address || null,
            now,
            now
          ])

          imported++
        } catch (error: any) {
          errors.push(`${supplier.name}: ${error.message}`)
        }
      }

      return NextResponse.json({
        success: true,
        imported,
        skipped,
        errors: errors.length > 0 ? errors : undefined
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import suppliers' },
      { status: 500 }
    )
  }
}


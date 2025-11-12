import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Run the import script
    const { stdout, stderr } = await execAsync('npx tsx scripts/import-clients.ts')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Clients imported successfully',
      output: stdout 
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import clients', details: error.message },
      { status: 500 }
    )
  }
}


import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PATHOLOGY_REFERENCE_RANGES, getReferenceRange, evaluatePathologyResult } from '@/lib/pathology-ranges'

export const dynamic = 'force-dynamic'

// Get all reference ranges
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(PATHOLOGY_REFERENCE_RANGES)
  } catch (error) {
    console.error('Pathology ranges fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pathology ranges' },
      { status: 500 }
    )
  }
}

// Evaluate a pathology result
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { testName, value, sex, age } = await req.json()

    if (!testName || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: testName, value' },
        { status: 400 }
      )
    }

    const evaluation = evaluatePathologyResult(testName, value, sex, age)

    return NextResponse.json(evaluation)
  } catch (error) {
    console.error('Pathology evaluation error:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate pathology result' },
      { status: 500 }
    )
  }
}


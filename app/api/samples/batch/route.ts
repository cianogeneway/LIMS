export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { mockSamples, mockClients } from '@/lib/mock-data'
import { generateSampleId } from '@/lib/utils'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const clientId = formData.get('clientId') as string

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      )
    }

    // Mock batch upload - create 5 sample IDs
    const samples = Array.from({ length: 5 }, (_, i) => ({
      id: String(mockSamples.length + i + 1),
      sampleId: generateSampleId(),
      clientId,
      client: mockClients.find(c => c.id === clientId) || mockClients[0],
      sampleType: 'DE_IDENTIFIED' as const,
      dateReceivedInLab: new Date(),
      status: 'RECEIVED_BY_LAB' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      workflows: [],
    }))

    return NextResponse.json({ count: samples.length, samples })
  } catch (error) {
    console.error('Batch upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process batch upload' },
      { status: 500 }
    )
  }
}


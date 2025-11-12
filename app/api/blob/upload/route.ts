import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const BLOB_SAS_URL = process.env.AZURE_BLOB_SAS_URL || 
  'https://limsstorageaccountrx.blob.core.windows.net/limsdocs?sp=r&st=2025-11-10T12:22:02Z&se=2030-11-10T20:37:02Z&spr=https&sv=2024-11-04&sr=c&sig=7aA53sRCF2iGzks15yewh%2BOL1%2BcaV15c%2Fvi5Tpl6RY0%3D'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string
    const filename = formData.get('filename') as string || file.name

    if (!file || !folder) {
      return NextResponse.json(
        { error: 'File and folder are required' },
        { status: 400 }
      )
    }

    // Upload to Azure Blob Storage using SAS URL
    const blobUrl = new URL(BLOB_SAS_URL)
    const containerUrl = `${blobUrl.origin}${blobUrl.pathname}`
    const blobPath = `${folder}/${filename}`
    const uploadUrl = `${containerUrl}/${blobPath}${blobUrl.search}`

    const arrayBuffer = await file.arrayBuffer()
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type,
      },
      body: arrayBuffer,
    })

    if (!response.ok) {
      throw new Error(`Failed to upload to blob storage: ${response.statusText}`)
    }

    const fileUrl = uploadUrl.split('?')[0] // Return URL without SAS token
    
    return NextResponse.json({ url: fileUrl, filename })
  } catch (error) {
    console.error('Blob upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}


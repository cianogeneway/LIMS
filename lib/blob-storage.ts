// Azure Blob Storage utility
const BLOB_SAS_URL = process.env.AZURE_BLOB_SAS_URL || 
  'https://limsstorageaccountrx.blob.core.windows.net/limsdocs?sp=r&st=2025-11-10T12:22:02Z&se=2030-11-10T20:37:02Z&spr=https&sv=2024-11-04&sr=c&sig=7aA53sRCF2iGzks15yewh%2BOL1%2BcaV15c%2Fvi5Tpl6RY0%3D'

export async function uploadToBlobStorage(file: File, folder: string, filename: string): Promise<string> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    // Upload to Azure Blob Storage using SAS URL
    const blobUrl = new URL(BLOB_SAS_URL)
    const containerUrl = `${blobUrl.origin}${blobUrl.pathname}`
    const blobPath = `${folder}/${filename}`
    const uploadUrl = `${containerUrl}/${blobPath}${blobUrl.search}`
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type,
      },
      body: file,
    })
    
    if (!response.ok) {
      throw new Error(`Failed to upload to blob storage: ${response.statusText}`)
    }
    
    return uploadUrl.split('?')[0] // Return URL without SAS token
  } catch (error) {
    console.error('Blob upload error:', error)
    throw error
  }
}

export function getBlobUrl(folder: string, filename: string): string {
  const blobUrl = new URL(BLOB_SAS_URL)
  const containerUrl = `${blobUrl.origin}${blobUrl.pathname}`
  const blobPath = `${folder}/${filename}`
  return `${containerUrl}/${blobPath}${blobUrl.search}`
}


'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { Upload, CheckCircle, XCircle, AlertCircle, Database } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ImportInstrumentsPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importResult, setImportResult] = useState<any>(null)
  const [migrationResult, setMigrationResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setImportStatus('idle')
      setImportResult(null)
    }
  }

  const handleMigration = async () => {
    setMigrating(true)
    setMigrationStatus('idle')
    
    try {
      const res = await fetch('/api/instruments/migrate', {
        method: 'POST',
      })
      const data = await res.json()
      
      if (res.ok && data.success) {
        setMigrationStatus('success')
        setMigrationResult(data)
      } else {
        setMigrationStatus('error')
        setMigrationResult(data)
      }
    } catch (error) {
      setMigrationStatus('error')
      setMigrationResult({ error: 'Failed to run migration' })
    } finally {
      setMigrating(false)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setImportStatus('idle')

    try {
      const text = await file.text()
      const instruments = JSON.parse(text)

      if (!Array.isArray(instruments)) {
        throw new Error('JSON must be an array of instruments')
      }

      const res = await fetch('/api/instruments/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instruments),
      })

      const data = await res.json()

      if (res.ok) {
        setImportStatus('success')
        setImportResult(data)
      } else {
        setImportStatus('error')
        setImportResult(data)
      }
    } catch (error: any) {
      setImportStatus('error')
      setImportResult({ error: error.message || 'Failed to import instruments' })
    } finally {
      setImporting(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Import Instruments</h1>
          <p className="text-gray-600 mt-2">
            Import your asset and equipment register into the system
          </p>
        </div>

        {/* Migration Step */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Step 1: Database Migration</CardTitle>
            </div>
            <CardDescription>
              Add additional columns to the Instruments table to store asset register data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleMigration} 
              disabled={migrating || migrationStatus === 'success'}
              className="w-full sm:w-auto"
            >
              {migrating ? 'Running Migration...' : 'Run Migration'}
            </Button>

            {migrationStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>Migration completed successfully!</span>
              </div>
            )}

            {migrationStatus === 'error' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span>Migration failed</span>
                </div>
                {migrationResult && (
                  <pre className="text-xs bg-red-50 p-3 rounded overflow-auto">
                    {JSON.stringify(migrationResult, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Step */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              <CardTitle>Step 2: Import Instruments</CardTitle>
            </div>
            <CardDescription>
              Upload a JSON file with your instrument data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select JSON File</Label>
              <Input
                id="file"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                disabled={importing || migrationStatus !== 'success'}
              />
              <p className="text-xs text-gray-500">
                The JSON file should contain an array of instrument objects. 
                See the template in <code className="bg-gray-100 px-1 rounded">data/instruments-import-template.json</code>
              </p>
            </div>

            <Button 
              onClick={handleImport} 
              disabled={!file || importing || migrationStatus !== 'success'}
              className="w-full sm:w-auto"
            >
              {importing ? 'Importing...' : 'Import Instruments'}
            </Button>

            {importStatus === 'success' && importResult && (
              <div className="space-y-2 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700 font-semibold">
                  <CheckCircle className="h-5 w-5" />
                  <span>Import completed successfully!</span>
                </div>
                <div className="text-sm text-green-600 space-y-1">
                  <p>• Imported: {importResult.imported} instruments</p>
                  <p>• Updated: {importResult.updated} instruments</p>
                  {importResult.errors > 0 && (
                    <p className="text-red-600">• Errors: {importResult.errors}</p>
                  )}
                </div>
                {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-red-700">Error Details:</p>
                    <ul className="text-xs text-red-600 list-disc list-inside">
                      {importResult.errorDetails.map((detail: string, idx: number) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/instruments')}
                  className="mt-2"
                >
                  View Instruments
                </Button>
              </div>
            )}

            {importStatus === 'error' && importResult && (
              <div className="space-y-2 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-700 font-semibold">
                  <XCircle className="h-5 w-5" />
                  <span>Import failed</span>
                </div>
                <pre className="text-xs bg-white p-3 rounded overflow-auto">
                  {JSON.stringify(importResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Instructions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold">JSON Format:</p>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`[
  {
    "serialNumber": "72211501612",
    "productDescription": "Eppendorf Research Plus Pipette",
    "shortDescription": "Pipette",
    "supplier": "AEC Amersham",
    "manufacturer": "Thermo Scientific",
    "invoiceDate": "2015-08-26",
    "areaOfUse": "Extraction Room",
    "maintenanceType": "Annual Service",
    "serviceDueDate": "2024-12-31",
    ...
  }
]`}
            </pre>
            <p className="mt-4">
              <strong>Required fields:</strong> <code>serialNumber</code>, <code>productDescription</code>
            </p>
            <p>
              <strong>Optional fields:</strong> All other fields from your asset register
            </p>
            <p className="mt-2 text-xs text-gray-600">
              See <code>README-INSTRUMENTS-IMPORT.md</code> for detailed field mappings and conversion instructions.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}




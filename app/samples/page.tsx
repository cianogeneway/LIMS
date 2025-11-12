'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { useEffect, useState } from 'react'
import { Plus, Upload, FlaskConical, CheckCircle, XCircle, Search } from 'lucide-react'

const SAMPLE_TYPES = [
  'WHOLE_BLOOD', 'SERUM_PLASMA', 'BUCCAL_SWAB', 'STOOL', 'FOOD_SOURCE',
  'DRY_BLOOD_SPOT', 'URINE', 'DNA', 'RNA'
]

const WORKFLOW_OPTIONS = {
  EXTRACTION_QC: ['DNA_EXTRACTION_MANUAL', 'DNA_EXTRACTION_AUTOMATED', 'RNA_EXTRACTION_MANUAL'],
  NEXT_GENERATION_SEQUENCING: ['WGS', 'WES', 'SHOTGUN'],
  QPCR: ['STI_3_PANEL', 'STI_7_PANEL', 'HPV_SINGLE', 'HPV_HIGH_RISK', 'RSV', 'OPENARRAY_180_SNP', 'OPENARRAY_120_SNP', 'OPENARRAY_60_SNP', 'OPENARRAY_26_SNP'],
  FRAGMENT_ANALYSIS: ['PATERNITY_KINSHIP'],
  SANGER_SEQUENCING: ['SANGER_SEQUENCING'],
  MICROARRAY: ['PANGENOMIX_96', 'PHARMACOSCAN', 'MICROBIOME', 'CARRIER_SCAN', 'CUSTOM', 'OTHER'],
  PATHOLOGY: ['IMMUNOLOGY_TOTAL_IGE', 'ENDOCRINOLOGY_TSH', 'ENDOCRINOLOGY_FREE_T4', 'ENDOCRINOLOGY_FREE_T3', 'BIOCHEMISTRY_UREA', 'BIOCHEMISTRY_CREATININE', 'BIOCHEMISTRY_URATE', 'BIOCHEMISTRY_SODIUM', 'BIOCHEMISTRY_POTASSIUM', 'BIOCHEMISTRY_CALCIUM', 'BIOCHEMISTRY_MAGNESIUM', 'BIOCHEMISTRY_PHOSPHATE', 'BIOCHEMISTRY_VITAMIN_D3', 'BIOCHEMISTRY_HBA1C', 'BIOCHEMISTRY_TOTAL_CHOLESTEROL', 'BIOCHEMISTRY_TRIGLYCERIDES', 'BIOCHEMISTRY_HDL_CHOLESTEROL', 'BIOCHEMISTRY_LDL_CHOLESTEROL', 'BIOCHEMISTRY_CK', 'BIOCHEMISTRY_HOMOCYSTEINE', 'HAEMATOLOGY_FBC', 'HAEMATOLOGY_PLATELETS', 'HAEMATOLOGY_ESR'],
  IMMUNOLOGY: ['FOOD_SENSITIVITY_FOX', 'FOOD_SENSITIVITY_ALEX'],
}

export default function SamplesPage() {
  const [samples, setSamples] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showBatchUpload, setShowBatchUpload] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  const [formData, setFormData] = useState<any>({
    sampleType: 'DE_IDENTIFIED',
    workflows: [],
  })

  useEffect(() => {
    fetchSamples(1, searchQuery)
    fetchClients()
  }, [searchQuery])

  const fetchSamples = async (pageNum: number, search: string) => {
    const params = new URLSearchParams()
    params.set('page', String(pageNum))
    params.set('pageSize', String(pageSize))
    if (search) params.set('q', search)
    
    const res = await fetch(`/api/samples?${params.toString()}`)
    const data = await res.json()
    setSamples(data.data || [])
    setTotal(data.total || 0)
    setPage(pageNum)
  }

  const fetchClients = async () => {
    const res = await fetch('/api/clients?page=1&pageSize=1000')
    const data = await res.json()
    setClients(data.data || [])
  }

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedClient) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('clientId', selectedClient)

    const res = await fetch('/api/samples/batch', {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      setShowBatchUpload(false)
      fetchSamples(page, searchQuery)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/samples', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (res.ok) {
      setShowForm(false)
      setFormData({ sampleType: 'DE_IDENTIFIED', workflows: [] })
      fetchSamples(1, searchQuery)
    }
  }

  const handleAcceptReject = async (sampleId: string, accepted: boolean, rejectionReason?: string) => {
    const res = await fetch(`/api/samples/${sampleId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accepted, rejectionReason }),
    })
    if (res.ok) {
      fetchSamples(page, searchQuery)
    }
  }

  const addWorkflow = () => {
    setFormData({
      ...formData,
      workflows: [...formData.workflows, { workflowType: '', workflowSubType: '' }],
    })
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Samples</h1>
            <p className="text-gray-600">Manage laboratory samples</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBatchUpload(!showBatchUpload)}>
              <Upload className="h-4 w-4 mr-2" />
              Batch Upload
            </Button>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Sample
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by sample ID, kit ID, or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {showBatchUpload && (
          <Card>
            <CardHeader>
              <CardTitle>Batch Upload (Excel)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Client</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.filter(c => c.sampleType === 'DE_IDENTIFIED').map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Excel File (Column A: Sample ID)</Label>
                  <Input type="file" accept=".xlsx,.xls" onChange={handleBatchUpload} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>New Sample</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select
                    value={formData.clientId || ''}
                    onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sample Type</Label>
                  <Select
                    value={formData.sampleType}
                    onValueChange={(value) => setFormData({ ...formData, sampleType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DE_IDENTIFIED">De-identified</SelectItem>
                      <SelectItem value="KNOWN">Known</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.sampleType === 'DE_IDENTIFIED' ? (
                  <div className="space-y-2">
                    <Label>Sample ID</Label>
                    <Input
                      value={formData.sampleId || ''}
                      onChange={(e) => setFormData({ ...formData, sampleId: e.target.value })}
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Sample Kit ID</Label>
                      <Input
                        value={formData.sampleKitId || ''}
                        onChange={(e) => setFormData({ ...formData, sampleKitId: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Patient Name</Label>
                        <Input
                          value={formData.patientName || ''}
                          onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ID Number</Label>
                        <Input
                          value={formData.idNumber || ''}
                          onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input
                          type="date"
                          value={formData.dob || ''}
                          onChange={(e) => {
                            const dob = e.target.value
                            let age = null
                            if (dob) {
                              const birthDate = new Date(dob)
                              const today = new Date()
                              age = today.getFullYear() - birthDate.getFullYear()
                              const monthDiff = today.getMonth() - birthDate.getMonth()
                              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                age--
                              }
                            }
                            setFormData({ ...formData, dob, age })
                          }}
                        />
                      </div>
                      {formData.age !== null && formData.age !== undefined && (
                        <div className="space-y-2">
                          <Label>Age (Auto-calculated)</Label>
                          <Input
                            value={formData.age}
                            disabled
                            className="bg-gray-100"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Sex</Label>
                        <Select
                          value={formData.sex || ''}
                          onValueChange={(value) => setFormData({ ...formData, sex: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">Male</SelectItem>
                            <SelectItem value="F">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Number</Label>
                        <Input
                          value={formData.contactNumber || ''}
                          onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sample Type</Label>
                        <Select
                          value={formData.sampleTypeEnum || ''}
                          onValueChange={(value) => setFormData({ ...formData, sampleTypeEnum: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {SAMPLE_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date Collected</Label>
                        <Input
                          type="date"
                          value={formData.dateCollected || ''}
                          onChange={(e) => setFormData({ ...formData, dateCollected: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Collected By</Label>
                        <Input
                          value={formData.collectedBy || ''}
                          onChange={(e) => setFormData({ ...formData, collectedBy: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Workflows</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addWorkflow}>
                      Add Workflow
                    </Button>
                  </div>
                  {formData.workflows?.map((wf: any, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <Select
                        value={wf.workflowType}
                        onValueChange={(value) => {
                          const newWorkflows = [...formData.workflows]
                          newWorkflows[idx] = { workflowType: value, workflowSubType: '' }
                          setFormData({ ...formData, workflows: newWorkflows })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Workflow Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(WORKFLOW_OPTIONS).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {wf.workflowType && (
                        <Select
                          value={wf.workflowSubType}
                          onValueChange={(value) => {
                            const newWorkflows = [...formData.workflows]
                            newWorkflows[idx].workflowSubType = value
                            setFormData({ ...formData, workflows: newWorkflows })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sub Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {WORKFLOW_OPTIONS[wf.workflowType as keyof typeof WORKFLOW_OPTIONS]?.map((subType) => (
                              <SelectItem key={subType} value={subType}>
                                {subType.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Create Sample</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {samples.map((sample) => (
            <Card key={sample.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5" />
                    <CardTitle className="text-lg">
                      {sample.sampleId || sample.sampleKitId}
                    </CardTitle>
                  </div>
                  <span className="text-sm text-gray-500">{sample.status}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Client:</span> {sample.client?.companyName}</p>
                  {sample.patientName && (
                    <p><span className="font-medium">Patient:</span> {sample.patientName}</p>
                  )}
                  <p><span className="font-medium">Received:</span> {new Date(sample.dateReceivedInLab).toLocaleDateString()}</p>
                  {sample.acceptanceStatus && (
                    <p>
                      <span className="font-medium">Status: </span>
                      <span className={sample.acceptanceStatus === 'ACCEPTED' ? 'text-green-600' : 'text-red-600'}>
                        {sample.acceptanceStatus}
                      </span>
                      {sample.rejectionReason && (
                        <span className="text-red-600"> - {sample.rejectionReason}</span>
                      )}
                    </p>
                  )}
                  {sample.workflows && sample.workflows.length > 0 && (
                    <div>
                      <span className="font-medium">Workflows: </span>
                      {sample.workflows.map((wf: any) => (
                        <span key={wf.id} className="mr-2">{wf.workflowType} - {wf.workflowSubType}</span>
                      ))}
                    </div>
                  )}
                  {sample.status === 'RECEIVED_BY_LAB' && !sample.acceptanceStatus && (
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptReject(sample.id, true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const reason = prompt('Rejection reason:')
                          if (reason) {
                            handleAcceptReject(sample.id, false, reason)
                          }
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {samples.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} samples
          </div>
          {total > pageSize && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={(newPage) => fetchSamples(newPage, searchQuery)}
            />
          )}
        </div>
      </div>
    </MainLayout>
  )
}



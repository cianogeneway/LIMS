'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, FileText, Eye, Edit } from 'lucide-react'

export default function ReportTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [formData, setFormData] = useState({
    templateName: '',
    templateType: '',
    description: '',
    headerContent: '',
    footerContent: '',
    bodyTemplate: '',
    includeReferenceRanges: true,
    includeInterpretation: true,
    includeQCMetrics: false,
    isDefault: false,
    isActive: true,
  })

  const templateTypes = [
    'Paternity',
    'Blood_Profiling',
    'Blood_Profiling_HbA1c',
    'Blood_Profiling_Lipogram',
    'Genomics',
    'MicroArray',
    'MicroArray_CytoScan',
    'MicroArray_SCAT',
    'MicroArray_GCAT',
    'NGS',
    'Sanger_Sequencing',
    'HID',
    'Immunology',
  ]

  useEffect(() => {
    fetchTemplates()
  }, [filterType])

  const fetchTemplates = async () => {
    try {
      const url = filterType 
        ? `/api/report-templates?templateType=${filterType}`
        : '/api/report-templates'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching report templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const res = await fetch('/api/report-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowForm(false)
        fetchTemplates()
        // Reset form
        setFormData({
          templateName: '',
          templateType: '',
          description: '',
          headerContent: '',
          footerContent: '',
          bodyTemplate: '',
          includeReferenceRanges: true,
          includeInterpretation: true,
          includeQCMetrics: false,
          isDefault: false,
          isActive: true,
        })
      }
    } catch (error) {
      console.error('Error creating report template:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const res = await fetch(`/api/report-templates?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchTemplates()
      }
    } catch (error) {
      console.error('Error deleting report template:', error)
    }
  }

  // Default template examples
  const loadPaternityTemplate = () => {
    setFormData({
      ...formData,
      templateName: 'Paternity Test Report',
      templateType: 'Paternity',
      description: 'Standard paternity testing report with probability of paternity',
      headerContent: `<div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px;">
  <h1>Life360 Omics</h1>
  <p>Paternity Testing Report</p>
</div>`,
      footerContent: `<div style="margin-top: 30px; font-size: 12px; color: #666;">
  <p>This report contains confidential information and is intended only for the named recipient.</p>
  <p>© Life360 Omics - All Rights Reserved</p>
</div>`,
      bodyTemplate: `<div>
  <h2>Test Results</h2>
  <p><strong>Case Number:</strong> {{CASE_NUMBER}}</p>
  <p><strong>Test Date:</strong> {{TEST_DATE}}</p>
  
  <h3>Parties Tested:</h3>
  <ul>
    <li><strong>Alleged Father:</strong> {{FATHER_NAME}}</li>
    <li><strong>Mother:</strong> {{MOTHER_NAME}}</li>
    <li><strong>Child:</strong> {{CHILD_NAME}}</li>
  </ul>
  
  <h3>Genetic Markers Analyzed:</h3>
  <p>{{MARKERS_TABLE}}</p>
  
  <h3>Conclusion:</h3>
  <p><strong>Probability of Paternity: {{PROBABILITY}}%</strong></p>
  <p>{{INTERPRETATION}}</p>
</div>`,
      includeReferenceRanges: false,
      includeInterpretation: true,
      includeQCMetrics: true,
    })
  }

  const loadBloodProfileTemplate = () => {
    setFormData({
      ...formData,
      templateName: 'Blood Profiling Report',
      templateType: 'Blood_Profiling',
      description: 'Comprehensive blood work analysis report',
      headerContent: `<div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px;">
  <h1>Life360 Omics</h1>
  <p>Blood Profiling Report</p>
</div>`,
      footerContent: `<div style="margin-top: 30px; font-size: 12px; color: #666;">
  <p>Results should be interpreted by a qualified healthcare professional.</p>
  <p>© Life360 Omics - All Rights Reserved</p>
</div>`,
      bodyTemplate: `<div>
  <h2>Patient Information</h2>
  <p><strong>Patient ID:</strong> {{PATIENT_ID}}</p>
  <p><strong>Name:</strong> {{PATIENT_NAME}}</p>
  <p><strong>Date of Birth:</strong> {{DOB}}</p>
  <p><strong>Collection Date:</strong> {{COLLECTION_DATE}}</p>
  
  <h3>Test Results:</h3>
  {{RESULTS_TABLE}}
  
  <h3>Reference Ranges:</h3>
  {{REFERENCE_RANGES}}
  
  <h3>Clinical Interpretation:</h3>
  {{INTERPRETATION}}
  
  <h3>Critical Values:</h3>
  {{CRITICAL_VALUES}}
</div>`,
      includeReferenceRanges: true,
      includeInterpretation: true,
      includeQCMetrics: false,
    })
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Report Templates</h1>
          <p className="text-gray-600">Create and manage customizable report templates</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Filter by Type</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Types</option>
          {templateTypes.map(type => (
            <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Report Template</h2>
            
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={loadPaternityTemplate}
                className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
              >
                Load Paternity Template
              </button>
              <button
                type="button"
                onClick={loadBloodProfileTemplate}
                className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
              >
                Load Blood Profile Template
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Template Name *</label>
                  <input
                    required
                    value={formData.templateName}
                    onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Template Type *</label>
                  <select
                    required
                    value={formData.templateType}
                    onChange={(e) => setFormData({ ...formData, templateType: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Type</option>
                    {templateTypes.map(type => (
                      <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={2}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Header Content (HTML)</label>
                  <textarea
                    value={formData.headerContent}
                    onChange={(e) => setFormData({ ...formData, headerContent: e.target.value })}
                    className="w-full border rounded px-3 py-2 font-mono text-sm"
                    rows={4}
                    placeholder="<div>Header HTML here</div>"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Body Template (HTML with {'{{'} PLACEHOLDERS {'}}'})</label>
                  <textarea
                    value={formData.bodyTemplate}
                    onChange={(e) => setFormData({ ...formData, bodyTemplate: e.target.value })}
                    className="w-full border rounded px-3 py-2 font-mono text-sm"
                    rows={8}
                    placeholder="<div>Use {{PLACEHOLDER}} for dynamic content</div>"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Footer Content (HTML)</label>
                  <textarea
                    value={formData.footerContent}
                    onChange={(e) => setFormData({ ...formData, footerContent: e.target.value })}
                    className="w-full border rounded px-3 py-2 font-mono text-sm"
                    rows={3}
                    placeholder="<div>Footer HTML here</div>"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.includeReferenceRanges}
                      onChange={(e) => setFormData({ ...formData, includeReferenceRanges: e.target.checked })}
                    />
                    <span className="text-sm">Include Reference Ranges</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.includeInterpretation}
                      onChange={(e) => setFormData({ ...formData, includeInterpretation: e.target.checked })}
                    />
                    <span className="text-sm">Include Interpretation</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.includeQCMetrics}
                      onChange={(e) => setFormData({ ...formData, includeQCMetrics: e.target.checked })}
                    />
                    <span className="text-sm">Include QC Metrics</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    />
                    <span className="text-sm">Set as Default Template</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {templates.map((template) => (
          <div key={template.Id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold">{template.TemplateName}</h3>
                <p className="text-sm text-gray-600">{template.Description}</p>
              </div>
              <div className="flex gap-2">
                <button className="text-purple-600 hover:text-purple-700">
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(template.Id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Type:</span>
                <span className="ml-2 px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                  {template.TemplateType.replace(/_/g, ' ')}
                </span>
              </div>
              
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  template.IsActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {template.IsActive ? 'Active' : 'Inactive'}
                </span>
                {template.IsDefault && (
                  <span className="ml-2 px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                    Default
                  </span>
                )}
              </div>
              
              <div className="col-span-2 flex gap-4 text-xs text-gray-600">
                {template.IncludeReferenceRanges && <span>✓ Reference Ranges</span>}
                {template.IncludeInterpretation && <span>✓ Interpretation</span>}
                {template.IncludeQCMetrics && <span>✓ QC Metrics</span>}
              </div>
            </div>
          </div>
        ))}
        
        {templates.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No report templates yet. Create your first template to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}

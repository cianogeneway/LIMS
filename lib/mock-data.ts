export interface MockUser {
  id: string
  email: string
  password: string
  name: string
  role: string
  createdAt: Date
}

export interface MockClient {
  id: string
  companyName: string
  organisationType: string
  vatRegistration?: string
  address: string
  email: string
  contactNumber: string
  contactPerson: string
  sampleType: string
  createdAt: Date
  updatedAt: Date
  _count?: { samples: number }
}

export interface MockSample {
  id: string
  sampleId?: string
  sampleKitId?: string
  clientId: string
  client?: MockClient
  sampleType: string
  patientName?: string
  dateReceivedInLab: Date
  status: string
  createdAt: Date
  updatedAt: Date
  workflows?: any[]
}

export interface MockInstrument {
  id: string
  name: string
  serialNumber?: string
  serviceDate?: Date
  calibrationDate?: Date
  createdAt: Date
  updatedAt: Date
  _count?: { worklists: number; maintenanceLogs: number }
}

export interface MockSupplier {
  id: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  createdAt: Date
  updatedAt: Date
}

export interface MockStockItem {
  id: string
  name: string
  code?: string
  supplierId: string
  supplier?: MockSupplier
  currentPrice: number
  unit?: string
  createdAt: Date
  updatedAt: Date
  stockBatches?: any[]
}

export interface MockWorklist {
  id: string
  name: string
  description?: string
  createdById: string
  createdBy?: MockUser
  instrumentId?: string
  instrument?: MockInstrument
  status: string
  createdAt: Date
  updatedAt: Date
  items?: any[]
}

export interface MockSOP {
  id: string
  title: string
  version: string
  status: string
  reviewDate?: Date
  nextReviewDate?: Date
  workingDocumentUrl?: string
  activeDocumentUrl?: string
  archivedDocumentUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface MockPurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplier?: MockSupplier
  status: string
  items: any[]
  totalAmount: number
  createdAt: Date
  updatedAt: Date
  receivedAt?: Date | null
  closedAt?: Date | null
  invoiceUrl?: string | null
}

export interface MockInvoice {
  id: string
  invoiceNumber: string
  clientId: string
  client?: MockClient
  month: number
  year: number
  items: any[]
  totalAmount: number
  status: string
  createdAt: Date
  updatedAt: Date
  sentAt?: Date | null
  paidAt?: Date | null
}

export const mockUsers: MockUser[] = [
  {
    id: '1',
    email: 'admin@life360omics.com',
    password: 'Admin123!',
    name: 'Admin User',
    role: 'ADMIN',
    createdAt: new Date(),
  },
]

export const mockClients: MockClient[] = [
  {
    id: '1',
    companyName: 'Example Client',
    organisationType: 'PRIVATE',
    vatRegistration: 'VAT123456',
    address: '123 Main St, City',
    email: 'client@example.com',
    contactNumber: '+27123456789',
    contactPerson: 'John Doe',
    sampleType: 'WHOLE_BLOOD',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { samples: 0 },
  },
]

export const mockSamples: MockSample[] = []

export const mockInstruments: MockInstrument[] = [
  {
    id: '1',
    name: 'PCR Machine',
    serialNumber: 'PCR001',
    serviceDate: new Date(),
    calibrationDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { worklists: 0, maintenanceLogs: 0 },
  },
]

export const mockSuppliers: MockSupplier[] = [
  {
    id: '1',
    name: 'Example Supplier',
    contactPerson: 'Jane Smith',
    email: 'supplier@example.com',
    phone: '+27123456789',
    address: '456 Supplier St',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const mockStockItems: MockStockItem[] = [
  {
    id: '1',
    name: 'DNA Extraction Kit',
    code: 'DNA-KIT-001',
    supplierId: '1',
    supplier: mockSuppliers[0],
    currentPrice: 150.00,
    unit: 'kit',
    createdAt: new Date(),
    updatedAt: new Date(),
    stockBatches: [],
  },
]

export const mockWorklists: MockWorklist[] = []

export const mockSOPs: MockSOP[] = [
  {
    id: '1',
    title: 'Sample Processing SOP',
    version: '1.0',
    status: 'WORKING',
    reviewDate: new Date(),
    nextReviewDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const mockPurchaseOrders: MockPurchaseOrder[] = []

export const mockInvoices: MockInvoice[] = []

export function getDashboardStats() {
  return {
    received: mockSamples.filter(s => s.status === 'RECEIVED_BY_LAB').length,
    worklist: mockWorklists.filter(w => w.status !== 'completed').length,
    completed: mockSamples.filter(s => s.status === 'COMPLETED').length,
    failed: mockSamples.filter(s => s.status === 'FAILED' || s.status === 'REPEAT').length,
  }
}

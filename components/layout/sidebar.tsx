'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  FlaskConical,
  ClipboardList,
  Settings,
  FileText,
  ShoppingCart,
  Package,
  Wrench,
  Building2,
  FileCheck,
  LogOut,
  Dna,
  ChevronDown,
  ChevronRight,
  BarChart3,
  FileBarChart,
  FileSpreadsheet,
  TestTube2,
  FileCode,
} from 'lucide-react'

const workflowCategories = [
  { 
    name: 'Extraction & QC',
    subcategories: [
      { name: 'DNA - Nanodrop', category: 'DNA_NANODROP' },
      { name: 'DNA - Qubit', category: 'DNA_QUBIT' },
      { name: 'DNA - Gel Electrophoresis', category: 'DNA_GEL' },
      { name: 'RNA - Nanodrop', category: 'RNA_NANODROP' },
      { name: 'RNA - Qubit', category: 'RNA_QUBIT' },
      { name: 'RNA - Gel Electrophoresis', category: 'RNA_GEL' },
    ]
  },
  {
    name: 'Direct Prep',
    category: 'DIRECT_PREP'
  },
  { 
    name: 'Open Array',
    subcategories: [
      { name: '26 Format', category: 'OPEN_ARRAY_26' },
      { name: '60 Format', category: 'OPEN_ARRAY_60' },
      { name: '120 Format', category: 'OPEN_ARRAY_120' },
      { name: '180 Format', category: 'OPEN_ARRAY_180' },
    ]
  },
  { 
    name: 'HID',
    subcategories: [
      { name: 'Paternity', category: 'HID_PATERNITY' },
      { name: 'Forensic', category: 'HID_FORENSIC' },
      { name: 'Kinship', category: 'HID_KINSHIP' },
    ]
  },
  { 
    name: 'Immunology',
    subcategories: [
      { name: 'MADx - ALEX', category: 'MADX_ALEX' },
      { name: 'MADx - FOX', category: 'MADX_FOX' },
    ]
  },
  { 
    name: 'MicroArray',
    subcategories: [
      { name: 'Pangenomix', category: 'MICROARRAY_PANGENOMIX' },
      { name: 'PMDA', category: 'MICROARRAY_PMDA' },
      { name: 'Microbiome', category: 'MICROARRAY_MICROBIOME' },
      { name: 'Other', category: 'MICROARRAY_OTHER' },
    ]
  },
  {
    name: 'Sanger Sequencing',
    category: 'SANGER_SEQUENCING'
  },
  { 
    name: 'NGS',
    subcategories: [
      { name: 'Shotgun Metagenomics', category: 'NGS_SHOTGUN' },
      { name: 'Whole Exome Sequencing (WES)', category: 'NGS_WES' },
      { name: 'Whole Genome Sequencing (WGS)', category: 'NGS_WGS' },
    ]
  },
  { 
    name: 'Blood Profiling',
    subcategories: [
      { name: 'Haematology', category: 'BLOOD_HAEMATOLOGY' },
      { name: 'Immunology', category: 'BLOOD_IMMUNOLOGY' },
      { name: 'Chemistry', category: 'BLOOD_CHEMISTRY' },
    ]
  },
]

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Building2 },
  { name: 'Samples', href: '/samples', icon: FlaskConical },
  { name: 'Instruments', href: '/instruments', icon: Wrench },
  { name: 'Stock', href: '/stock', icon: Package },
  { name: 'Suppliers', href: '/suppliers', icon: ShoppingCart },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: FileText },
  { name: 'Quotations', href: '/quotations', icon: FileSpreadsheet },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'QC Reports', href: '/qc-reports', icon: FileBarChart },
  { name: 'Reference Ranges', href: '/reference-ranges', icon: TestTube2 },
  { name: 'Report Templates', href: '/report-templates', icon: FileCode },
  { name: 'SOPs', href: '/sops', icon: FileCheck },
  { name: 'Users', href: '/users', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const [workflowsExpanded, setWorkflowsExpanded] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  const isWorkflowActive = pathname?.startsWith('/extraction-worklists')

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    )
  }

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200 shadow-sm">
      <div className="flex h-20 items-center justify-center border-b border-slate-200 px-4 bg-white">
        <Logo variant="default" />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto bg-slate-50/50">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md shadow-green-500/20'
                  : 'text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-sm'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-slate-500')} />
              {item.name}
            </Link>
          )
        })}
        
        {/* Workflows Section */}
        <div className="space-y-1">
          <button
            onClick={() => setWorkflowsExpanded(!workflowsExpanded)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
              isWorkflowActive
                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md shadow-green-500/20'
                : 'text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-sm'
            )}
          >
            <Dna className={cn('h-5 w-5', isWorkflowActive ? 'text-white' : 'text-slate-500')} />
            <span className="flex-1 text-left">Workflows</span>
            {workflowsExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          {workflowsExpanded && (
            <div className="ml-4 space-y-1 border-l-2 border-slate-200 pl-2">
              {workflowCategories.map((workflow) => (
                <div key={workflow.name}>
                  {workflow.subcategories ? (
                    // Category with subcategories
                    <div>
                      <button
                        onClick={() => toggleCategory(workflow.name)}
                        className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <span className="flex-1 text-left">{workflow.name}</span>
                        {expandedCategories.includes(workflow.name) ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>
                      {expandedCategories.includes(workflow.name) && (
                        <div className="ml-4 space-y-1">
                          {workflow.subcategories.map((sub) => (
                            <Link
                              key={sub.category}
                              href={`/extraction-worklists?category=${sub.category}`}
                              className={cn(
                                'flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm transition-all duration-200',
                                pathname?.includes(`category=${sub.category}`)
                                  ? 'bg-green-50 text-green-700 font-medium'
                                  : 'text-slate-600 hover:bg-slate-100'
                              )}
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Single category without subcategories
                    <Link
                      href={`/extraction-worklists?category=${workflow.category}`}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                        pathname?.includes(`category=${workflow.category}`)
                          ? 'bg-green-50 text-green-700 border-l-2 border-green-600'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )}
                    >
                      {workflow.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>
      <div className="border-t border-slate-200 p-3 bg-white">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900"
        >
          <LogOut className="h-5 w-5 text-slate-500" />
          Sign Out
        </button>
      </div>
    </div>
  )
}


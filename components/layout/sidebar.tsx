'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'
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
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Building2 },
  { name: 'Samples', href: '/samples', icon: FlaskConical },
  { name: 'DNA Extraction', href: '/extraction-worklists', icon: Dna },
  { name: 'Instruments', href: '/instruments', icon: Wrench },
  { name: 'Stock', href: '/stock', icon: Package },
  { name: 'Suppliers', href: '/suppliers', icon: ShoppingCart },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: FileText },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'SOPs', href: '/sops', icon: FileCheck },
  { name: 'Users', href: '/users', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()

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


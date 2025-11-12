'use client'

import { useSession } from 'next-auth/react'
import { User } from 'lucide-react'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200/60 bg-white/80 backdrop-blur-md px-8 shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Laboratory Information Management System
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 rounded-full bg-slate-50 px-4 py-2 border border-slate-200/60">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="text-sm">
            <div className="font-semibold text-slate-800">{session?.user?.name}</div>
            <div className="text-xs text-slate-500 font-medium">{session?.user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  )
}



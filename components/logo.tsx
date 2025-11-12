'use client'

import { useState } from 'react'
import Image from 'next/image'

export function Logo({ className, variant = 'default' }: { className?: string; variant?: 'default' | 'white' }) {
  const [imageError, setImageError] = useState(false)

  if (imageError) {
    return (
      <div className={`flex items-center justify-center ${className || ''}`}>
        <span className="font-bold text-slate-800 text-xl">LIFE360OMICS</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center ${className || ''}`}>
      <Image
        src="/life360omics-logo.png"
        alt="LIFE360OMICS"
        width={180}
        height={50}
        className="h-auto w-auto max-h-12 object-contain"
        style={{ maxWidth: '180px' }}
        priority
        unoptimized
        onError={() => setImageError(true)}
      />
    </div>
  )
}


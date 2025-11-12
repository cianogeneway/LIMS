import React from 'react'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  const pagesToShow = () => {
    const pages: number[] = []
    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, page + 2)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <div className="flex items-center justify-center space-x-2 mt-6">
      <button
        className="px-2 py-1 border rounded disabled:opacity-50"
        onClick={() => onPageChange(1)}
        disabled={!canPrev}
      >
        « First
      </button>
      <button
        className="px-2 py-1 border rounded disabled:opacity-50"
        onClick={() => onPageChange(page - 1)}
        disabled={!canPrev}
      >
        ‹ Prev
      </button>

      {pagesToShow().map(p => (
        <button
          key={p}
          className={`px-3 py-1 border rounded ${p === page ? 'bg-blue-600 text-white' : ''}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      <button
        className="px-2 py-1 border rounded disabled:opacity-50"
        onClick={() => onPageChange(page + 1)}
        disabled={!canNext}
      >
        Next ›
      </button>
      <button
        className="px-2 py-1 border rounded disabled:opacity-50"
        onClick={() => onPageChange(totalPages)}
        disabled={!canNext}
      >
        Last »
      </button>
    </div>
  )
}

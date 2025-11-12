import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function calculateAge(dob: Date | string): number {
  const birthDate = typeof dob === 'string' ? new Date(dob) : dob
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export function generatePONumber(): string {
  const prefix = 'PO'
  const timestamp = Date.now().toString().slice(-8)
  return `${prefix}-${timestamp}`
}

export function generateInvoiceNumber(month: number, year: number): string {
  return `INV-${year}${month.toString().padStart(2, '0')}-${Date.now().toString().slice(-6)}`
}

export function generateSampleId(): string {
  const prefix = 'SMP'
  const timestamp = Date.now().toString().slice(-8)
  return `${prefix}-${timestamp}`
}



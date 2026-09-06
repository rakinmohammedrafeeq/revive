import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

/**
 * Safely parse any date representation from backend (UTC ISO string with or without 'Z', timestamp, or Date)
 * into a valid Date object.
 * 
 * If an ISO string arrives from backend without timezone indicator (e.g. '2026-09-06T21:16:55' from Spring Boot LocalDateTime),
 * it appends 'Z' so the browser correctly treats it as UTC and converts it to the user's local timezone (e.g. IST).
 */
export function parseDate(date: string | Date | number | undefined | null): Date {
  if (!date) return new Date()
  if (date instanceof Date) return date
  if (typeof date === 'number') return new Date(date)
  
  let s = String(date).trim()
  // Check if string is an ISO format without timezone offset (e.g. 2026-09-06T21:16:55 or 2026-09-06 21:16:55)
  if (s.includes('T') || (s.includes('-') && s.includes(':'))) {
    s = s.replace(' ', 'T')
    if (!s.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(s)) {
      s = s + 'Z'
    }
  }
  const parsed = new Date(s)
  return isNaN(parsed.getTime()) ? new Date(date) : parsed
}

export function formatDateTime(date: string | Date | number | undefined | null): string {
  if (!date) return '—'
  return parseDate(date).toLocaleString()
}

export function formatDate(date: string | Date | number | undefined | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parseDate(date))
}

export function formatDateForInput(date: string | Date): string {
  const d = parseDate(date)
  return d.toISOString().split('T')[0]
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

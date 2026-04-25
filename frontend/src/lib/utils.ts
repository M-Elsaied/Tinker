import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmt(n: number | null | undefined, digits = 4): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  if (!Number.isFinite(n)) return n > 0 ? '∞' : '-∞'
  if (Math.abs(n) >= 1e6 || (Math.abs(n) < 1e-3 && n !== 0)) {
    return n.toExponential(3)
  }
  return n.toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  })
}

export function fmtP(p: number | null | undefined): string {
  if (p === null || p === undefined || Number.isNaN(p)) return '—'
  if (p < 0.0001) return '< 0.0001'
  return p.toFixed(4)
}

export function pStars(p: number | null | undefined): string {
  if (p === null || p === undefined) return ''
  if (p < 0.001) return '***'
  if (p < 0.01) return '**'
  if (p < 0.05) return '*'
  if (p < 0.10) return '.'
  return ''
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

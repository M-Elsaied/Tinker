import type { Factor } from '@/types'

/**
 * Convert a backend term name (e.g. "A", "A*B", "A^2", "A*B*C") into a
 * human-readable label using the project's factor names.
 *
 * Examples (factors = [Paper, Design, Nose]):
 *   "A"      → "Paper"
 *   "B"      → "Design"
 *   "A*B"    → "Paper × Design"
 *   "A^2"    → "Paper²"
 *   "A*B*C"  → "Paper × Design × Nose"
 *
 * Section labels and anything that isn't a pure term expression
 * (Model, Residual, Lack of Fit, Pure Error, Cor Total, Intercept) pass through unchanged.
 */
export function termLabel(term: string, factors: { name: string }[]): string {
  if (!term) return term
  if (PASS_THROUGH.has(term)) return term

  const codeToName = new Map<string, string>()
  factors.forEach((f, i) => codeToName.set(letterFor(i), f.name))

  // Split by * to handle interactions; each piece is either "X" or "X^n"
  const pieces = term.split('*').map((piece) => {
    const [code, power] = piece.split('^')
    const name = codeToName.get(code.trim()) ?? code.trim()
    if (!power) return name
    return `${name}${superscript(power.trim())}`
  })
  return pieces.join(' × ')
}

const PASS_THROUGH = new Set([
  'Model',
  'Residual',
  'Lack of Fit',
  'Pure Error',
  'Cor Total',
  'Intercept',
])

function letterFor(idx: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + idx)
}

const SUPERSCRIPT_DIGITS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
}

function superscript(digits: string): string {
  return digits.split('').map((d) => SUPERSCRIPT_DIGITS[d] ?? `^${d}`).join('')
}

/** Helper for components that may not always have factors available. */
export function safeTermLabel(term: string, factors?: { name: string }[]): string {
  if (!factors || factors.length === 0) return term
  return termLabel(term, factors)
}

export type FactorLike = Pick<Factor, 'name'>

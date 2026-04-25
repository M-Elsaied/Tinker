import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DesignType } from '@/types'

type Resolution = 'I' | 'III' | 'IV' | 'V' | 'V+' | 'RSM' | 'screening'

interface CellInfo {
  type: DesignType
  runs: number
  resolution: Resolution
  label: string
  description?: string
}

const RESOLUTION_COLOR: Record<Resolution, string> = {
  I: 'bg-destructive text-white',
  III: 'bg-[hsl(var(--de-insignificant)/0.85)] text-white',
  IV: 'bg-[hsl(var(--de-marginal)/0.9)] text-white',
  V: 'bg-[hsl(var(--de-significant)/0.85)] text-white',
  'V+': 'bg-emerald-700 text-white',
  RSM: 'bg-primary text-white',
  screening: 'bg-amber-600 text-white',
}

const RESOLUTION_LABEL: Record<Resolution, string> = {
  I: 'I — main effects ⊕ block',
  III: 'III — main effects aliased with 2FI',
  IV: 'IV — 2FI aliased with each other',
  V: 'V — 2FI clear',
  'V+': 'V+ — full',
  RSM: 'RSM — quadratic',
  screening: 'Plackett-Burman',
}

/** Compute the design grid for nFactors (k = 2..10). */
function buildGrid(k: number): CellInfo[] {
  const out: CellInfo[] = []
  // Full factorial 2^k
  out.push({
    type: 'full_factorial',
    runs: 2 ** k,
    resolution: 'V+',
    label: `2^${k}`,
    description: 'Full factorial — all 2-level combinations',
  })
  // Fractional factorials 2^(k-p) — show p=1..k-2
  for (let p = 1; p <= Math.max(0, k - 2); p++) {
    const runs = 2 ** (k - p)
    let res: Resolution = 'III'
    // Heuristic resolution map (industry standard tables)
    if (k === 4 && p === 1) res = 'IV'
    else if (k === 5 && p === 1) res = 'V'
    else if (k === 5 && p === 2) res = 'III'
    else if (k === 6 && p === 1) res = 'V+'
    else if (k === 6 && p === 2) res = 'IV'
    else if (k === 6 && p === 3) res = 'III'
    else if (k === 7 && p === 1) res = 'V+'
    else if (k === 7 && p === 2) res = 'IV'
    else if (k === 7 && p === 3) res = 'IV'
    else if (k === 7 && p === 4) res = 'III'
    else if (k >= 8 && k - p >= 5) res = 'IV'
    else res = 'III'
    out.push({
      type: 'fractional_factorial',
      runs,
      resolution: res,
      label: `2^(${k}-${p})`,
      description: `Fractional factorial — fraction p=${p}`,
    })
  }
  // Plackett-Burman — multiples of 4
  const pbRuns = Math.max(8, 4 * Math.ceil((k + 1) / 4))
  out.push({
    type: 'plackett_burman',
    runs: pbRuns,
    resolution: 'screening',
    label: 'PB',
    description: 'Plackett–Burman (main effects only)',
  })
  // CCD
  const ccdRuns = 2 ** k + 2 * k + 4
  out.push({
    type: 'ccd',
    runs: ccdRuns,
    resolution: 'RSM',
    label: 'CCD',
    description: 'Central Composite — RSM with axial points',
  })
  // Box-Behnken (3+ factors)
  if (k >= 3) {
    const bbk: Record<number, number> = { 3: 15, 4: 27, 5: 46, 6: 54, 7: 62 }
    out.push({
      type: 'box_behnken',
      runs: bbk[k] ?? 12 * k,
      resolution: 'RSM',
      label: 'BBD',
      description: 'Box–Behnken — 3-level RSM, no axial extremes',
    })
  }
  // Definitive screening
  if (k >= 4) {
    out.push({
      type: 'definitive_screening',
      runs: 2 * k + 1,
      resolution: 'screening',
      label: 'DSD',
      description: 'Definitive screening — main effects + curvature',
    })
  }
  // Optimal designs
  out.push({
    type: 'optimal_d',
    runs: Math.max(16, k * (k + 1) / 2 + k + 5),
    resolution: 'RSM',
    label: 'D-opt',
    description: 'D-optimal — maximize information (precise coefficients)',
  })
  out.push({
    type: 'optimal_i',
    runs: Math.max(16, k * (k + 1) / 2 + k + 5),
    resolution: 'RSM',
    label: 'I-opt',
    description: 'I-optimal — minimize average prediction variance',
  })
  // Latin hypercube
  out.push({
    type: 'latin_hypercube',
    runs: k * 4,
    resolution: 'RSM',
    label: 'LHS',
    description: 'Latin hypercube — space-filling for surrogate modeling',
  })
  return out
}

interface Props {
  nFactors: number
  selected: { type: DesignType; fraction?: number; runs: number } | null
  onSelect: (cell: { type: DesignType; fraction?: number; runs: number }) => void
}

export function DesignSelectorGrid({ nFactors, selected, onSelect }: Props) {
  const cells = buildGrid(nFactors)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {cells.map((c) => {
          const isSelected =
            selected?.type === c.type &&
            (c.type !== 'fractional_factorial' || selected?.runs === c.runs)
          const fraction = c.type === 'fractional_factorial'
            ? Math.round(Math.log2((2 ** nFactors) / c.runs))
            : undefined
          return (
            <button
              key={`${c.type}-${c.runs}`}
              onClick={() => onSelect({ type: c.type, runs: c.runs, fraction })}
              className={cn(
                'group relative rounded-lg border p-3 text-left transition-all',
                'hover:shadow-md hover:border-primary/50',
                isSelected && 'border-primary ring-2 ring-primary/30',
                c.resolution === 'III' && !isSelected && 'opacity-90',
              )}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="font-mono text-sm font-bold">{c.label}</div>
                <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', RESOLUTION_COLOR[c.resolution])}>
                  {c.resolution === 'screening' ? 'PB' : c.resolution === 'RSM' ? 'RSM' : `Res ${c.resolution}`}
                </span>
              </div>
              <div className="mono text-[11px] text-muted-foreground mb-1">{c.runs} runs</div>
              {c.description && (
                <div className="text-[11px] text-foreground/70 leading-snug">{c.description}</div>
              )}
              {(c.resolution === 'III' || c.resolution === 'I') && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  Main effects aliased with 2FI
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground border-t pt-2">
        <span className="font-semibold uppercase tracking-wider">Legend</span>
        {(['V+', 'V', 'IV', 'III', 'RSM', 'screening'] as Resolution[]).map((r) => (
          <span key={r} className="flex items-center gap-1">
            <span className={cn('inline-block h-2.5 w-2.5 rounded', RESOLUTION_COLOR[r])} />
            {RESOLUTION_LABEL[r]}
          </span>
        ))}
      </div>
    </div>
  )
}

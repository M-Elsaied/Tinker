import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { DesignType } from '@/types'
import { DesignSelectorGrid } from './DesignSelectorGrid'

export interface DesignSelection {
  type: DesignType
  fraction?: number
  runs: number
}

export function StepDesignType({
  value,
  onChange,
  nFactors,
  fraction,
  setFraction,
}: {
  value: DesignType
  onChange: (d: DesignType) => void
  nFactors: number
  fraction: number
  setFraction: (n: number) => void
}) {
  const [warning, setWarning] = useState<string | null>(null)

  const handleSelect = (cell: DesignSelection) => {
    onChange(cell.type)
    if (cell.type === 'fractional_factorial' && cell.fraction !== undefined) {
      setFraction(cell.fraction)
    }
    if (cell.fraction && cell.fraction >= nFactors - 3) {
      setWarning(
        `Resolution III selected — main effects will be aliased with 2-factor interactions. ` +
        `Consider a higher-resolution design unless you only care about main effects.`
      )
    } else {
      setWarning(null)
    }
  }

  const selected = {
    type: value,
    fraction: value === 'fractional_factorial' ? fraction : undefined,
    runs: value === 'fractional_factorial' ? 2 ** (nFactors - fraction)
      : value === 'full_factorial' ? 2 ** nFactors
      : value === 'plackett_burman' ? Math.max(8, 4 * Math.ceil((nFactors + 1) / 4))
      : value === 'ccd' ? 2 ** nFactors + 2 * nFactors + 4
      : value === 'definitive_screening' ? 2 * nFactors + 1
      : value === 'latin_hypercube' ? nFactors * 4
      : 0,
  }

  return (
    <div className="space-y-3">
      <DesignSelectorGrid
        nFactors={nFactors}
        selected={selected}
        onSelect={handleSelect}
      />
      {warning && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/5 p-2.5 text-[12px]">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-destructive">{warning}</div>
        </div>
      )}
    </div>
  )
}

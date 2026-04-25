import { fmt } from '@/lib/utils'

interface Props {
  predicted: number
  ciLow: number | null
  ciHigh: number | null
  piLow: number | null
  piHigh: number | null
  tiLow: number | null
  tiHigh: number | null
  unit?: string
}

export function IntervalBar({ predicted, ciLow, ciHigh, piLow, piHigh, tiLow, tiHigh, unit }: Props) {
  const lo = Math.min(...[tiLow, piLow, ciLow, predicted].filter((v): v is number => v !== null))
  const hi = Math.max(...[tiHigh, piHigh, ciHigh, predicted].filter((v): v is number => v !== null))
  const range = Math.max(hi - lo, 1e-9)
  const pct = (v: number | null) => (v === null ? 0 : ((v - lo) / range) * 100)
  return (
    <div className="space-y-2 text-[12px]">
      <Row label="99% TI" lo={tiLow} hi={tiHigh} predicted={predicted} pct={pct} color="bg-amber-200" unit={unit} />
      <Row label="95% PI" lo={piLow} hi={piHigh} predicted={predicted} pct={pct} color="bg-amber-400" unit={unit} />
      <Row label="95% CI" lo={ciLow} hi={ciHigh} predicted={predicted} pct={pct} color="bg-primary/70" unit={unit} />
      <div className="text-[11px] text-muted-foreground border-t pt-1 mt-1">
        TI = tolerance interval (covers 99% of future obs); PI = prediction (single future); CI = confidence on the mean.
      </div>
    </div>
  )
}

function Row({
  label, lo, hi, predicted, pct, color, unit,
}: {
  label: string
  lo: number | null; hi: number | null
  predicted: number
  pct: (v: number | null) => number
  color: string; unit?: string
}) {
  if (lo === null || hi === null) return null
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="mono">[{fmt(lo, 4)}, {fmt(hi, 4)}{unit ? ` ${unit}` : ''}]</span>
      </div>
      <div className="relative h-3 bg-muted rounded">
        <div
          className={`absolute h-full rounded ${color}`}
          style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }}
        />
        <div
          className="absolute h-4 -mt-0.5 w-0.5 bg-foreground"
          style={{ left: `${pct(predicted)}%` }}
        />
      </div>
    </div>
  )
}

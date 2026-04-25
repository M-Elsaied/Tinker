import { fmt } from '@/lib/utils'
import type { GoalType } from '@/types'

interface Props {
  name: string
  goal: GoalType
  lower: number
  upper: number
  target?: number | null
  predicted: number
  desirability: number
  units?: string
}

export function RampBar({ name, goal, lower, upper, target, predicted, desirability, units }: Props) {
  const min = Math.min(lower, predicted)
  const max = Math.max(upper, predicted)
  const range = Math.max(max - min, 1e-9)
  const pct = (v: number) => ((v - min) / range) * 100

  // Build the desirability ramp gradient based on goal
  let gradient = 'linear-gradient(to right, #e2e8f0, #16a34a)'
  if (goal === 'minimize') {
    gradient = 'linear-gradient(to right, #16a34a, #e2e8f0, #dc2626)'
  } else if (goal === 'maximize') {
    gradient = 'linear-gradient(to right, #dc2626, #e2e8f0, #16a34a)'
  } else if (goal === 'target') {
    gradient = 'linear-gradient(to right, #dc2626, #16a34a, #dc2626)'
  } else if (goal === 'in_range') {
    gradient = 'linear-gradient(to right, #dc2626, #16a34a, #16a34a, #dc2626)'
  }

  const dColor = desirability >= 0.8 ? '#16a34a' : desirability >= 0.5 ? '#f59e0b' : '#dc2626'

  return (
    <div className="rounded-md border bg-card p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="font-medium text-[12.5px]">{name} <span className="text-[10px] text-muted-foreground uppercase tracking-wide ml-1">{goal}</span></div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">d=</span>
          <span className="mono font-bold text-[12px]" style={{ color: dColor }}>{desirability.toFixed(3)}</span>
        </div>
      </div>
      <div className="relative h-5 rounded" style={{ background: gradient }}>
        {/* lower marker */}
        <div className="absolute h-full w-0.5 bg-foreground/40" style={{ left: `${pct(lower)}%` }} />
        {/* upper marker */}
        <div className="absolute h-full w-0.5 bg-foreground/40" style={{ left: `${pct(upper)}%` }} />
        {/* target marker */}
        {target !== null && target !== undefined && (
          <div className="absolute h-full w-0.5 bg-foreground" style={{ left: `${pct(target)}%` }} />
        )}
        {/* predicted (white circle with border) */}
        <div
          className="absolute -top-1 h-7 w-7 rounded-full border-2 border-foreground bg-white shadow-sm grid place-items-center"
          style={{ left: `calc(${pct(predicted)}% - 14px)` }}
        >
          <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mono">
        <span>{fmt(min, 3)}{units ? ` ${units}` : ''}</span>
        <span>L={fmt(lower, 3)}</span>
        {target !== null && target !== undefined && <span>T={fmt(target, 3)}</span>}
        <span>U={fmt(upper, 3)}</span>
        <span>{fmt(max, 3)}</span>
      </div>
      <div className="text-[11px] text-muted-foreground">
        Predicted: <span className="mono font-semibold text-foreground">{fmt(predicted, 4)}{units ? ` ${units}` : ''}</span>
      </div>
    </div>
  )
}

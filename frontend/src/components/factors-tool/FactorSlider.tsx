import * as Slider from '@radix-ui/react-slider'
import { Lock, LockOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  name: string
  units?: string
  /** Coded value (-1 to 1 typically). */
  coded: number
  /** Display value (actual units when units != coded). */
  actual: number
  /** Coded design points to render as tick marks (-1, 0, 1, ±α, ...). */
  designTicks?: number[]
  /** Coded min/max for slider range (defaults to design min/max ±5%). */
  min?: number
  max?: number
  step?: number
  /** Whether this factor is the current X axis ('x'), Y axis ('y'), or held constant. */
  role: 'x' | 'y' | 'held'
  onChange: (coded: number) => void
  onRoleClick?: () => void
  /** Display in coded or actual? */
  units_display: 'coded' | 'actual'
  /** Decimals for display. */
  decimals?: number
}

export function FactorSlider({
  name,
  units,
  coded,
  actual,
  designTicks = [-1, 0, 1],
  min = -1.5,
  max = 1.5,
  step = 0.01,
  role,
  onChange,
  onRoleClick,
  units_display,
  decimals = 3,
}: Props) {
  const display = units_display === 'coded' ? coded : actual
  const isHeld = role === 'held'
  const roleColor =
    role === 'x' ? 'bg-primary text-primary-foreground'
    : role === 'y' ? 'bg-amber-500 text-white'
    : 'bg-muted text-muted-foreground'

  return (
    <div className={cn('rounded-md border p-2 space-y-1.5 transition-colors', isHeld ? 'bg-card' : 'bg-primary/5 border-primary/30')}>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onRoleClick}
          className={cn(
            'h-5 px-1.5 rounded text-[10px] font-bold uppercase tracking-wider hover:opacity-80 transition-opacity',
            roleColor,
          )}
          title="Click to change axis assignment"
        >
          {role === 'held' ? '—' : role.toUpperCase()}
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[12.5px] truncate leading-tight">{name}</div>
        </div>
        <div className="mono text-[12px] tabular-nums text-foreground">
          {display.toFixed(decimals)}
          {units && units_display === 'actual' && (
            <span className="ml-1 text-[10px] text-muted-foreground">{units}</span>
          )}
        </div>
        {isHeld ? <Lock className="h-3 w-3 text-muted-foreground" /> : <LockOpen className="h-3 w-3 text-primary" />}
      </div>
      <div className="relative pt-1 pb-2">
        <Slider.Root
          className="relative flex h-3 w-full touch-none select-none items-center"
          value={[coded]}
          min={min}
          max={max}
          step={step}
          disabled={!isHeld}
          onValueChange={(v) => onChange(v[0])}
        >
          <Slider.Track className="relative h-1 w-full grow rounded-full bg-muted">
            <Slider.Range className="absolute h-full rounded-full bg-primary/50" />
          </Slider.Track>
          {designTicks.map((t, i) => {
            const pct = ((t - min) / (max - min)) * 100
            return (
              <span
                key={i}
                className="absolute -mt-0.5 h-1.5 w-0.5 bg-foreground/40 pointer-events-none"
                style={{ left: `${pct}%` }}
              />
            )
          })}
          <Slider.Thumb
            className="block h-3 w-3 rounded-full border-2 bg-primary border-primary-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            aria-label={name}
          />
        </Slider.Root>
      </div>
    </div>
  )
}

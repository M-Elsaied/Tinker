import { Rows, Rows2 } from 'lucide-react'
import { useDensity, type Density } from '@/hooks/useDensity'
import { cn } from '@/lib/utils'

const OPTIONS: { id: Density; label: string; icon: React.ReactNode }[] = [
  { id: 'comfortable', label: 'Comfortable', icon: <Rows2 className="h-3 w-3" /> },
  { id: 'compact', label: 'Compact', icon: <Rows className="h-3 w-3" /> },
]

export function DensityToggle({ className }: { className?: string }) {
  const { density, setDensity } = useDensity()
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md border border-border-soft bg-card p-0.5',
        className,
      )}
      role="radiogroup"
      aria-label="Density"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={density === o.id}
          aria-label={o.label}
          title={o.label}
          onClick={() => setDensity(o.id)}
          className={cn(
            'grid h-6 w-7 place-items-center rounded text-muted-foreground transition-all duration-150',
            density === o.id
              ? 'bg-primary text-primary-foreground shadow-token-sm'
              : 'hover:bg-accent hover:text-foreground',
          )}
        >
          {o.icon}
        </button>
      ))}
    </div>
  )
}

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemeChoice } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

interface Option { id: ThemeChoice; label: string; icon: React.ReactNode }

const OPTIONS: Option[] = [
  { id: 'light', label: 'Light', icon: <Sun className="h-3 w-3" /> },
  { id: 'system', label: 'System', icon: <Monitor className="h-3 w-3" /> },
  { id: 'dark', label: 'Dark', icon: <Moon className="h-3 w-3" /> },
]

export function ThemeToggle({ className }: { className?: string }) {
  const { choice, setChoice } = useTheme()
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md border border-border-soft bg-card p-0.5',
        className,
      )}
      role="radiogroup"
      aria-label="Color theme"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={choice === o.id}
          aria-label={o.label}
          title={o.label}
          onClick={() => setChoice(o.id)}
          className={cn(
            'grid h-6 w-7 place-items-center rounded text-muted-foreground transition-all duration-150',
            choice === o.id
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

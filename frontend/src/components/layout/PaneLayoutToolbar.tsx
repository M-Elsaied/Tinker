import { cn } from '@/lib/utils'
import type { PaneLayout } from '@/stores/uiStore'

const LAYOUT_OPTIONS: { id: PaneLayout; label: string; svg: JSX.Element }[] = [
  {
    id: '1',
    label: 'Single pane',
    svg: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5"><rect x="1.5" y="1.5" width="13" height="13" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
    ),
  },
  {
    id: '2-h',
    label: 'Two panes (horizontal)',
    svg: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
        <rect x="1.5" y="1.5" width="6" height="13" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <rect x="8.5" y="1.5" width="6" height="13" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    id: '2-v',
    label: 'Two panes (vertical)',
    svg: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
        <rect x="1.5" y="1.5" width="13" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1.5" y="8.5" width="13" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    id: '2x2',
    label: 'Four panes',
    svg: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
        <rect x="1.5" y="1.5" width="6" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <rect x="8.5" y="1.5" width="6" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1.5" y="8.5" width="6" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <rect x="8.5" y="8.5" width="6" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    id: '3x2',
    label: 'Six panes (3×2)',
    svg: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
        <rect x="1.5" y="1.5" width="4" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <rect x="6" y="1.5" width="4" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <rect x="10.5" y="1.5" width="4" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1.5" y="8.5" width="4" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <rect x="6" y="8.5" width="4" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <rect x="10.5" y="8.5" width="4" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
]

interface Props {
  value: PaneLayout
  onChange: (l: PaneLayout) => void
  options?: PaneLayout[]
}

export function PaneLayoutToolbar({ value, onChange, options }: Props) {
  const visible = options ? LAYOUT_OPTIONS.filter((o) => options.includes(o.id)) : LAYOUT_OPTIONS
  return (
    <div className="flex items-center gap-0.5 rounded-md border bg-card p-0.5">
      {visible.map((o) => (
        <button
          key={o.id}
          title={o.label}
          onClick={() => onChange(o.id)}
          className={cn(
            'grid h-6 w-7 place-items-center rounded transition-colors',
            value === o.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          {o.svg}
        </button>
      ))}
    </div>
  )
}

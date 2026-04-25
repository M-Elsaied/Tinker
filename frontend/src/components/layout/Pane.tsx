import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  title?: ReactNode
  subtitle?: string
  toolbar?: ReactNode
  children: ReactNode
  className?: string
  /** Removes the inner padding when true (for plots that want to fill the pane). */
  flush?: boolean
}

export function Pane({ title, subtitle, toolbar, children, className, flush }: Props) {
  return (
    <div className={cn('flex h-full flex-col bg-background border border-border rounded-md overflow-hidden', className)}>
      {(title || toolbar) && (
        <div className="flex items-center justify-between gap-2 border-b bg-card px-2.5 py-1.5">
          <div className="flex items-baseline gap-2 min-w-0 flex-1">
            {title && <div className="text-[12px] font-semibold truncate">{title}</div>}
            {subtitle && <div className="text-[11px] text-muted-foreground truncate">{subtitle}</div>}
          </div>
          {toolbar && <div className="flex items-center gap-1 shrink-0">{toolbar}</div>}
        </div>
      )}
      <div className={cn('flex-1 overflow-auto scroll-thin', !flush && 'p-2')}>{children}</div>
    </div>
  )
}

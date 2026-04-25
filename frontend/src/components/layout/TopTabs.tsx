import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TopTab {
  id: string
  label: string
  icon?: ReactNode
  badge?: ReactNode
  disabled?: boolean
}

interface Props {
  tabs: TopTab[]
  activeId: string
  onChange: (id: string) => void
  rightContent?: ReactNode
}

export function TopTabs({ tabs, activeId, onChange, rightContent }: Props) {
  return (
    <div className="flex h-10 items-stretch border-b bg-card">
      <div className="flex flex-1 items-stretch overflow-x-auto scroll-thin">
        {tabs.map((t) => {
          const active = t.id === activeId
          return (
            <button
              key={t.id}
              disabled={t.disabled}
              onClick={() => onChange(t.id)}
              className={cn(
                'group relative flex items-center gap-1.5 px-3 text-[12.5px] font-medium transition-colors whitespace-nowrap',
                'hover:bg-accent/60',
                active && 'text-primary',
                !active && 'text-muted-foreground',
                t.disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
              )}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.badge}
              {active && (
                <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-t bg-primary" />
              )}
            </button>
          )
        })}
      </div>
      {rightContent && (
        <div className="flex items-center gap-2 px-2 border-l">{rightContent}</div>
      )}
    </div>
  )
}

import { type ReactNode } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { GLOSSARY } from '@/data/glossary'
import { cn } from '@/lib/utils'

interface Props {
  term: keyof typeof GLOSSARY
  children: ReactNode
  className?: string
}

export function GlossaryTerm({ term, children, className }: Props) {
  const entry = GLOSSARY[term]
  if (!entry) return <>{children}</>
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'underline decoration-dotted underline-offset-[3px] decoration-muted-foreground/70 hover:decoration-primary transition-colors cursor-help inline-flex items-baseline gap-0.5 text-left',
            className,
          )}
        >
          {children}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 w-72 rounded-lg border border-border-soft bg-card p-3 shadow-token-md text-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="text-[12.5px] font-semibold mb-1">{entry.label}</div>
          <div className="text-[12px] text-muted-foreground leading-relaxed">{entry.definition}</div>
          {entry.formula && (
            <div className="mt-2 mono text-[11px] bg-muted/50 rounded px-2 py-1.5 break-words">
              {entry.formula}
            </div>
          )}
          {entry.ruleOfThumb && (
            <div className="mt-2 text-[11px] italic text-foreground/75">
              <span className="text-eyebrow not-italic mr-1">Rule of thumb</span>
              {entry.ruleOfThumb}
            </div>
          )}
          <Popover.Arrow className="fill-card" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

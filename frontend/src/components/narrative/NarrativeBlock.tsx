import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NarrativeItem } from '@/types'

const STYLE: Record<NarrativeItem['severity'], { wrap: string; icon: React.ReactNode }> = {
  success: {
    wrap: 'border-l-2 border-l-[hsl(var(--de-significant))] bg-[hsl(var(--de-significant-muted))]/30',
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--de-significant))]" />,
  },
  warning: {
    wrap: 'border-l-2 border-l-[hsl(var(--de-marginal))] bg-[hsl(var(--de-marginal-muted))]/40',
    icon: <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--de-marginal))]" />,
  },
  error: {
    wrap: 'border-l-2 border-l-[hsl(var(--de-insignificant))] bg-[hsl(var(--de-insignificant-muted))]/40',
    icon: <XCircle className="h-3.5 w-3.5 text-[hsl(var(--de-insignificant))]" />,
  },
  info: {
    wrap: 'border-l-2 border-l-primary/40 bg-primary/5',
    icon: <Info className="h-3.5 w-3.5 text-primary" />,
  },
}

export function NarrativeBlock({ items }: { items: NarrativeItem[] }) {
  if (!items || items.length === 0) return null
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => {
        const s = STYLE[item.severity]
        return (
          <div
            key={i}
            className={cn(
              'flex items-start gap-2 rounded-r-md py-1.5 pr-3 pl-2 text-[12.5px] leading-relaxed',
              s.wrap,
            )}
          >
            <div className="mt-0.5 shrink-0">{s.icon}</div>
            <div className="text-foreground/85">{boldenStats(item.text)}</div>
          </div>
        )
      })}
    </div>
  )
}

/** Bolden phrases like "F-value of 91.36", "p = 0.0001", "R² of 0.9956". */
function boldenStats(text: string): React.ReactNode {
  const re = /(F-value of [\d.]+|p\s*=\s*[\d.]+|p\s*<\s*[\d.]+|R²\s*of\s*[\d.]+|Adjusted R²\s*of\s*[\d.]+|Predicted R²\s*of\s*[\d.]+|[\d.]+%)/g
  const parts: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push(<strong key={m.index} className="font-semibold text-foreground">{m[0]}</strong>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

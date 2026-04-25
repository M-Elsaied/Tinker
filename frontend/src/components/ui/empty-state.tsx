import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

type Illustration = 'beaker' | 'chart' | 'table' | 'sliders' | 'sparkles'

interface ActionProp {
  label: string
  onClick: () => void
  icon?: ReactNode
}

interface Props {
  icon?: ReactNode
  title: string
  description?: ReactNode
  primaryAction?: ActionProp
  secondaryAction?: ActionProp
  illustration?: Illustration
  className?: string
  compact?: boolean
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  illustration = 'sparkles',
  className,
  compact = false,
}: Props) {
  return (
    <div
      className={cn(
        'mx-auto flex flex-col items-center text-center',
        compact ? 'py-8 px-4 max-w-md' : 'py-14 px-6 max-w-lg',
        className,
      )}
    >
      <div className={cn('mb-5 anim-float', compact ? 'h-16' : 'h-24')}>
        <Illustration kind={illustration} />
      </div>
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <h3 className={cn(compact ? 'text-base font-semibold' : 'text-display-2 mb-2')}>{title}</h3>
      {description && (
        <p className={cn('text-sm text-muted-foreground', compact ? 'mt-1' : 'mt-1')}>{description}</p>
      )}
      {(primaryAction || secondaryAction) && (
        <div className="mt-5 flex items-center gap-2">
          {primaryAction && (
            <Button size="sm" onClick={primaryAction.onClick}>
              {primaryAction.icon}
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button size="sm" variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.icon}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function Illustration({ kind }: { kind: Illustration }) {
  switch (kind) {
    case 'beaker':
      return (
        <svg viewBox="0 0 96 96" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="beakerFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="hsl(199 89% 48% / 0.4)" />
              <stop offset="1" stopColor="hsl(199 89% 48% / 0.85)" />
            </linearGradient>
          </defs>
          <rect x="10" y="80" width="76" height="6" rx="2" fill="hsl(var(--border))" />
          <path d="M30 24 L30 48 L20 76 Q20 84 28 84 L68 84 Q76 84 76 76 L66 48 L66 24 Z"
            fill="url(#beakerFill)" stroke="hsl(199 89% 48%)" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M28 18 L68 18" stroke="hsl(199 89% 48%)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="42" cy="68" r="3" fill="white" opacity="0.8" />
          <circle cx="56" cy="64" r="2" fill="white" opacity="0.6" />
          <circle cx="50" cy="76" r="2.5" fill="white" opacity="0.5" />
        </svg>
      )
    case 'chart':
      return (
        <svg viewBox="0 0 96 96" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="14" width="76" height="68" rx="4" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />
          <line x1="22" y1="68" x2="74" y2="68" stroke="hsl(var(--border))" strokeWidth="1" />
          <polyline points="22,60 34,46 46,52 58,30 74,38" fill="none" stroke="hsl(199 89% 48%)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="22" cy="60" r="3" fill="hsl(199 89% 48%)" />
          <circle cx="34" cy="46" r="3" fill="hsl(199 89% 48%)" />
          <circle cx="46" cy="52" r="3" fill="hsl(199 89% 48%)" />
          <circle cx="58" cy="30" r="3" fill="hsl(199 89% 48%)" />
          <circle cx="74" cy="38" r="3" fill="hsl(199 89% 48%)" />
        </svg>
      )
    case 'table':
      return (
        <svg viewBox="0 0 96 96" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="18" width="76" height="60" rx="4" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />
          <line x1="10" y1="32" x2="86" y2="32" stroke="hsl(199 89% 48%)" strokeWidth="2" />
          <line x1="38" y1="18" x2="38" y2="78" stroke="hsl(var(--border))" strokeWidth="1" />
          <line x1="62" y1="18" x2="62" y2="78" stroke="hsl(var(--border))" strokeWidth="1" />
          {[42, 52, 62, 72].map((y) => (
            <line key={y} x1="10" y1={y} x2="86" y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" />
          ))}
        </svg>
      )
    case 'sliders':
      return (
        <svg viewBox="0 0 96 96" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
          {[28, 48, 68].map((y, i) => (
            <g key={y}>
              <line x1="14" y1={y} x2="82" y2={y} stroke="hsl(var(--border))" strokeWidth="3" strokeLinecap="round" />
              <circle cx={[36, 56, 26][i]} cy={y} r="6" fill="hsl(199 89% 48%)" stroke="white" strokeWidth="2" />
            </g>
          ))}
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 96 96" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
          <path d="M48 12 L54 36 L78 42 L54 48 L48 72 L42 48 L18 42 L42 36 Z" fill="hsl(199 89% 48% / 0.85)" />
          <circle cx="74" cy="74" r="6" fill="hsl(38 92% 50% / 0.85)" />
          <circle cx="20" cy="68" r="4" fill="hsl(142 76% 36% / 0.85)" />
        </svg>
      )
  }
}

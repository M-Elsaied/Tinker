import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'text' | 'rect' | 'circle' | 'plot' | 'table-row'

interface Props extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant
  lines?: number
  shimmer?: boolean
  width?: string | number
  height?: string | number
}

export function Skeleton({
  variant = 'rect',
  lines = 3,
  shimmer = true,
  width,
  height,
  className,
  style,
  ...rest
}: Props) {
  const base = shimmer ? 'skeleton-shimmer' : 'bg-muted'
  if (variant === 'text') {
    return (
      <div className={cn('space-y-2', className)} {...rest}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(base, 'h-3 rounded-md')}
            style={{ width: i === lines - 1 ? '70%' : '100%' }}
          />
        ))}
      </div>
    )
  }
  if (variant === 'circle') {
    return (
      <div
        className={cn(base, 'rounded-full', className)}
        style={{ width: width ?? 32, height: height ?? 32, ...style }}
        {...rest}
      />
    )
  }
  if (variant === 'plot') {
    return (
      <div
        className={cn(
          'relative h-full min-h-[260px] rounded-md border border-border-soft bg-card overflow-hidden',
          className,
        )}
        {...rest}
      >
        {/* Y-axis stub */}
        <div className="absolute left-3 top-3 bottom-8 w-8 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={cn(base, 'h-1.5 w-6 rounded')} />
          ))}
        </div>
        {/* Plot body */}
        <div className={cn(base, 'absolute left-12 right-3 top-3 bottom-8 rounded-md opacity-60')} />
        {/* X-axis stub */}
        <div className="absolute left-12 right-3 bottom-2 flex justify-between">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={cn(base, 'h-1.5 w-6 rounded')} />
          ))}
        </div>
      </div>
    )
  }
  if (variant === 'table-row') {
    return (
      <div className={cn('w-full divide-y divide-border-soft', className)} {...rest}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2 px-3">
            {[120, 80, 60, 80, 80, 60].map((w, j) => (
              <div key={j} className={cn(base, 'h-3 rounded')} style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>
    )
  }
  return (
    <div
      className={cn(base, 'rounded-md', className)}
      style={{ width: width ?? '100%', height: height ?? 16, ...style }}
      {...rest}
    />
  )
}

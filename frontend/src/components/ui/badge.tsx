import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Badge({
  className,
  variant = 'default',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'success' | 'outline' | 'muted'
}) {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    success: 'bg-sig-muted text-sig border border-sig/30',
    outline: 'border border-border text-foreground',
    muted: 'bg-muted text-muted-foreground',
  }
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

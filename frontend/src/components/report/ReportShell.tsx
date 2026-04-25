import { forwardRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  className?: string
}

export const ReportShell = forwardRef<HTMLDivElement, Props>(({ children, className }, ref) => (
  <div ref={ref} className={cn('report-shell space-y-0', className)}>
    {children}
  </div>
))
ReportShell.displayName = 'ReportShell'

export function ReportPageBlock({
  id, children, className, cover,
}: {
  id?: string
  children: ReactNode
  className?: string
  cover?: boolean
}) {
  return (
    <section id={id} className={cn('report-page-block report-page', cover && 'report-cover', className)}>
      {children}
    </section>
  )
}

export function ReportSubBlock({ children, className, noBreak = true }: { children: ReactNode; className?: string; noBreak?: boolean }) {
  return <div className={cn('mb-4', noBreak && 'report-no-break', className)}>{children}</div>
}

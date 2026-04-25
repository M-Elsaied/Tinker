import { type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-6"
      onClick={() => onOpenChange(false)}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  )
}

export function DialogContent({
  children,
  className,
  onClose,
}: {
  children: ReactNode
  className?: string
  onClose?: () => void
}) {
  return (
    <div
      className={cn(
        'relative w-full max-w-2xl rounded-lg border bg-card text-card-foreground shadow-lg',
        className,
      )}
    >
      {onClose && (
        <button
          className="absolute right-3 top-3 rounded-sm opacity-60 hover:opacity-100"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  )
}

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-5 pb-3', className)}>{children}</div>
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn('text-lg font-semibold', className)}>{children}</h2>
}

export function DialogDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-sm text-muted-foreground mt-1', className)}>{children}</p>
}

export function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-5 pb-3', className)}>{children}</div>
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-end gap-2 p-5 pt-3 border-t', className)}>
      {children}
    </div>
  )
}

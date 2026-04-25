import { forwardRef, type InputHTMLAttributes } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Error message rendered below the input. Marks the input red. */
  error?: string
  /** Helpful hint rendered below the input (suppressed when error is set). */
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, hint, ...props }, ref) => {
    const hasError = !!error
    return (
      <div className="w-full">
        <input
          type={type}
          ref={ref}
          aria-invalid={hasError || undefined}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-token-sm transition-all duration-150',
            'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            hasError && 'border-destructive focus-visible:ring-destructive/40',
            className,
          )}
          {...props}
        />
        {hasError && (
          <p className="mt-1 flex items-start gap-1 text-[11px] text-destructive">
            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {!hasError && hint && (
          <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

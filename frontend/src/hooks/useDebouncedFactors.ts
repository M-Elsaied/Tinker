import { useEffect, useState } from 'react'
import type { FactorsToolState } from '@/stores/uiStore'

/** Debounce a FactorsToolState value to avoid spamming the prediction endpoint. */
export function useDebouncedFactors(value: FactorsToolState | undefined, delay = 200): FactorsToolState | undefined {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [JSON.stringify(value), delay])
  return debounced
}

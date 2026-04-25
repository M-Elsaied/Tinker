import { Select } from '@/components/ui/select'
import type { PaneViewId } from '@/stores/uiStore'

const OPTIONS: { id: PaneViewId; label: string }[] = [
  { id: 'normal-prob', label: 'Normal probability' },
  { id: 'resid-vs-pred', label: 'Residuals vs Predicted' },
  { id: 'resid-vs-run', label: 'Residuals vs Run' },
  { id: 'resid-vs-factor', label: 'Residuals vs Factor' },
  { id: 'cooks', label: "Cook's distance" },
  { id: 'leverage', label: 'Leverage' },
  { id: 'dffits', label: 'DFFITS' },
  { id: 'pred-vs-actual', label: 'Predicted vs Actual' },
  { id: 'box-cox', label: 'Box–Cox' },
]

export function PaneSubTabSelector({
  value, onChange,
}: { value: PaneViewId; onChange: (v: PaneViewId) => void }) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as PaneViewId)}
      className="h-6 text-[11px] py-0 px-1.5 w-44"
    >
      {OPTIONS.map((o) => (
        <option key={o.id} value={o.id}>{o.label}</option>
      ))}
    </Select>
  )
}

export const DIAGNOSTIC_VIEWS = OPTIONS

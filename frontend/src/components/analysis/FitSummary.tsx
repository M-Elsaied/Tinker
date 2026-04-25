import { Check } from 'lucide-react'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { fmt, fmtP } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { FitSummaryResponse, ModelOrder } from '@/types'

const ORDER_LABELS: Record<ModelOrder, string> = {
  mean: 'Mean',
  linear: 'Linear',
  '2fi': '2FI',
  quadratic: 'Quadratic',
  cubic: 'Cubic',
}

export function FitSummary({
  data,
  current,
  onSelect,
}: {
  data: FitSummaryResponse
  current?: ModelOrder
  onSelect: (m: ModelOrder) => void
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">
        Lower sequential p (&lt; 0.05) and higher lack-of-fit p (&gt; 0.10) indicate a better
        model. The suggested order is highlighted.
      </div>
      <Table>
        <THead>
          <TR>
            <TH>Source</TH>
            <TH className="text-right">Seq p</TH>
            <TH className="text-right">Lack of Fit p</TH>
            <TH className="text-right">R²</TH>
            <TH className="text-right">Adj R²</TH>
            <TH className="text-right">Pred R²</TH>
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {data.rows.map((r, i) => {
            const seqGood = r.sequential_p !== null && r.sequential_p < 0.05
            const lofGood =
              r.lack_of_fit_p === null || r.lack_of_fit_p > 0.1
            const isSuggested = data.suggested === r.model_order
            const isCurrent = current === r.model_order
            return (
              <TR
                key={i}
                onClick={() => !r.aliased && onSelect(r.model_order)}
                className={cn(
                  'cursor-pointer',
                  isCurrent && 'bg-primary/10',
                  isSuggested && !isCurrent && 'bg-sig-muted/40',
                  r.aliased && 'opacity-50 cursor-not-allowed',
                )}
              >
                <TD className="font-medium">
                  {ORDER_LABELS[r.model_order]}
                  {isSuggested && (
                    <Badge variant="success" className="ml-2">
                      Suggested
                    </Badge>
                  )}
                  {r.aliased && (
                    <Badge variant="muted" className="ml-2">
                      Aliased
                    </Badge>
                  )}
                </TD>
                <TD className={cn('text-right mono', seqGood && 'text-sig font-medium')}>
                  {fmtP(r.sequential_p)}
                </TD>
                <TD className={cn('text-right mono', lofGood && 'text-sig font-medium')}>
                  {fmtP(r.lack_of_fit_p)}
                </TD>
                <TD className="text-right mono">{fmt(r.r_squared, 4)}</TD>
                <TD className="text-right mono">{fmt(r.adj_r_squared, 4)}</TD>
                <TD className="text-right mono">
                  {r.pred_r_squared === null ? '—' : fmt(r.pred_r_squared, 4)}
                </TD>
                <TD>
                  {isCurrent && <Check className="h-4 w-4 text-primary" />}
                </TD>
              </TR>
            )
          })}
        </TBody>
      </Table>
    </div>
  )
}

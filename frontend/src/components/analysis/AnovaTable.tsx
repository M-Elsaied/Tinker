import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { GlossaryTerm } from '@/components/ui/glossary-term'
import { fmt, fmtP, pStars } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { AnovaTermRow } from '@/types'

const SECTION_ROWS = new Set(['Model', 'Residual', 'Lack of Fit', 'Pure Error', 'Cor Total'])

export function AnovaTable({ rows, alpha = 0.05 }: { rows: AnovaTermRow[]; alpha?: number }) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Source</TH>
          <TH className="text-right">Sum of Squares</TH>
          <TH className="text-right w-12">df</TH>
          <TH className="text-right">Mean Square</TH>
          <TH className="text-right"><GlossaryTerm term="f_value">F-value</GlossaryTerm></TH>
          <TH className="text-right w-32"><GlossaryTerm term="p_value">p-value</GlossaryTerm></TH>
          <TH></TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((r, i) => {
          const isSection = SECTION_ROWS.has(r.source)
          const sig = r.p_value !== null && r.p_value !== undefined && r.p_value < alpha
          return (
            <TR
              key={i}
              className={cn(
                isSection && 'bg-muted/40 font-medium',
                sig && !isSection && 'bg-sig-muted/40',
              )}
            >
              <TD className={cn(isSection && 'font-semibold')}>{r.source}</TD>
              <TD className="text-right mono">{fmt(r.sum_sq, 4)}</TD>
              <TD className="text-right mono">{r.df}</TD>
              <TD className="text-right mono">
                {Number.isNaN(r.mean_sq) ? '—' : fmt(r.mean_sq, 4)}
              </TD>
              <TD className="text-right mono">{fmt(r.f_value, 3)}</TD>
              <TD className={cn('text-right mono', sig && 'text-sig font-semibold')}>
                {fmtP(r.p_value)}
              </TD>
              <TD className="text-sig text-xs">{pStars(r.p_value)}</TD>
            </TR>
          )
        })}
      </TBody>
    </Table>
  )
}

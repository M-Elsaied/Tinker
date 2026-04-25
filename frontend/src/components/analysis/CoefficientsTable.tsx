import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { GlossaryTerm } from '@/components/ui/glossary-term'
import { fmt, fmtP, pStars } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { CoefficientRow } from '@/types'

export function CoefficientsTable({
  rows,
  alpha = 0.05,
  showStats = true,
}: {
  rows: CoefficientRow[]
  alpha?: number
  showStats?: boolean
}) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Term</TH>
          <TH className="text-right">Estimate</TH>
          {showStats && <TH className="text-right">Std Error</TH>}
          {showStats && <TH className="text-right">t</TH>}
          {showStats && <TH className="text-right"><GlossaryTerm term="p_value">p</GlossaryTerm></TH>}
          {showStats && <TH className="text-right"><GlossaryTerm term="vif">VIF</GlossaryTerm></TH>}
          {showStats && <TH className="text-right">95% CI</TH>}
        </TR>
      </THead>
      <TBody>
        {rows.map((r, i) => {
          const sig = r.p_value !== null && r.p_value !== undefined && r.p_value < alpha
          return (
            <TR key={i} className={cn(sig && 'bg-sig-muted/30')}>
              <TD className={cn('mono', i === 0 && 'font-semibold')}>{r.term}</TD>
              <TD className="text-right mono">{fmt(r.estimate, 5)}</TD>
              {showStats && (
                <TD className="text-right mono text-muted-foreground">
                  {r.std_error > 0 ? fmt(r.std_error, 5) : '—'}
                </TD>
              )}
              {showStats && (
                <TD className="text-right mono">{r.t_value === null ? '—' : fmt(r.t_value, 3)}</TD>
              )}
              {showStats && (
                <TD className={cn('text-right mono', sig && 'text-sig font-semibold')}>
                  {fmtP(r.p_value)} <span className="text-sig">{pStars(r.p_value)}</span>
                </TD>
              )}
              {showStats && (
                <TD className="text-right mono text-muted-foreground">
                  {r.vif === null ? '—' : fmt(r.vif, 2)}
                </TD>
              )}
              {showStats && (
                <TD className="text-right mono text-muted-foreground">
                  {r.ci_low === null
                    ? '—'
                    : `[${fmt(r.ci_low, 3)}, ${fmt(r.ci_high, 3)}]`}
                </TD>
              )}
            </TR>
          )
        })}
      </TBody>
    </Table>
  )
}

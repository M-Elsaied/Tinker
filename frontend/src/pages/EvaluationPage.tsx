import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE, TOKENS } from '@/components/plots/plotly'
import { useProjectStore } from '@/stores/projectStore'
import { evaluateDesign, designPower, type EvaluateResponse, type PowerResponse } from '@/services/api'
import type { ModelOrder } from '@/types'
import { fmt, cn } from '@/lib/utils'
import { RequireProject } from '@/components/layout/RequireProject'

export function EvaluationPage() {
  const project = useProjectStore((s) => s.project)
  const codedMatrix = useMemo(() => project?.designRows.map((r) => r.coded) ?? [], [project])
  const [order, setOrder] = useState<ModelOrder>('quadratic')
  const [data, setData] = useState<EvaluateResponse | null>(null)
  const [power, setPower] = useState<PowerResponse | null>(null)
  const [snr, setSnr] = useState(2.0)
  const [loading, setLoading] = useState(false)

  const compute = async () => {
    if (!project) return
    setLoading(true)
    try {
      const r = await evaluateDesign({ factors: project.factors, coded_matrix: codedMatrix, model_order: order })
      setData(r)
      const p = await designPower({ factors: project.factors, coded_matrix: codedMatrix, model_order: order, signal_to_noise: snr, alpha: 0.05 })
      setPower(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { void compute() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [order, snr])

  if (!project) return <RequireProject illustration="chart" title="Open an experiment to evaluate its design" />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Design Evaluation"
        description="Quality metrics for your design at the chosen model order: leverage, VIF, condition number, prediction variance."
      />

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Model order</Label>
              <Select value={order} onChange={(e) => setOrder(e.target.value as ModelOrder)}>
                <option value="linear">Linear</option>
                <option value="2fi">Two-factor interaction</option>
                <option value="quadratic">Quadratic</option>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Signal-to-noise (Δ/σ)</Label>
              <input
                type="number" step="0.5" min={0.5} value={snr}
                onChange={(e) => setSnr(Number(e.target.value))}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button size="sm" onClick={compute} disabled={loading}>
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Recompute
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Runs" value={data.n_runs.toString()} />
            <Stat label="Model terms" value={data.n_terms.toString()} />
            <Stat label="Cond #" value={data.condition_number != null ? fmt(data.condition_number, 1) : '—'} ok={(data.condition_number ?? 0) < 1000} />
            <Stat label="Max leverage" value={data.max_leverage != null ? fmt(data.max_leverage, 4) : '—'} ok={(data.max_leverage ?? 0) < 0.9} />
          </div>

          <div className="space-y-2">
            {data.warnings.map((w, i) => (
              <div key={i} className={cn(
                'flex items-start gap-2 rounded-md p-3 text-[12.5px]',
                w.severity === 'warning' && 'bg-[hsl(var(--de-marginal-muted))]/40 border border-[hsl(var(--de-marginal))]/40',
                w.severity === 'success' && 'bg-[hsl(var(--de-significant-muted))]/40 border border-[hsl(var(--de-significant))]/30',
                w.severity === 'info' && 'bg-primary/5 border border-primary/30',
              )}>
                {w.severity === 'warning' ? <AlertTriangle className="h-4 w-4 text-[hsl(var(--de-marginal))] shrink-0 mt-0.5" />
                  : w.severity === 'success' ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--de-significant))] shrink-0 mt-0.5" />
                  : <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                <div>{w.text}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Fraction of design space (FDS)</CardTitle>
                <CardDescription className="text-xs">Cumulative distribution of scaled prediction SD; flatter is better.</CardDescription>
              </CardHeader>
              <CardContent>
                <Plot
                  data={[{
                    x: data.fds.fraction, y: data.fds.sd_pred, type: 'scatter', mode: 'lines',
                    line: { color: TOKENS.prediction, width: 2 },
                    hovertemplate: 'fraction=%{x:.3f}<br>SD(ŷ)=%{y:.3f}<extra></extra>',
                  }]}
                  layout={{
                    ...PLOT_LAYOUT_BASE, height: 280, showlegend: false,
                    xaxis: { ...PLOT_LAYOUT_BASE.xaxis, title: 'Fraction of design space' },
                    yaxis: { ...PLOT_LAYOUT_BASE.yaxis, title: 'Scaled prediction SD' },
                  }}
                  config={PLOT_CONFIG} style={{ width: '100%' }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Variance Inflation Factors</CardTitle>
                <CardDescription className="text-xs">VIF &gt; 10 indicates multicollinearity.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 max-h-72 overflow-auto scroll-thin">
                <Table>
                  <THead>
                    <TR><TH>Term</TH><TH className="text-right">VIF</TH></TR>
                  </THead>
                  <TBody>
                    {Object.entries(data.vif).map(([term, v]) => (
                      <TR key={term} className={(v ?? 0) > 10 ? 'bg-destructive/5' : ''}>
                        <TD className="mono">{term}</TD>
                        <TD className={cn('text-right mono', (v ?? 0) > 10 && 'text-destructive font-semibold')}>{fmt(v, 2)}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {power && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Power per term</CardTitle>
                <CardDescription className="text-xs">
                  Probability of detecting an effect of size Δ/σ = {snr} at α = 0.05. Goal: ≥ 0.80.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <THead>
                    <TR><TH>Term</TH><TH className="text-right">Power</TH><TH></TH></TR>
                  </THead>
                  <TBody>
                    {power.per_term.map((t) => {
                      const pct = (t.power * 100).toFixed(1)
                      const good = t.power >= 0.8
                      return (
                        <TR key={t.term}>
                          <TD className="mono">{t.term}</TD>
                          <TD className={cn('text-right mono', good && 'text-[hsl(var(--de-significant))] font-semibold')}>{pct}%</TD>
                          <TD>
                            <div className="h-2 bg-muted rounded-full overflow-hidden w-full max-w-xs">
                              <div className={cn('h-full', good ? 'bg-[hsl(var(--de-significant))]' : t.power >= 0.5 ? 'bg-[hsl(var(--de-marginal))]' : 'bg-destructive')} style={{ width: `${pct}%` }} />
                            </div>
                          </TD>
                        </TR>
                      )
                    })}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function Stat({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn('mono text-lg font-semibold mt-1', ok === true && 'text-[hsl(var(--de-significant))]', ok === false && 'text-destructive')}>
        {value}
      </div>
    </div>
  )
}

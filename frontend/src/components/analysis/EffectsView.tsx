import { useEffect, useMemo, useState } from 'react'
import { Loader2, Check, RotateCcw } from 'lucide-react'
import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE, TOKENS } from '@/components/plots/plotly'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { computeEffects } from '@/services/api'
import { useProjectStore } from '@/stores/projectStore'
import { fmt, cn } from '@/lib/utils'
import type { EffectsResponse } from '@/types'

interface Props {
  responseIdx: number
}

export function EffectsView({ responseIdx }: Props) {
  const project = useProjectStore((s) => s.project)
  const setSelectedTerms = useProjectStore((s) => s.setSelectedTerms)
  const [data, setData] = useState<EffectsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const response = project?.responses[responseIdx]
  const codedMatrix = useMemo(
    () => project?.designRows.map((r) => r.coded) ?? [],
    [project],
  )

  const refresh = async () => {
    if (!project || !response) return
    setLoading(true); setError(null)
    try {
      const r = await computeEffects({
        factors: project.factors,
        coded_matrix: codedMatrix,
        response: response.data,
        model_order: response.modelOrder ?? '2fi',
        alpha: 0.05,
        gamma: 0.95,
      })
      setData(r)
      setSelected(new Set(r.suggested_terms))
    } catch (e) {
      setError((e as Error).message)
    } finally { setLoading(false) }
  }

  useEffect(() => { void refresh() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [responseIdx])

  const toggle = (term: string) => {
    const s = new Set(selected)
    if (s.has(term)) s.delete(term)
    else s.add(term)
    setSelected(s)
  }

  const applySelection = () => {
    setSelectedTerms(responseIdx, Array.from(selected))
  }

  if (!project || !response) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Half-normal probability of effects</CardTitle>
                <CardDescription className="text-xs">
                  Lenth&apos;s PSE provides robust significance lines without replication. Click points to
                  include / exclude terms. <span className="text-[hsl(var(--de-significant))] font-medium">t-ME</span> = candidate-significant; <span className="text-destructive font-medium">t-SME</span> = strongly significant.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Recompute
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-[12px] text-destructive">
                {error}
              </div>
            )}
            {data ? (
              <HalfNormalPlot data={data} selected={selected} onToggle={toggle} />
            ) : (
              <div className="grid place-items-center h-64 text-muted-foreground text-sm">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
          </CardContent>
        </Card>

        {data && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pareto of |effects|</CardTitle>
            </CardHeader>
            <CardContent>
              <ParetoEffectsPlot data={data} selected={selected} />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Selected model terms</CardTitle>
              <Button size="sm" onClick={applySelection} disabled={selected.size === 0}>
                <Check className="h-3.5 w-3.5" />
                Apply to model
              </Button>
            </div>
            {data && (
              <CardDescription className="text-xs mt-1">
                Lenth PSE = <span className="mono">{fmt(data.pse, 4)}</span>; t-ME = <span className="mono">{fmt(data.t_me, 4)}</span>;
                t-SME = <span className="mono">{fmt(data.t_sme, 4)}</span>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {data ? (
              <EffectsTable
                data={data}
                selected={selected}
                onToggle={toggle}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function HalfNormalPlot({
  data, selected, onToggle,
}: {
  data: EffectsResponse
  selected: Set<string>
  onToggle: (t: string) => void
}) {
  // Sort by absolute effect; assign half-normal quantiles
  const indexed = data.terms.map((t, i) => ({ term: t, abs: data.abs_effects[i], eff: data.effects[i] }))
  indexed.sort((a, b) => a.abs - b.abs)
  const m = indexed.length
  const quantiles = indexed.map((_, k) => {
    // (k+0.5)/m + 0.5 → halved normal inverse
    const p = 0.5 + (k + 0.5) / (2 * m)
    return invNorm(p)
  })

  const xs = indexed.map((d) => d.abs)
  const ys = quantiles
  const labels = indexed.map((d) => d.term)
  const colors = indexed.map((d) =>
    selected.has(d.term)
      ? Math.abs(d.eff) >= data.t_sme ? '#dc2626' : TOKENS.significant
      : '#94a3b8',
  )
  const sizes = indexed.map((d) => (selected.has(d.term) ? 11 : 8))

  const maxX = Math.max(...xs, data.t_sme * 1.05)

  return (
    <Plot
      data={[
        {
          x: xs,
          y: ys,
          text: labels,
          mode: 'markers+text',
          type: 'scatter',
          textposition: 'top right',
          textfont: { family: 'JetBrains Mono', size: 10 },
          marker: { size: sizes, color: colors, line: { color: '#ffffff', width: 1.2 } },
          hovertemplate: '%{text}<br>|effect|=%{x:.3f}<br>quantile=%{y:.3f}<extra></extra>',
        },
        {
          x: [data.t_me, data.t_me],
          y: [0, Math.max(...ys, 3)],
          mode: 'lines',
          line: { color: TOKENS.significant, width: 1.5, dash: 'dash' },
          name: 't-ME',
          hovertemplate: `t-ME = ${data.t_me.toFixed(3)}<extra></extra>`,
        },
        {
          x: [data.t_sme, data.t_sme],
          y: [0, Math.max(...ys, 3)],
          mode: 'lines',
          line: { color: '#dc2626', width: 1.5, dash: 'dash' },
          name: 't-SME',
          hovertemplate: `t-SME = ${data.t_sme.toFixed(3)}<extra></extra>`,
        },
      ]}
      layout={{
        ...PLOT_LAYOUT_BASE,
        height: 380,
        showlegend: true,
        legend: { orientation: 'h', y: -0.2, font: { size: 10 } },
        xaxis: { ...PLOT_LAYOUT_BASE.xaxis, title: '|Standardized effect|', range: [0, maxX * 1.1] },
        yaxis: { ...PLOT_LAYOUT_BASE.yaxis, title: 'Half-normal % probability' },
      }}
      config={PLOT_CONFIG}
      style={{ width: '100%' }}
      onClick={(ev: any) => {
        const pt = ev?.points?.[0]
        if (!pt) return
        const idx = pt.pointIndex
        if (typeof idx === 'number' && labels[idx]) onToggle(labels[idx])
      }}
    />
  )
}

function ParetoEffectsPlot({ data, selected }: { data: EffectsResponse; selected: Set<string> }) {
  const items = data.terms
    .map((t, i) => ({ term: t, abs: data.abs_effects[i], eff: data.effects[i] }))
    .sort((a, b) => b.abs - a.abs)
  return (
    <Plot
      data={[
        {
          y: items.map((d) => d.term),
          x: items.map((d) => d.abs),
          orientation: 'h',
          type: 'bar',
          marker: {
            color: items.map((d) =>
              selected.has(d.term)
                ? Math.abs(d.eff) >= data.t_sme ? '#dc2626' : TOKENS.significant
                : '#94a3b8',
            ),
          },
          hovertemplate: '%{y}: |effect|=%{x:.3f}<extra></extra>',
        },
        {
          x: [data.t_me, data.t_me],
          y: [items[items.length - 1]?.term, items[0]?.term],
          mode: 'lines',
          line: { color: TOKENS.significant, dash: 'dash', width: 1.4 },
          name: 't-ME',
        },
        {
          x: [data.t_sme, data.t_sme],
          y: [items[items.length - 1]?.term, items[0]?.term],
          mode: 'lines',
          line: { color: '#dc2626', dash: 'dash', width: 1.4 },
          name: 't-SME',
        },
      ]}
      layout={{
        ...PLOT_LAYOUT_BASE,
        height: Math.max(220, items.length * 26 + 80),
        showlegend: false,
        xaxis: { ...PLOT_LAYOUT_BASE.xaxis, title: '|effect|' },
        yaxis: { autorange: 'reversed', tickfont: { family: 'JetBrains Mono' } },
        margin: { l: 100, r: 24, t: 18, b: 36 },
      }}
      config={PLOT_CONFIG}
      style={{ width: '100%' }}
    />
  )
}

function EffectsTable({
  data, selected, onToggle,
}: {
  data: EffectsResponse
  selected: Set<string>
  onToggle: (t: string) => void
}) {
  const sorted = data.terms
    .map((t, i) => ({ term: t, abs: data.abs_effects[i], eff: data.effects[i], pct: data.pct_contribution[i] }))
    .sort((a, b) => b.abs - a.abs)
  return (
    <Table>
      <THead>
        <TR>
          <TH className="w-10"></TH>
          <TH>Term</TH>
          <TH className="text-right">Effect</TH>
          <TH className="text-right">|Effect|</TH>
          <TH className="text-right">% Contrib</TH>
        </TR>
      </THead>
      <TBody>
        {sorted.map((row) => {
          const sel = selected.has(row.term)
          const sme = Math.abs(row.eff) >= data.t_sme
          const me = Math.abs(row.eff) >= data.t_me
          return (
            <TR
              key={row.term}
              onClick={() => onToggle(row.term)}
              className={cn('cursor-pointer', sel && 'bg-[hsl(var(--de-significant-muted))]/40')}
            >
              <TD className="text-center">
                <input
                  type="checkbox"
                  checked={sel}
                  onChange={() => onToggle(row.term)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-3.5 w-3.5 accent-primary"
                />
              </TD>
              <TD className="mono">
                {row.term}
                {sme && <Badge variant="success" className="ml-1.5 text-[9px] px-1.5 py-0">SME</Badge>}
                {!sme && me && <Badge variant="muted" className="ml-1.5 text-[9px] px-1.5 py-0">ME</Badge>}
              </TD>
              <TD className="text-right mono">{fmt(row.eff, 4)}</TD>
              <TD className="text-right mono">{fmt(row.abs, 4)}</TD>
              <TD className="text-right mono text-muted-foreground">{fmt(row.pct, 2)}%</TD>
            </TR>
          )
        })}
      </TBody>
    </Table>
  )
}

/** Inverse normal CDF (Beasley–Springer–Moro). */
function invNorm(p: number): number {
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239]
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1]
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416]
  const pl = 0.02425, ph = 1 - pl
  let q: number, r: number
  if (p < pl) {
    q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
  }
  if (p <= ph) {
    q = p - 0.5; r = q*q
    return ((((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q) / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)
  }
  q = Math.sqrt(-2 * Math.log(1 - p))
  return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
}

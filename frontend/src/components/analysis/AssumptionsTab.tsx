import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE } from '@/components/plots/plotly'
import { fmt, fmtP } from '@/lib/utils'
import { assumptions as fetchAssumptions } from '@/services/api'
import type { AssumptionsResponse, Factor, FactorAssumptions } from '@/types'

interface Props {
  factors: Factor[]
  codedMatrix: number[][]
  response: (number | null)[]
  responseName: string
}

const ALPHA = 0.05

export function AssumptionsTab({ factors, codedMatrix, response, responseName }: Props) {
  const [data, setData] = useState<AssumptionsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetchAssumptions({
        factors, coded_matrix: codedMatrix, response, response_name: responseName,
      })
      setData(r)
    } catch (e: any) {
      const detail = e?.response?.data?.detail ?? e?.message ?? 'Failed to compute assumptions'
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responseName, factors.length, codedMatrix.length])

  if (loading && !data) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Computing assumption checks…
        </CardContent>
      </Card>
    )
  }
  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-[12px] text-destructive">
            <div className="font-semibold mb-1">Could not compute assumptions</div>
            <pre className="whitespace-pre-wrap font-mono text-[11px]">{error}</pre>
          </div>
        </CardContent>
      </Card>
    )
  }
  if (!data) return null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm">Overall response distribution — {data.response_name}</CardTitle>
              <CardDescription className="text-xs">
                Shapiro–Wilk on the raw response across all {data.n_observations} observations. This is a pre-modelling check; residual normality (after fitting) is in the Diagnostics tab.
              </CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={() => void fetchData()} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <OverallNormalityRow stat={data.overall_shapiro_stat} p={data.overall_shapiro_p} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.factors.map((fa) => (
          <FactorCard key={fa.factor_name} fa={fa} responseName={data.response_name} />
        ))}
      </div>
    </div>
  )
}

function OverallNormalityRow({ stat, p }: { stat: number | null; p: number | null }) {
  if (p === null || stat === null) {
    return <div className="text-[12.5px] text-muted-foreground">Shapiro–Wilk could not be computed.</div>
  }
  const ok = p >= ALPHA
  return (
    <div className="flex items-center gap-3 text-[12.5px]">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-[hsl(var(--de-significant))]" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-[hsl(var(--de-marginal))]" />
      )}
      <span className="mono">W = {fmt(stat, 4)}</span>
      <span className="mono">p = {fmtP(p)}</span>
      <span className={ok ? 'text-foreground/80' : 'text-[hsl(var(--de-marginal))]'}>
        {ok
          ? 'Cannot reject normality at α = 0.05.'
          : 'Response deviates significantly from normality — consider Box–Cox before relying on F / t-based inference.'}
      </span>
    </div>
  )
}

function FactorCard({ fa, responseName }: { fa: FactorAssumptions; responseName: string }) {
  const heteroscedastic = fa.levene_p !== null && fa.levene_p < ALPHA
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-baseline justify-between gap-2">
          <CardTitle className="text-sm">{fa.factor_name}</CardTitle>
          {fa.units && <span className="text-[11px] text-muted-foreground">{fa.units}</span>}
        </div>
        <CardDescription className="text-xs">
          Distribution of {responseName} at each level, plus variance and normality checks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <BoxplotPanel fa={fa} responseName={responseName} />

        <HomogeneityRow
          levene={fa.levene_p}
          bartlett={fa.bartlett_p}
          skipped={fa.homogeneity_skipped_reason}
          heteroscedastic={heteroscedastic}
        />

        <PerLevelTable fa={fa} />
      </CardContent>
    </Card>
  )
}

function BoxplotPanel({ fa, responseName }: { fa: FactorAssumptions; responseName: string }) {
  const traces = fa.levels.map((lvl) => ({
    type: 'box' as const,
    name: `${fa.factor_name} = ${fmt(lvl.actual_level, 3)}`,
    y: lvl.values,
    boxpoints: 'all' as const,
    jitter: 0.4,
    pointpos: 0,
    marker: { size: 5, opacity: 0.7 },
    line: { width: 1 },
    showlegend: false,
    hovertemplate: '%{y}<extra></extra>',
  }))
  return (
    <div style={{ width: '100%', height: 220 }}>
      <Plot
        data={traces as any}
        layout={{
          ...PLOT_LAYOUT_BASE,
          margin: { l: 50, r: 16, t: 8, b: 36 },
          yaxis: { title: responseName, gridcolor: '#e2e8f0', zeroline: false },
          xaxis: { tickfont: { size: 11 } },
          showlegend: false,
        }}
        config={PLOT_CONFIG}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}

function HomogeneityRow({
  levene, bartlett, skipped, heteroscedastic,
}: {
  levene: number | null
  bartlett: number | null
  skipped: string | null
  heteroscedastic: boolean
}) {
  if (skipped) {
    return <div className="text-[12px] text-muted-foreground italic">{skipped}</div>
  }
  return (
    <div className="text-[12px] flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="flex items-center gap-1.5">
        {heteroscedastic ? (
          <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--de-marginal))]" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--de-significant))]" />
        )}
        <span className="text-muted-foreground">Levene (median-centered):</span>
        <span className="mono">p = {fmtP(levene)}</span>
      </span>
      {bartlett !== null && (
        <span className="text-muted-foreground">
          Bartlett: <span className="mono">p = {fmtP(bartlett)}</span>
        </span>
      )}
      <span className={heteroscedastic ? 'text-[hsl(var(--de-marginal))]' : 'text-foreground/70'}>
        {heteroscedastic
          ? 'Variance differs significantly across levels (heteroscedasticity).'
          : 'No evidence of unequal variance across levels.'}
      </span>
    </div>
  )
}

function PerLevelTable({ fa }: { fa: FactorAssumptions }) {
  return (
    <div className="border border-border-soft rounded-md overflow-hidden">
      <table className="w-full text-[11.5px]">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className="text-left px-2 py-1 font-medium">Level</th>
            <th className="text-right px-2 py-1 font-medium">n</th>
            <th className="text-right px-2 py-1 font-medium">Mean</th>
            <th className="text-right px-2 py-1 font-medium">SD</th>
            <th className="text-right px-2 py-1 font-medium">Median</th>
            <th className="text-right px-2 py-1 font-medium">Min · Max</th>
            <th className="text-right px-2 py-1 font-medium">Shapiro p</th>
          </tr>
        </thead>
        <tbody>
          {fa.levels.map((lvl) => {
            const swOk = lvl.shapiro_p !== null && lvl.shapiro_p >= ALPHA
            return (
              <tr key={lvl.coded_level} className="border-t border-border-soft">
                <td className="px-2 py-1 mono">{fmt(lvl.actual_level, 3)}</td>
                <td className="px-2 py-1 text-right mono">{lvl.n}</td>
                <td className="px-2 py-1 text-right mono">{fmt(lvl.mean, 2)}</td>
                <td className="px-2 py-1 text-right mono">{fmt(lvl.std, 2)}</td>
                <td className="px-2 py-1 text-right mono">{fmt(lvl.median, 2)}</td>
                <td className="px-2 py-1 text-right mono text-muted-foreground">
                  {fmt(lvl.min, 2)} · {fmt(lvl.max, 2)}
                </td>
                <td className={`px-2 py-1 text-right mono ${
                  lvl.shapiro_p === null
                    ? 'text-muted-foreground'
                    : swOk
                      ? 'text-foreground/80'
                      : 'text-[hsl(var(--de-marginal))] font-semibold'
                }`}>
                  {lvl.shapiro_p === null
                    ? (lvl.shapiro_skipped_reason ?? '—')
                    : fmtP(lvl.shapiro_p)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

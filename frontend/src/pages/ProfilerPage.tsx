import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE, TOKENS } from '@/components/plots/plotly'
import * as Slider from '@radix-ui/react-slider'
import { useProjectStore } from '@/stores/projectStore'
import { predictPoint, profilerCurve, runAnalysis, type ProfilerCurveResponse } from '@/services/api'
import { fmt } from '@/lib/utils'
import { useDebouncedFactors } from '@/hooks/useDebouncedFactors'
import { RequireProject } from '@/components/layout/RequireProject'

export function ProfilerPage() {
  const project = useProjectStore((s) => s.project)
  const analysisCache = useProjectStore((s) => s.analysis)
  const codedMatrix = useMemo(() => project?.designRows.map((r) => r.coded) ?? [], [project])

  const [point, setPoint] = useState<Record<string, number>>({})
  const [curves, setCurves] = useState<Record<string, ProfilerCurveResponse[]>>({})
  const [predicted, setPredicted] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  // initialize at center
  useEffect(() => {
    if (!project) return
    const init: Record<string, number> = {}
    project.factors.forEach((f) => { init[f.name] = (f.high + f.low) / 2 })
    setPoint(init)
  }, [project])

  // ensure terms cached for every response
  useEffect(() => {
    if (!project) return
    project.responses.forEach(async (r, i) => {
      if (analysisCache[i]) return
      try {
        await runAnalysis({
          factors: project.factors, coded_matrix: codedMatrix,
          response: r.data, response_name: r.name, model_order: r.modelOrder ?? 'linear',
        })
      } catch { /* ignore */ }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project])

  const debounced = useDebouncedFactors({ values: Object.fromEntries(Object.entries(point).map(([k,v]) => [k,v])), xFactor: null, yFactor: null, units: 'actual', colorBy: '' } as any, 200)

  // refresh all profiler curves on point change
  useEffect(() => {
    if (!project || !debounced) return
    const run = async () => {
      setLoading(true)
      const newCurves: Record<string, ProfilerCurveResponse[]> = {}
      const newPred: Record<string, number> = {}
      for (let i = 0; i < project.responses.length; i++) {
        const r = project.responses[i]
        const terms = r.selectedTerms ?? analysisCache[i]?.terms
        if (!terms) continue
        const arr: ProfilerCurveResponse[] = []
        for (const f of project.factors) {
          try {
            const c = await profilerCurve({
              factors: project.factors, coded_matrix: codedMatrix, response: r.data,
              selected_terms: terms, current_point: point, point_units: 'actual',
              varying_factor: f.name, n_points: 30,
            })
            arr.push(c)
          } catch { /* ignore */ }
        }
        newCurves[r.name] = arr
        try {
          const p = await predictPoint({
            factors: project.factors, coded_matrix: codedMatrix, response: r.data,
            selected_terms: terms, point, point_units: 'actual', alpha: 0.05,
          })
          newPred[r.name] = p.predicted
        } catch { /* ignore */ }
      }
      setCurves(newCurves)
      setPredicted(newPred)
      setLoading(false)
    }
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(point), project])

  if (!project) return <RequireProject illustration="sliders" title="Open an experiment to launch the profiler" />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Profiler"
        description="Drag a factor slider; every response curve and predicted value updates in real time."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Factor settings</CardTitle>
            <CardDescription className="text-xs">Hold sliders to explore the design space.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.factors.map((f) => {
              const val = point[f.name] ?? (f.high + f.low) / 2
              return (
                <div key={f.name}>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">{f.name} {f.units && <span className="text-muted-foreground">({f.units})</span>}</Label>
                    <span className="mono text-[12px] font-semibold">{val.toFixed(3)}</span>
                  </div>
                  <Slider.Root
                    className="relative flex h-3 w-full touch-none select-none items-center"
                    value={[val]} min={f.low} max={f.high} step={(f.high - f.low) / 200}
                    onValueChange={(v) => setPoint({ ...point, [f.name]: v[0] })}
                  >
                    <Slider.Track className="relative h-1 w-full grow rounded-full bg-muted">
                      <Slider.Range className="absolute h-full rounded-full bg-primary/60" />
                    </Slider.Track>
                    <Slider.Thumb className="block h-3 w-3 rounded-full border-2 bg-primary border-primary-foreground shadow focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </Slider.Root>
                  <div className="flex justify-between text-[10px] text-muted-foreground mono mt-0.5">
                    <span>{fmt(f.low, 2)}</span><span>{fmt(f.high, 2)}</span>
                  </div>
                </div>
              )
            })}
            <div className="border-t pt-3 mt-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Predicted
              </div>
              {project.responses.map((r) => (
                <div key={r.name} className="flex justify-between text-[12px] mb-1">
                  <span>{r.name}{r.units && <span className="text-muted-foreground"> ({r.units})</span>}</span>
                  <span className="mono font-semibold">
                    {predicted[r.name] !== undefined ? fmt(predicted[r.name], 4) : '—'}
                  </span>
                </div>
              ))}
              {loading && <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-2"><Loader2 className="h-3 w-3 animate-spin" /> updating</div>}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-3">
          {project.responses.map((r) => (
            <Card key={r.name}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{r.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfilerStrip
                  factors={project.factors}
                  curves={curves[r.name] ?? []}
                  current={point}
                  responseName={r.name}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProfilerStrip({
  factors, curves, current, responseName,
}: {
  factors: import('@/types').Factor[]
  curves: ProfilerCurveResponse[]
  current: Record<string, number>
  responseName: string
}) {
  if (curves.length === 0) {
    return <div className="grid place-items-center h-32 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /></div>
  }
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${curves.length}, minmax(0, 1fr))` }}>
      {curves.map((c, i) => {
        const f = factors[i]
        if (!f) return null
        const cur = current[f.name]
        return (
          <Plot
            key={f.name}
            data={[
              {
                x: c.x, y: c.ci_low, mode: 'lines', line: { color: 'rgba(14,165,233,0.3)', width: 0 },
                showlegend: false, hoverinfo: 'skip',
              },
              {
                x: c.x, y: c.ci_high, mode: 'lines', line: { color: 'rgba(14,165,233,0.3)', width: 0 },
                fill: 'tonexty', fillcolor: 'rgba(14,165,233,0.18)',
                showlegend: false, hoverinfo: 'skip',
              },
              {
                x: c.x, y: c.y, mode: 'lines', line: { color: TOKENS.prediction, width: 2 },
                hovertemplate: `${f.name}=%{x:.3g}<br>${responseName}=%{y:.3g}<extra></extra>`,
              },
              {
                x: [cur, cur], y: [Math.min(...c.ci_low), Math.max(...c.ci_high)],
                mode: 'lines', line: { color: '#dc2626', width: 1.5, dash: 'dash' }, showlegend: false, hoverinfo: 'skip',
              },
            ]}
            layout={{
              ...PLOT_LAYOUT_BASE, height: 160, margin: { l: 36, r: 6, t: 18, b: 28 },
              showlegend: false,
              xaxis: { ...PLOT_LAYOUT_BASE.xaxis, title: { text: f.name, font: { size: 10 } } },
              yaxis: { ...PLOT_LAYOUT_BASE.yaxis, title: { text: '', font: { size: 10 } } },
              font: { family: 'Inter', size: 10 },
            }}
            config={{ ...PLOT_CONFIG, displayModeBar: false }}
            style={{ width: '100%' }}
          />
        )
      })}
    </div>
  )
}

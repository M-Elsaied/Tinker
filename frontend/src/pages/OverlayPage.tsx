import { useEffect, useMemo, useState } from 'react'
import { ChartScatter, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE } from '@/components/plots/plotly'
import { useProjectStore } from '@/stores/projectStore'
import { graphicalOverlay, runAnalysis, type GraphicalOverlayResponse } from '@/services/api'
import { EXAMPLES } from '@/data/examples'
import type { ResponseGoalConfig } from '@/types'

export function OverlayPage() {
  const project = useProjectStore((s) => s.project)
  const analysisCache = useProjectStore((s) => s.analysis)
  const codedMatrix = useMemo(() => project?.designRows.map((r) => r.coded) ?? [], [project])
  const [xFactor, setXFactor] = useState<string>('')
  const [yFactor, setYFactor] = useState<string>('')
  const [goals, setGoals] = useState<ResponseGoalConfig[]>([])
  const [data, setData] = useState<GraphicalOverlayResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!project || project.factors.length < 2) return
    setXFactor(project.factors[0].name)
    setYFactor(project.factors[1].name)
    const exId = project.designInfo?.exampleId as string | undefined
    const ex = exId ? EXAMPLES.find((e) => e.id === exId) : undefined
    setGoals(project.responses.map((r) => {
      const filled = r.data.filter((v): v is number => v != null && !Number.isNaN(v))
      const lo = filled.length ? Math.min(...filled) : 0
      const hi = filled.length ? Math.max(...filled) : 1
      const exGoal = ex?.goals.find((g) => g.name === r.name)
      return {
        name: r.name, selected_terms: r.selectedTerms ?? [],
        goal: exGoal?.goal ?? 'maximize',
        lower: exGoal?.lower ?? lo, upper: exGoal?.upper ?? hi,
        target: exGoal?.target ?? null,
        weight: exGoal?.weight ?? 1, importance: exGoal?.importance ?? 3,
      }
    }))
  }, [project])

  const compute = async () => {
    if (!project) return
    setLoading(true)
    try {
      const enriched: ResponseGoalConfig[] = []
      for (let i = 0; i < goals.length; i++) {
        let terms = goals[i].selected_terms
        if (!terms || terms.length === 0) {
          let cached = analysisCache[i]?.terms
          if (!cached) {
            const a = await runAnalysis({
              factors: project.factors, coded_matrix: codedMatrix,
              response: project.responses[i].data, response_name: goals[i].name,
              model_order: project.responses[i].modelOrder ?? 'linear',
            })
            cached = a.terms
          }
          terms = cached
        }
        enriched.push({ ...goals[i], selected_terms: terms })
      }
      const r = await graphicalOverlay({
        factors: project.factors, coded_matrix: codedMatrix,
        responses: project.responses.map((r) => ({ name: r.name, data: r.data })),
        goals: enriched, x_factor: xFactor, y_factor: yFactor,
        held_constant: {}, held_constant_units: 'coded', grid_size: 40,
      })
      setData(r)
    } finally { setLoading(false) }
  }

  if (!project || project.factors.length < 2) return <div className="text-sm text-muted-foreground">Need at least 2 factors.</div>

  // Build plot traces: one contour per response showing iso-lines, then a sweet-spot heatmap on top
  const traces: any[] = []
  if (data) {
    Object.entries(data.surfaces).forEach(([name, z], i) => {
      traces.push({
        x: data.x_values, y: data.y_values, z, type: 'contour', showscale: false,
        contours: { coloring: 'lines', showlabels: true, labelfont: { size: 10 } },
        line: { color: ['#0ea5e9', '#f59e0b', '#8b5cf6', '#16a34a'][i % 4], width: 1.5 },
        name, hovertemplate: `${name}=%{z:.3g}<extra></extra>`,
      })
    })
    // Feasibility (sweet spot) — yellow translucent overlay
    const feasZ = data.sweet_spot_mask.map((row) => row.map((v) => (v ? 1 : 0)))
    traces.push({
      x: data.x_values, y: data.y_values, z: feasZ, type: 'contour',
      showscale: false,
      contours: { coloring: 'fill', start: 0.5, end: 1.5, size: 1, showlines: false },
      colorscale: [[0, 'rgba(0,0,0,0)'], [0.5, 'rgba(0,0,0,0)'], [0.5001, 'rgba(255,221,0,0.45)'], [1, 'rgba(255,221,0,0.45)']],
      hoverinfo: 'skip', name: 'Sweet spot',
    })
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Graphical Optimization"
        description="Overlay response contours; the yellow region satisfies all constraints simultaneously."
        actions={
          <Button size="sm" onClick={compute} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChartScatter className="h-3.5 w-3.5" />}
            Compute overlay
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Axes</CardTitle>
          <CardDescription className="text-xs">Pick the two factors to plot. Other factors are held at coded center.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <div>
              <Label className="text-xs">X axis</Label>
              <Select value={xFactor} onChange={(e) => setXFactor(e.target.value)}>
                {project.factors.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
              </Select>
            </div>
            <div>
              <Label className="text-xs">Y axis</Label>
              <Select value={yFactor} onChange={(e) => setYFactor(e.target.value)}>
                {project.factors.filter((f) => f.name !== xFactor).map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardContent className="p-3">
            <Plot
              data={traces}
              layout={{
                ...PLOT_LAYOUT_BASE, height: 540, showlegend: true,
                legend: { orientation: 'h', y: -0.15 },
                xaxis: { ...PLOT_LAYOUT_BASE.xaxis, title: data.x_factor },
                yaxis: { ...PLOT_LAYOUT_BASE.yaxis, title: data.y_factor },
              }}
              config={PLOT_CONFIG}
              style={{ width: '100%' }}
            />
            <div className="mt-2 text-[11px] text-muted-foreground">
              Yellow = feasible region (all goals met). Each colored contour is one response's prediction surface.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { ChartScatter } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE, TOKENS, COLORSCALES } from '@/components/plots/plotly'
import { useProjectStore } from '@/stores/projectStore'
import { RequireProject } from '@/components/layout/RequireProject'

type ChartKind = 'scatter' | 'box' | 'histogram'

export function CustomGraphsPage() {
  const project = useProjectStore((s) => s.project)
  const [kind, setKind] = useState<ChartKind>('scatter')
  const [xCol, setXCol] = useState<string>('')
  const [yCol, setYCol] = useState<string>('')
  const [colorCol, setColorCol] = useState<string>('')

  const columns = useMemo(() => {
    if (!project) return [] as { id: string; label: string; type: 'factor' | 'response' | 'meta' }[]
    const cols: { id: string; label: string; type: 'factor' | 'response' | 'meta' }[] = []
    cols.push({ id: '__run', label: 'Run number', type: 'meta' })
    cols.push({ id: '__std', label: 'Standard order', type: 'meta' })
    project.factors.forEach((f) => cols.push({ id: `f:${f.name}`, label: f.name, type: 'factor' }))
    project.responses.forEach((r) => cols.push({ id: `r:${r.name}`, label: r.name, type: 'response' }))
    return cols
  }, [project])

  // Initialize defaults
  if (project && !xCol && columns[0]) {
    setXCol(columns.find((c) => c.type === 'factor')?.id ?? columns[0].id)
  }
  if (project && !yCol) {
    setYCol(columns.find((c) => c.type === 'response')?.id ?? columns[1]?.id ?? '')
  }

  if (!project) return <RequireProject illustration="chart" title="Open an experiment to plot its data" />;

  const colData = (id: string): number[] => {
    if (id === '__run') return project.designRows.map((r) => r.run)
    if (id === '__std') return project.designRows.map((r) => r.std_order)
    if (id.startsWith('f:')) {
      const name = id.slice(2)
      const fIdx = project.factors.findIndex((f) => f.name === name)
      return project.designRows.map((r) => r.actual[fIdx])
    }
    const name = id.slice(2)
    const rIdx = project.responses.findIndex((r) => r.name === name)
    return (project.responses[rIdx]?.data ?? []).map((v) => (v == null || Number.isNaN(v) ? NaN : v))
  }

  const xs = colData(xCol)
  const ys = yCol ? colData(yCol) : []
  const cs = colorCol ? colData(colorCol) : null
  const xLabel = columns.find((c) => c.id === xCol)?.label ?? ''
  const yLabel = columns.find((c) => c.id === yCol)?.label ?? ''

  let traces: any[] = []
  let layout: any = { ...PLOT_LAYOUT_BASE, height: 480 }

  if (kind === 'scatter') {
    traces = [{
      x: xs, y: ys, mode: 'markers', type: 'scatter',
      marker: cs
        ? { size: 9, color: cs, colorscale: COLORSCALES.response, colorbar: { thickness: 10, title: { text: columns.find((c) => c.id === colorCol)?.label } } }
        : { size: 9, color: TOKENS.prediction, line: { color: '#fff', width: 1 } },
      hovertemplate: `${xLabel}=%{x:.3g}<br>${yLabel}=%{y:.3g}<extra></extra>`,
    }]
    layout = { ...layout, xaxis: { ...PLOT_LAYOUT_BASE.xaxis, title: xLabel }, yaxis: { ...PLOT_LAYOUT_BASE.yaxis, title: yLabel } }
  } else if (kind === 'box') {
    traces = [{ y: ys, x: xs, type: 'box', marker: { color: TOKENS.prediction }, boxpoints: 'all', jitter: 0.3 }]
    layout = { ...layout, xaxis: { ...PLOT_LAYOUT_BASE.xaxis, title: xLabel }, yaxis: { ...PLOT_LAYOUT_BASE.yaxis, title: yLabel } }
  } else {
    traces = [{ x: xs, type: 'histogram', marker: { color: TOKENS.prediction } }]
    layout = { ...layout, xaxis: { ...PLOT_LAYOUT_BASE.xaxis, title: xLabel }, yaxis: { ...PLOT_LAYOUT_BASE.yaxis, title: 'Count' } }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Custom Graphs"
        description="Visualize any column of the project: factors, responses, run order."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ChartScatter className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Plot configuration</CardTitle>
          </div>
          <CardDescription className="text-xs">Pick chart type and columns.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Chart type</Label>
              <Select value={kind} onChange={(e) => setKind(e.target.value as ChartKind)}>
                <option value="scatter">Scatter</option>
                <option value="box">Box plot</option>
                <option value="histogram">Histogram</option>
              </Select>
            </div>
            <div>
              <Label className="text-xs">X axis</Label>
              <Select value={xCol} onChange={(e) => setXCol(e.target.value)}>
                {columns.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </Select>
            </div>
            {kind !== 'histogram' && (
              <div>
                <Label className="text-xs">Y axis</Label>
                <Select value={yCol} onChange={(e) => setYCol(e.target.value)}>
                  {columns.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </Select>
              </div>
            )}
            {kind === 'scatter' && (
              <div>
                <Label className="text-xs">Color by (optional)</Label>
                <Select value={colorCol} onChange={(e) => setColorCol(e.target.value)}>
                  <option value="">— none —</option>
                  {columns.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3">
          <Plot data={traces} layout={layout} config={PLOT_CONFIG} style={{ width: '100%' }} useResizeHandler />
        </CardContent>
      </Card>
    </div>
  )
}

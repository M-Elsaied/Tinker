import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE } from './plotly'

export function ResidualsPlot({
  x,
  y,
  xLabel,
  yLabel = 'Studentized residual',
  bands = true,
}: {
  x: number[]
  y: number[]
  xLabel: string
  yLabel?: string
  bands?: boolean
}) {
  const minX = Math.min(...x)
  const maxX = Math.max(...x)
  const traces: Plotly.Data[] = [
    {
      x,
      y,
      mode: 'markers',
      type: 'scatter',
      marker: { color: '#0ea5e9', size: 8, line: { color: '#0369a1', width: 1 } },
      hovertemplate: `${xLabel}=%{x:.3f}<br>residual=%{y:.3f}<extra></extra>`,
    },
  ]
  if (bands) {
    traces.push(
      {
        x: [minX, maxX],
        y: [3, 3],
        mode: 'lines',
        line: { color: '#dc2626', dash: 'dash', width: 1 },
        showlegend: false,
        hoverinfo: 'skip',
      },
      {
        x: [minX, maxX],
        y: [-3, -3],
        mode: 'lines',
        line: { color: '#dc2626', dash: 'dash', width: 1 },
        showlegend: false,
        hoverinfo: 'skip',
      },
      {
        x: [minX, maxX],
        y: [0, 0],
        mode: 'lines',
        line: { color: '#94a3b8', width: 1 },
        showlegend: false,
        hoverinfo: 'skip',
      },
    )
  }
  return (
    <Plot
      data={traces}
      layout={{
        ...PLOT_LAYOUT_BASE,
        height: 320,
        showlegend: false,
        xaxis: { title: xLabel, gridcolor: '#e2e8f0' },
        yaxis: { title: yLabel, gridcolor: '#e2e8f0', zerolinecolor: '#cbd5e1' },
      }}
      config={PLOT_CONFIG}
      style={{ width: '100%' }}
    />
  )
}

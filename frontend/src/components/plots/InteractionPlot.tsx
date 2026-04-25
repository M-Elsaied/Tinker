import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE } from './plotly'

export function InteractionPlot({
  x,
  y,
  z,
  xLabel,
  yLabel,
  zLabel,
}: {
  x: number[]
  y: number[]
  z: number[][]
  xLabel: string
  yLabel: string
  zLabel: string
}) {
  // For an interaction plot we plot z(x) for low/mid/high y
  const lowIdx = 0
  const highIdx = y.length - 1
  const midIdx = Math.floor(y.length / 2)
  const series = [
    { idx: lowIdx, label: `${yLabel} = ${y[lowIdx].toFixed(2)} (low)`, color: '#0ea5e9' },
    { idx: midIdx, label: `${yLabel} = ${y[midIdx].toFixed(2)} (mid)`, color: '#94a3b8' },
    { idx: highIdx, label: `${yLabel} = ${y[highIdx].toFixed(2)} (high)`, color: '#dc2626' },
  ]
  return (
    <Plot
      data={series.map((s) => ({
        x,
        y: z[s.idx],
        type: 'scatter',
        mode: 'lines+markers',
        name: s.label,
        line: { color: s.color, width: 2 },
        marker: { size: 6 },
      }))}
      layout={{
        ...PLOT_LAYOUT_BASE,
        height: 360,
        showlegend: true,
        legend: { orientation: 'h', y: -0.2 },
        xaxis: { title: xLabel, gridcolor: '#e2e8f0' },
        yaxis: { title: zLabel, gridcolor: '#e2e8f0' },
      }}
      config={PLOT_CONFIG}
      style={{ width: '100%' }}
    />
  )
}

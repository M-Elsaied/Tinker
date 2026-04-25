import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE } from './plotly'

const COLORS = ['#0ea5e9', '#f97316', '#16a34a', '#a855f7', '#dc2626', '#0284c7', '#ca8a04']

export function PerturbationPlot({
  data,
  yLabel,
}: {
  data: Record<string, { x: number[]; y: number[] }>
  yLabel: string
}) {
  const traces = Object.entries(data).map(([name, series], i) => ({
    x: series.x,
    y: series.y,
    type: 'scatter' as const,
    mode: 'lines' as const,
    name,
    line: { color: COLORS[i % COLORS.length], width: 2 },
  }))
  return (
    <Plot
      data={traces}
      layout={{
        ...PLOT_LAYOUT_BASE,
        height: 360,
        showlegend: true,
        legend: { orientation: 'h', y: -0.18 },
        xaxis: {
          title: 'Coded factor deviation from reference',
          gridcolor: '#e2e8f0',
          zerolinecolor: '#cbd5e1',
        },
        yaxis: { title: yLabel, gridcolor: '#e2e8f0' },
      }}
      config={PLOT_CONFIG}
      style={{ width: '100%' }}
    />
  )
}

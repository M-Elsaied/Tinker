import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE, TOKENS } from './plotly'

export function CooksPlot({
  values,
  threshold,
  runOrder,
}: {
  values: number[]
  threshold?: number
  runOrder?: number[]
}) {
  const x = runOrder ?? values.map((_, i) => i + 1)
  const t = threshold ?? Math.max(1, 4 / values.length)
  return (
    <Plot
      data={[
        {
          x,
          y: values,
          type: 'bar',
          marker: {
            color: values.map((v) => (v > t ? '#dc2626' : TOKENS.designPoint)),
          },
          hovertemplate: 'Run %{x}: D=%{y:.4f}<extra></extra>',
        },
        {
          x: [Math.min(...x), Math.max(...x)],
          y: [t, t],
          mode: 'lines',
          line: { color: '#dc2626', dash: 'dash', width: 1.5 },
          showlegend: false,
        },
      ]}
      layout={{
        ...PLOT_LAYOUT_BASE,
        height: 280,
        showlegend: false,
        xaxis: { ...PLOT_LAYOUT_BASE.xaxis, title: 'Run number' },
        yaxis: { ...PLOT_LAYOUT_BASE.yaxis, title: "Cook's distance" },
      }}
      config={PLOT_CONFIG}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler
    />
  )
}

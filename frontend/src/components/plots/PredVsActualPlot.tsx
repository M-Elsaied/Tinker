import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE, TOKENS } from './plotly'

export function PredVsActualPlot({
  predicted, actual, label = 'Response',
}: { predicted: number[]; actual: number[]; label?: string }) {
  const all = [...predicted, ...actual]
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  return (
    <Plot
      data={[
        {
          x: actual, y: predicted, type: 'scatter', mode: 'markers',
          marker: { size: 8, color: TOKENS.prediction, line: { color: '#fff', width: 1 } },
          hovertemplate: 'Actual=%{x:.3f}<br>Predicted=%{y:.3f}<extra></extra>',
        },
        { x: [lo, hi], y: [lo, hi], mode: 'lines', line: { color: '#dc2626', dash: 'dash' }, showlegend: false },
      ]}
      layout={{
        ...PLOT_LAYOUT_BASE, height: 280,
        xaxis: { ...PLOT_LAYOUT_BASE.xaxis, title: `Actual ${label}` },
        yaxis: { ...PLOT_LAYOUT_BASE.yaxis, title: `Predicted ${label}` },
        showlegend: false,
      }}
      config={PLOT_CONFIG}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler
    />
  )
}

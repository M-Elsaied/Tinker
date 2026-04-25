import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE, TOKENS } from './plotly'

export function LeveragePlot({
  values,
  pTerms,
  runOrder,
}: {
  values: number[]
  pTerms: number
  runOrder?: number[]
}) {
  const x = runOrder ?? values.map((_, i) => i + 1)
  const n = values.length
  const avg = pTerms / Math.max(n, 1)
  const high = Math.min(1, 2 * avg)
  return (
    <Plot
      data={[
        {
          x, y: values, type: 'bar',
          marker: { color: values.map((v) => (v > high ? '#dc2626' : v > avg ? TOKENS.marginal : TOKENS.designPoint)) },
          hovertemplate: 'Run %{x}: h=%{y:.4f}<extra></extra>',
        },
        { x: [Math.min(...x), Math.max(...x)], y: [high, high], mode: 'lines', line: { color: '#dc2626', dash: 'dash' }, showlegend: false },
        { x: [Math.min(...x), Math.max(...x)], y: [avg, avg], mode: 'lines', line: { color: TOKENS.marginal, dash: 'dot' }, showlegend: false },
      ]}
      layout={{
        ...PLOT_LAYOUT_BASE, height: 280,
        xaxis: { ...PLOT_LAYOUT_BASE.xaxis, title: 'Run number' },
        yaxis: { ...PLOT_LAYOUT_BASE.yaxis, title: 'Leverage' },
        showlegend: false,
      }}
      config={PLOT_CONFIG}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler
    />
  )
}

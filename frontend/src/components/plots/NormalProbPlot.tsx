import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE } from './plotly'

export function NormalProbPlot({
  theoretical,
  ordered,
}: {
  theoretical: number[]
  ordered: number[]
}) {
  const minV = Math.min(...theoretical, ...ordered)
  const maxV = Math.max(...theoretical, ...ordered)
  return (
    <Plot
      data={[
        {
          x: theoretical,
          y: ordered,
          type: 'scatter',
          mode: 'markers',
          marker: { color: '#0ea5e9', size: 8, line: { color: '#0369a1', width: 1 } },
          name: 'Residuals',
          hovertemplate: 'theoretical=%{x:.3f}<br>residual=%{y:.3f}<extra></extra>',
        },
        {
          x: [minV, maxV],
          y: [minV, maxV],
          mode: 'lines',
          line: { color: '#dc2626', dash: 'dash', width: 1.5 },
          showlegend: false,
          hoverinfo: 'skip',
        },
      ]}
      layout={{
        ...PLOT_LAYOUT_BASE,
        height: 320,
        showlegend: false,
        xaxis: { title: 'Theoretical quantile', gridcolor: '#e2e8f0', zerolinecolor: '#cbd5e1' },
        yaxis: { title: 'Studentized residual', gridcolor: '#e2e8f0', zerolinecolor: '#cbd5e1' },
      }}
      config={PLOT_CONFIG}
      style={{ width: '100%' }}
    />
  )
}

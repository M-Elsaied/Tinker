import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE, TOKENS } from './plotly'

export function ResidVsFactorPlot({
  factor, residuals, factorName,
}: { factor: number[]; residuals: number[]; factorName: string }) {
  return (
    <Plot
      data={[
        {
          x: factor, y: residuals, type: 'scatter', mode: 'markers',
          marker: { size: 8, color: TOKENS.prediction, line: { color: '#fff', width: 1 } },
          hovertemplate: `${factorName}=%{x:.3g}<br>residual=%{y:.3f}<extra></extra>`,
        },
        { x: [Math.min(...factor), Math.max(...factor)], y: [0, 0], mode: 'lines', line: { color: '#94a3b8' }, showlegend: false },
        { x: [Math.min(...factor), Math.max(...factor)], y: [3, 3], mode: 'lines', line: { color: '#dc2626', dash: 'dash' }, showlegend: false },
        { x: [Math.min(...factor), Math.max(...factor)], y: [-3, -3], mode: 'lines', line: { color: '#dc2626', dash: 'dash' }, showlegend: false },
      ]}
      layout={{
        ...PLOT_LAYOUT_BASE, height: 280,
        xaxis: { ...PLOT_LAYOUT_BASE.xaxis, title: factorName },
        yaxis: { ...PLOT_LAYOUT_BASE.yaxis, title: 'Studentized residual' },
        showlegend: false,
      }}
      config={PLOT_CONFIG}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler
    />
  )
}

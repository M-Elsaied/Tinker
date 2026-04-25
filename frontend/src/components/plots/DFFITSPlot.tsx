import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE, TOKENS } from './plotly'

export function DFFITSPlot({
  values, runOrder, pTerms,
}: { values: number[]; runOrder?: number[]; pTerms: number }) {
  const x = runOrder ?? values.map((_, i) => i + 1)
  const n = values.length
  const t = 2 * Math.sqrt(Math.max(pTerms, 1) / Math.max(n, 1))
  return (
    <Plot
      data={[
        {
          x, y: values, type: 'bar',
          marker: { color: values.map((v) => (Math.abs(v) > t ? '#dc2626' : TOKENS.designPoint)) },
          hovertemplate: 'Run %{x}: DFFITS=%{y:.4f}<extra></extra>',
        },
        { x: [Math.min(...x), Math.max(...x)], y: [t, t], mode: 'lines', line: { color: '#dc2626', dash: 'dash' }, showlegend: false },
        { x: [Math.min(...x), Math.max(...x)], y: [-t, -t], mode: 'lines', line: { color: '#dc2626', dash: 'dash' }, showlegend: false },
      ]}
      layout={{
        ...PLOT_LAYOUT_BASE, height: 280,
        xaxis: { ...PLOT_LAYOUT_BASE.xaxis, title: 'Run number' },
        yaxis: { ...PLOT_LAYOUT_BASE.yaxis, title: 'DFFITS' },
        showlegend: false,
      }}
      config={PLOT_CONFIG}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler
    />
  )
}

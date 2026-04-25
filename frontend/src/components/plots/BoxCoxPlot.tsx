import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE, TOKENS } from './plotly'
import type { BoxCoxResponse } from '@/types'

const LAMBDA_GUIDES: { lam: number; label: string }[] = [
  { lam: -1, label: 'inverse' },
  { lam: -0.5, label: '1/√' },
  { lam: 0, label: 'log' },
  { lam: 0.5, label: '√' },
  { lam: 1, label: 'none' },
  { lam: 2, label: 'square' },
]

export function BoxCoxPlot({ data }: { data: BoxCoxResponse }) {
  const yMin = Math.min(...data.log_likelihood)
  const yMax = Math.max(...data.log_likelihood)

  // CI band as filled area
  const ciMask = data.lambda_grid.map((l) => l >= data.lambda_ci_low && l <= data.lambda_ci_high)
  const ciX = data.lambda_grid.filter((_, i) => ciMask[i])
  const ciYTop = data.log_likelihood.filter((_, i) => ciMask[i])

  const guides = LAMBDA_GUIDES.flatMap((g) => [
    {
      x: [g.lam, g.lam], y: [yMin, yMax], mode: 'lines',
      line: { color: g.lam === Math.round(data.lambda_best) ? TOKENS.significant : '#cbd5e1', width: 1, dash: 'dot' },
      hoverinfo: 'skip', showlegend: false,
    },
    {
      x: [g.lam], y: [yMax], mode: 'text', text: [g.label],
      textposition: 'top center', textfont: { size: 9, color: '#64748b' },
      hoverinfo: 'skip', showlegend: false,
    },
  ])

  return (
    <Plot
      data={[
        // CI shaded band (filled)
        {
          x: [...ciX, ...ciX.slice().reverse()],
          y: [...ciYTop, ...ciYTop.map(() => yMin).reverse()],
          fill: 'toself', fillcolor: 'rgba(34,197,94,0.18)',
          line: { color: 'rgba(0,0,0,0)' }, hoverinfo: 'skip', showlegend: false,
        },
        // Main curve
        {
          x: data.lambda_grid, y: data.log_likelihood, type: 'scatter', mode: 'lines',
          line: { color: TOKENS.prediction, width: 2 }, name: 'log-likelihood',
        },
        // Best λ marker
        {
          x: [data.lambda_best, data.lambda_best], y: [yMin, yMax],
          mode: 'lines', line: { color: '#16a34a', width: 1.5 }, name: `λ* = ${data.lambda_best.toFixed(2)}`,
        },
        ...guides,
      ]}
      layout={{
        ...PLOT_LAYOUT_BASE, height: 320, showlegend: false,
        xaxis: { ...PLOT_LAYOUT_BASE.xaxis, title: 'λ (lambda)' },
        yaxis: { ...PLOT_LAYOUT_BASE.yaxis, title: 'log-likelihood' },
        annotations: [{
          x: data.lambda_best, y: yMin, text: `λ* = ${data.lambda_best.toFixed(2)}`,
          showarrow: false, yshift: 10, font: { color: '#16a34a', size: 10 },
        }],
      }}
      config={PLOT_CONFIG} style={{ width: '100%', height: '100%' }} useResizeHandler
    />
  )
}

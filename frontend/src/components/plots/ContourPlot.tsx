import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE, PLOT_LAYOUT_COMPACT, COLORSCALES, TOKENS } from './plotly'
import type { DesignPointProjection, CurrentPointInfo } from '@/types'

interface Props {
  x: number[]
  y: number[]
  z: number[][]
  xLabel: string
  yLabel: string
  zLabel: string
  designPoints?: DesignPointProjection[] | null
  currentPoint?: CurrentPointInfo | null
  compact?: boolean
  height?: number
}

export function ContourPlot({
  x,
  y,
  z,
  xLabel,
  yLabel,
  zLabel,
  designPoints,
  currentPoint,
  compact = false,
  height,
}: Props) {
  const traces: any[] = [
    {
      x,
      y,
      z,
      type: 'contour',
      colorscale: COLORSCALES.response,
      contours: {
        coloring: 'heatmap',
        showlabels: true,
        labelfont: { family: 'JetBrains Mono', size: compact ? 9 : 10, color: 'white' },
      },
      colorbar: {
        title: { text: zLabel, side: 'right', font: { size: compact ? 10 : 11 } },
        thickness: compact ? 8 : 12,
        len: 0.85,
      },
      hovertemplate: `${xLabel}=%{x:.3g}<br>${yLabel}=%{y:.3g}<br>${zLabel}=%{z:.3g}<extra></extra>`,
    },
  ]

  if (designPoints && designPoints.length > 0) {
    traces.push({
      x: designPoints.map((p) => p.x),
      y: designPoints.map((p) => p.y),
      type: 'scatter',
      mode: 'markers',
      marker: {
        size: designPoints.map((p) => (p.in_slice ? 8 : 5)),
        color: TOKENS.designPoint,
        symbol: designPoints.map((p) => (p.point_type === 'center' ? 'circle' : p.point_type === 'axial' ? 'square' : 'circle')),
        opacity: designPoints.map((p) => (p.in_slice ? 1 : 0.35)),
        line: { color: '#ffffff', width: 1.2 },
      },
      text: designPoints.map((p) => `Run ${p.run} · ${zLabel}=${p.z.toFixed(3)}`),
      hovertemplate: '%{text}<br>%{xaxis.title.text}=%{x:.3g}<br>%{yaxis.title.text}=%{y:.3g}<extra></extra>',
      showlegend: false,
    })
  }

  if (currentPoint) {
    traces.push({
      x: [currentPoint.x],
      y: [currentPoint.y],
      type: 'scatter',
      mode: 'markers',
      marker: {
        size: 14,
        color: TOKENS.prediction,
        symbol: 'cross',
        line: { color: '#ffffff', width: 2 },
      },
      text: [`Predicted ${zLabel}: ${currentPoint.z.toFixed(3)} ± ${currentPoint.se.toFixed(3)}`],
      hovertemplate: '%{text}<extra></extra>',
      showlegend: false,
    })
  }

  const base = compact ? PLOT_LAYOUT_COMPACT : PLOT_LAYOUT_BASE
  return (
    <Plot
      data={traces}
      layout={{
        ...base,
        height: height ?? (compact ? 240 : 420),
        xaxis: { ...base.xaxis, title: xLabel },
        yaxis: { ...base.yaxis, title: yLabel },
        showlegend: false,
      }}
      config={PLOT_CONFIG}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler
    />
  )
}

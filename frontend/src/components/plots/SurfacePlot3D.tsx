import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE, COLORSCALES, TOKENS } from './plotly'
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

export function SurfacePlot3D({
  x, y, z, xLabel, yLabel, zLabel, designPoints, currentPoint, compact = false, height,
}: Props) {
  const traces: any[] = [
    {
      x,
      y,
      z,
      type: 'surface',
      colorscale: COLORSCALES.response,
      contours: {
        z: { show: true, usecolormap: true, project: { z: true }, width: 1 },
      },
      colorbar: { title: { text: zLabel, side: 'right' }, thickness: compact ? 8 : 12, len: 0.85 },
      hovertemplate: `${xLabel}=%{x:.3g}<br>${yLabel}=%{y:.3g}<br>${zLabel}=%{z:.3g}<extra></extra>`,
      lighting: { ambient: 0.7, diffuse: 0.9, specular: 0.4 },
    },
  ]

  if (designPoints && designPoints.length > 0) {
    // Compute "above/below surface" coloring by comparing point z to bilinear-interpolated surface z.
    // For Phase 1 we do a simpler approximation: color by in_slice, all dark.
    traces.push({
      type: 'scatter3d',
      mode: 'markers',
      x: designPoints.map((p) => p.x),
      y: designPoints.map((p) => p.y),
      z: designPoints.map((p) => p.z),
      marker: {
        size: designPoints.map((p) => (p.in_slice ? 5 : 3.5)),
        color: TOKENS.designPoint,
        opacity: designPoints.map((p) => (p.in_slice ? 1 : 0.5)),
        line: { color: '#ffffff', width: 1 },
      },
      text: designPoints.map((p) => `Run ${p.run}`),
      hovertemplate: '%{text}<br>z=%{z:.3g}<extra></extra>',
      showlegend: false,
    })
  }

  if (currentPoint) {
    traces.push({
      type: 'scatter3d',
      mode: 'markers',
      x: [currentPoint.x],
      y: [currentPoint.y],
      z: [currentPoint.z],
      marker: {
        size: 7,
        color: TOKENS.prediction,
        symbol: 'cross',
        line: { color: '#ffffff', width: 2 },
      },
      text: [`Predicted: ${currentPoint.z.toFixed(3)} ± ${currentPoint.se.toFixed(3)}`],
      hovertemplate: '%{text}<extra></extra>',
      showlegend: false,
    })
  }

  return (
    <Plot
      data={traces}
      layout={{
        ...PLOT_LAYOUT_BASE,
        height: height ?? (compact ? 280 : 480),
        scene: {
          xaxis: { title: xLabel, gridcolor: '#cbd5e1', backgroundcolor: 'rgba(255,255,255,0)' },
          yaxis: { title: yLabel, gridcolor: '#cbd5e1', backgroundcolor: 'rgba(255,255,255,0)' },
          zaxis: { title: zLabel, gridcolor: '#cbd5e1', backgroundcolor: 'rgba(255,255,255,0)' },
          camera: { eye: { x: 1.5, y: -1.5, z: 0.9 } },
        },
        margin: { l: 0, r: 0, t: 28, b: 0 },
        showlegend: false,
      }}
      config={PLOT_CONFIG}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler
    />
  )
}

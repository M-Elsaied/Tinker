import createPlotlyComponent from 'react-plotly.js/factory'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import Plotly from 'plotly.js-dist-min'

import { TOKENS, CATEGORICAL_PALETTE } from '@/lib/design-tokens'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Plot = createPlotlyComponent(Plotly as any) as React.ComponentType<any>

export type PlotDensity = 'comfortable' | 'compact'

/** Build a layout snapshot. Re-call on theme change to re-render. */
export function getPlotLayout(density: PlotDensity = 'comfortable') {
  const compact = density === 'compact'
  return {
    font: {
      family: 'Inter, system-ui, sans-serif',
      size: compact ? 11 : 12,
      color: TOKENS.axis,
    },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    colorway: [...CATEGORICAL_PALETTE],
    margin: compact ? { l: 44, r: 14, t: 18, b: 36 } : { l: 56, r: 24, t: 28, b: 44 },
    hoverlabel: {
      bgcolor: TOKENS.cardBg,
      bordercolor: TOKENS.grid,
      font: { color: TOKENS.text, family: 'Inter, system-ui, sans-serif', size: compact ? 11 : 12 },
      align: 'left' as const,
    },
    xaxis: {
      gridcolor: TOKENS.grid,
      zerolinecolor: TOKENS.axisDark,
      linecolor: TOKENS.axisDark,
      tickfont: { size: compact ? 10 : 11, color: TOKENS.axis },
      automargin: true,
    },
    yaxis: {
      gridcolor: TOKENS.grid,
      zerolinecolor: TOKENS.axisDark,
      linecolor: TOKENS.axisDark,
      tickfont: { size: compact ? 10 : 11, color: TOKENS.axis },
      automargin: true,
    },
    transition: { duration: 240, easing: 'cubic-in-out' },
    legend: { font: { color: TOKENS.axis, size: compact ? 10 : 11 } },
  }
}

/** Static convenience exports — kept for back-compat with existing plot components.
 *  Prefer getPlotLayout() in new code so tokens stay reactive. */
export const PLOT_LAYOUT_BASE = getPlotLayout('comfortable')
export const PLOT_LAYOUT_COMPACT = getPlotLayout('compact')

export const PLOT_CONFIG = {
  displaylogo: false,
  responsive: true,
  toImageButtonOptions: { format: 'png' as const, scale: 2 },
  modeBarButtonsToRemove: ['lasso2d', 'select2d'] as const,
}

export { TOKENS, CATEGORICAL_PALETTE, COLORSCALES } from '@/lib/design-tokens'

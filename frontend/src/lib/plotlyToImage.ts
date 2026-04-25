// Plotly.toImage wrapper. Plotly.js is already loaded via plotly.ts.
// We import it lazily to avoid circular references.
import Plotly from 'plotly.js-dist-min'

interface Opts {
  format?: 'png' | 'svg' | 'jpeg'
  width?: number
  height?: number
  scale?: number
}

/** Find the inner Plotly graph div inside a wrapper element. */
function findPlotlyDiv(node: HTMLElement): HTMLElement | null {
  if ((node as any)._fullLayout) return node
  const inner = node.querySelector('.js-plotly-plot') as HTMLElement | null
  if (inner) return inner
  return null
}

/** Convert a live Plotly node into a data-URL image. */
export async function plotlyToImageURL(node: HTMLElement, opts: Opts = {}): Promise<string | null> {
  const plotDiv = findPlotlyDiv(node)
  if (!plotDiv) return null
  try {
    const dataUrl = await Plotly.toImage(plotDiv as any, {
      format: opts.format ?? 'png',
      width: opts.width ?? plotDiv.offsetWidth,
      height: opts.height ?? plotDiv.offsetHeight,
      scale: opts.scale ?? 2,
    } as any)
    return dataUrl as string
  } catch {
    return null
  }
}

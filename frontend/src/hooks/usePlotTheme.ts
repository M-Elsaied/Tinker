import { useEffect, useState } from 'react'
import { getPlotLayout, type PlotDensity } from '@/components/plots/plotly'

/** Returns a Plotly layout object that re-evaluates on theme:change events. */
export function usePlotLayout(density: PlotDensity = 'comfortable') {
  const [layout, setLayout] = useState(() => getPlotLayout(density))
  useEffect(() => {
    const handler = () => setLayout(getPlotLayout(density))
    window.addEventListener('theme:change', handler as EventListener)
    return () => window.removeEventListener('theme:change', handler as EventListener)
  }, [density])
  return layout
}

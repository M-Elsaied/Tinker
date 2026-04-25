/**
 * Single source of truth for colors used by Plotly (which can't read CSS variables).
 * Two snapshots — light + dark — and a getter that picks based on document.documentElement class.
 */

export const TOKENS_LIGHT = {
  axis: '#37475a',
  grid: '#e2e8f0',
  axisDark: '#cbd5e1',
  designPoint: '#0f172a',
  prediction: '#0ea5e9',
  significant: '#16a34a',
  marginal: '#f59e0b',
  insignificant: '#dc2626',
  primary: '#0ea5e9',
  text: '#0f172a',
  textMuted: '#64748b',
  background: '#ffffff',
  cardBg: '#ffffff',
} as const

export const TOKENS_DARK = {
  axis: '#cbd5e1',
  grid: '#1e293b',
  axisDark: '#475569',
  designPoint: '#f8fafc',
  prediction: '#38bdf8',
  significant: '#22c55e',
  marginal: '#fbbf24',
  insignificant: '#f87171',
  primary: '#38bdf8',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  background: '#0b1220',
  cardBg: '#0e1727',
} as const

export type DoeTokens = typeof TOKENS_LIGHT

function isDark(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

/** Reactive token getter — returns the right snapshot for the current theme. */
export const TOKENS = new Proxy({} as DoeTokens, {
  get(_target, prop: string) {
    const src = isDark() ? TOKENS_DARK : TOKENS_LIGHT
    return (src as Record<string, string>)[prop]
  },
}) as DoeTokens

/** Okabe-Ito colorblind-safe categorical palette. */
export const CATEGORICAL_PALETTE = [
  '#0072B2',
  '#E69F00',
  '#009E73',
  '#CC79A7',
  '#56B4E9',
  '#D55E00',
  '#F0E442',
  '#000000',
] as const

export const COLORSCALES = {
  response: 'Viridis',
  desirability: 'RdYlGn',
  leverage: 'Blues',
  cooks: 'OrRd',
} as const

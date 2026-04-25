import { Plot, PLOT_CONFIG, PLOT_LAYOUT_BASE } from './plotly'
import { safeTermLabel, type FactorLike } from '@/lib/termLabel'
import type { CoefficientRow } from '@/types'

export function ParetoChart({
  coefficients,
  alpha = 0.05,
  dfResid,
  tValues,
  factors,
}: {
  coefficients: CoefficientRow[]
  alpha?: number
  dfResid: number
  tValues?: number[]
  factors?: FactorLike[]
}) {
  // Skip the intercept
  const data = coefficients
    .slice(1)
    .map((c, i) => ({
      term: safeTermLabel(c.term, factors),
      t: tValues ? tValues[i] : c.t_value ?? 0,
    }))
    .filter((d) => Number.isFinite(d.t))
    .map((d) => ({ term: d.term, abs_t: Math.abs(d.t), sign: d.t >= 0 ? 1 : -1 }))
    .sort((a, b) => b.abs_t - a.abs_t)

  // t critical for two-sided alpha (Bonferroni-style line is also useful but use t_crit here)
  const tCrit = approxTCrit(alpha, dfResid)

  return (
    <Plot
      data={[
        {
          x: data.map((d) => d.abs_t),
          y: data.map((d) => d.term),
          type: 'bar',
          orientation: 'h',
          marker: {
            color: data.map((d) =>
              d.abs_t >= tCrit ? (d.sign > 0 ? '#0ea5e9' : '#f97316') : '#94a3b8',
            ),
          },
          hovertemplate: '%{y}: |t|=%{x:.3f}<extra></extra>',
        },
        {
          x: [tCrit, tCrit],
          y: [data[data.length - 1]?.term, data[0]?.term],
          mode: 'lines',
          line: { color: '#dc2626', dash: 'dash', width: 1.5 },
          showlegend: false,
          hovertemplate: `t-critical = ${tCrit.toFixed(2)}<extra></extra>`,
        },
      ]}
      layout={{
        ...PLOT_LAYOUT_BASE,
        height: Math.max(220, data.length * 28 + 80),
        showlegend: false,
        xaxis: { title: '|t-value|', gridcolor: '#e2e8f0' },
        yaxis: { autorange: 'reversed', tickfont: { family: 'JetBrains Mono' } },
        margin: { l: 100, r: 30, t: 30, b: 50 },
      }}
      config={PLOT_CONFIG}
      style={{ width: '100%' }}
    />
  )
}

function approxTCrit(alpha: number, df: number): number {
  if (df < 1) return 2.0
  // Approximation for two-sided t-critical
  const z = invNorm(1 - alpha / 2)
  return z * (1 + (z * z + 1) / (4 * df))
}

function invNorm(p: number): number {
  // Beasley-Springer-Moro approximation
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ]
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ]
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ]
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ]
  const pl = 0.02425
  const ph = 1 - pl
  let q: number, r: number
  if (p < pl) {
    q = Math.sqrt(-2 * Math.log(p))
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    )
  }
  if (p <= ph) {
    q = p - 0.5
    r = q * q
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    )
  }
  q = Math.sqrt(-2 * Math.log(1 - p))
  return (
    -(
      ((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]
    ) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  )
}

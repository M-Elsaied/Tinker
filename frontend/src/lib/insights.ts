import type {
  AnalysisResponse, BoxCoxResponse, DiagnosticsResponse,
  Factor, OptimizationSolution, Project,
} from '@/types'

export interface Finding {
  severity: 'success' | 'info' | 'warning' | 'error'
  text: string
}

export interface ResponseFindings {
  responseName: string
  topTerms: { term: string; estimate: number; p: number | null }[]
  fitVerdict: { label: string; severity: Finding['severity'] }
  adeqVerdict?: Finding
  lofVerdict?: Finding
  normalityVerdict?: Finding
  boxCoxRecommendation?: string
  outliers: number[]
  bullets: Finding[]
}

export interface ExecutiveSummary {
  intro: string
  findings: string[]
  recommendations: string[]
}

const SECTION_ROWS = new Set(['Model', 'Residual', 'Lack of Fit', 'Pure Error', 'Cor Total'])

export function keyFindingsForResponse(
  responseName: string,
  analysis: AnalysisResponse,
  diag?: DiagnosticsResponse,
  boxCox?: BoxCoxResponse,
): ResponseFindings {
  const sigCoefs = analysis.coefficients_coded
    .slice(1)
    .filter((c) => c.p_value !== null && c.p_value < 0.05)
    .sort((a, b) => Math.abs(b.estimate) - Math.abs(a.estimate))
  const topTerms = sigCoefs.slice(0, 5).map((c) => ({
    term: c.term, estimate: c.estimate, p: c.p_value,
  }))

  const adj = analysis.adj_r_squared
  const fitVerdict = adj >= 0.9
    ? { label: 'excellent fit', severity: 'success' as const }
    : adj >= 0.7
      ? { label: 'good fit', severity: 'info' as const }
      : { label: 'marginal fit', severity: 'warning' as const }

  const bullets: Finding[] = []

  if (sigCoefs.length > 0) {
    bullets.push({
      severity: 'success',
      text: `Significant terms (p < 0.05): ${topTerms.map((t) => t.term).join(', ')}.`,
    })
  } else {
    bullets.push({
      severity: 'warning',
      text: 'No model terms reach p < 0.05; consider collecting more data or simplifying the model.',
    })
  }

  bullets.push({
    severity: fitVerdict.severity,
    text: `R² = ${analysis.r_squared.toFixed(4)}, Adj R² = ${analysis.adj_r_squared.toFixed(4)} — ${fitVerdict.label}.`,
  })

  let adeqVerdict: Finding | undefined
  if (analysis.adeq_precision !== null) {
    if (analysis.adeq_precision >= 4) {
      adeqVerdict = { severity: 'success', text: `Adequate Precision = ${analysis.adeq_precision.toFixed(2)} (>4 — model is adequate for navigating the design space).` }
    } else {
      adeqVerdict = { severity: 'warning', text: `Adequate Precision = ${analysis.adeq_precision.toFixed(2)} (<4 — signal may be too weak for prediction).` }
    }
    bullets.push(adeqVerdict)
  }

  let lofVerdict: Finding | undefined
  const lofRow = analysis.anova.find((r) => r.source === 'Lack of Fit')
  if (lofRow && lofRow.p_value !== null) {
    if (lofRow.p_value > 0.10) {
      lofVerdict = { severity: 'success', text: `Lack-of-fit not significant (p = ${lofRow.p_value.toFixed(4)}).` }
    } else if (lofRow.p_value > 0.05) {
      lofVerdict = { severity: 'warning', text: `Lack-of-fit borderline (p = ${lofRow.p_value.toFixed(4)}).` }
    } else {
      lofVerdict = { severity: 'error', text: `Significant lack of fit (p = ${lofRow.p_value.toFixed(4)}) — try a higher-order model or transformation.` }
    }
    bullets.push(lofVerdict)
  }

  let normalityVerdict: Finding | undefined
  if (diag?.shapiro_p !== undefined && diag?.shapiro_p !== null) {
    normalityVerdict = diag.shapiro_p > 0.05
      ? { severity: 'info', text: `Shapiro–Wilk p = ${diag.shapiro_p.toFixed(4)} — residuals look normal.` }
      : { severity: 'warning', text: `Shapiro–Wilk p = ${diag.shapiro_p.toFixed(4)} — residuals deviate from normality; consider Box–Cox.` }
    bullets.push(normalityVerdict)
  }

  let boxCoxRecommendation: string | undefined
  if (boxCox && boxCox.recommendation && boxCox.recommendation !== 'none') {
    boxCoxRecommendation = boxCox.recommendation
    bullets.push({ severity: 'info', text: `Box–Cox suggests a "${boxCox.recommendation}" transform (λ* = ${boxCox.lambda_best.toFixed(2)}).` })
  }

  const outliers: number[] = []
  if (diag?.studentized) {
    diag.studentized.forEach((v, i) => {
      if (Math.abs(v) > 3) outliers.push(diag.run_order?.[i] ?? i + 1)
    })
  }
  if (outliers.length > 0) {
    bullets.push({ severity: 'warning', text: `${outliers.length} outlier${outliers.length === 1 ? '' : 's'} (|studentized| > 3) at run${outliers.length === 1 ? '' : 's'} ${outliers.join(', ')}.` })
  }

  return {
    responseName,
    topTerms,
    fitVerdict,
    adeqVerdict,
    lofVerdict,
    normalityVerdict,
    boxCoxRecommendation,
    outliers,
    bullets,
  }
}

function describeFactors(factors: Factor[]): string {
  return factors
    .map((f) => `${f.name} (${formatNum(f.low)}–${formatNum(f.high)}${f.units ? ' ' + f.units : ''})`)
    .join(', ')
}

function describeDesign(designType: string, n: number): string {
  const map: Record<string, string> = {
    full_factorial: `${n}-run full factorial`,
    fractional_factorial: `${n}-run fractional factorial`,
    plackett_burman: `${n}-run Plackett–Burman screening`,
    ccd: `${n}-run central composite design (CCD)`,
    box_behnken: `${n}-run Box–Behnken design`,
    definitive_screening: `${n}-run definitive screening design`,
    optimal_d: `${n}-run D-optimal design`,
    optimal_i: `${n}-run I-optimal design`,
    simplex_lattice: `${n}-run simplex lattice mixture`,
    simplex_centroid: `${n}-run simplex centroid mixture`,
    latin_hypercube: `${n}-run Latin hypercube`,
  }
  return map[designType] ?? `${n}-run ${designType.replace(/_/g, ' ')}`
}

function formatNum(v: number): string {
  if (!Number.isFinite(v)) return '—'
  if (Math.abs(v) >= 1e6 || (Math.abs(v) < 1e-3 && v !== 0)) return v.toExponential(2)
  return v.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export function executiveSummary(
  project: Project,
  perResponse: ResponseFindings[],
  bestSolution?: OptimizationSolution,
): ExecutiveSummary {
  const responseList = project.responses.map((r) => r.name).join(', ')
  const intro = `A ${describeDesign(project.designType, project.designRows.length)} was performed to characterize ${responseList} as a function of ${describeFactors(project.factors)}.`

  const findings: string[] = []
  for (const r of perResponse) {
    const lof = r.lofVerdict ? ` ${r.lofVerdict.text}` : ''
    const top = r.topTerms.length > 0
      ? ` The dominant terms are ${r.topTerms.slice(0, 4).map((t) => t.term).join(', ')}.`
      : ' No model terms reached the 0.05 significance threshold.'
    findings.push(
      `For ${r.responseName}, the fitted model achieves R² = ${r.fitVerdict.label === 'excellent fit' ? '≥ 0.90' : ''}${(perResponseFinding(r))}${top}${lof}`.trim(),
    )
  }

  const recommendations: string[] = []
  if (bestSolution) {
    const factorParts = Object.entries(bestSolution.factors)
      .map(([k, v]) => `${k} = ${formatNum(v)}`)
      .join(', ')
    const respParts = Object.entries(bestSolution.responses)
      .map(([k, v]) => `${k} ≈ ${formatNum(v)}`)
      .join(', ')
    recommendations.push(
      `The best operating point identified by numerical optimization (composite desirability D = ${bestSolution.composite_desirability.toFixed(3)}) is ${factorParts}, predicting ${respParts}.`,
    )
    recommendations.push('Run one or two confirmation experiments at the recommended setting and compare the observed response to the 95 % prediction interval before locking the process.')
  } else {
    recommendations.push('Numerical optimization has not yet been run; configure goals on the Optimization page to generate a recommendation.')
  }

  for (const r of perResponse) {
    if (r.boxCoxRecommendation && r.boxCoxRecommendation !== 'none') {
      recommendations.push(`For ${r.responseName}, a "${r.boxCoxRecommendation}" transformation may stabilize the variance — consider re-fitting after applying it.`)
    }
    if (r.lofVerdict?.severity === 'error') {
      recommendations.push(`Address the significant lack-of-fit on ${r.responseName} before trusting predictions away from the design points.`)
    }
    if (r.outliers.length > 0) {
      recommendations.push(`Investigate run${r.outliers.length === 1 ? '' : 's'} ${r.outliers.join(', ')} of ${r.responseName} — high studentized residuals suggest data-quality issues.`)
    }
  }

  return { intro, findings, recommendations }
}

function perResponseFinding(r: ResponseFindings): string {
  // Returns a brief inline statistic snippet for the executive summary.
  return ''  // Adj R² is already implied by the fitVerdict; keep findings concise.
}

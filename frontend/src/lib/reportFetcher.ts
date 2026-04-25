import {
  boxCox, diagnostics, explainAnalysis, fitSummary, optimize, predictGrid, runAnalysis,
} from '@/services/api'
import type {
  AnalysisResponse, BoxCoxResponse, DiagnosticsResponse, FitSummaryResponse,
  NarrativeResponse, OptimizationResponse, PredictionGridResponse, Project, ResponseGoalConfig,
} from '@/types'

export interface ReportData {
  perResponse: {
    name: string
    analysis: AnalysisResponse
    diagnostics: DiagnosticsResponse
    fitSummary?: FitSummaryResponse
    boxCox?: BoxCoxResponse
    narrative?: NarrativeResponse
    contour?: PredictionGridResponse | null
  }[]
  optimization?: OptimizationResponse
}

interface FetchOpts {
  goalsByResponseIdx?: Record<number, ResponseGoalConfig>
}

export async function fetchAllAnalyses(
  project: Project,
  opts: FetchOpts = {},
): Promise<ReportData> {
  const codedMatrix = project.designRows.map((r) => r.coded)
  const perResponse: ReportData['perResponse'] = []

  for (let i = 0; i < project.responses.length; i++) {
    const r = project.responses[i]
    const filled = r.data.filter((v): v is number => v !== null && v !== undefined && !Number.isNaN(v))
    if (filled.length < 4) continue

    const order = r.modelOrder ?? 'linear'
    const analysis = await runAnalysis({
      factors: project.factors, coded_matrix: codedMatrix, response: r.data,
      response_name: r.name, model_order: order, selected_terms: r.selectedTerms ?? null, alpha: 0.05,
    })
    const diag = await diagnostics({
      factors: project.factors, coded_matrix: codedMatrix, response: r.data,
      selected_terms: analysis.terms,
    })
    let fs: FitSummaryResponse | undefined
    try {
      fs = await fitSummary({ factors: project.factors, coded_matrix: codedMatrix, response: r.data })
    } catch { /* ignore */ }
    let bc: BoxCoxResponse | undefined
    try { bc = await boxCox(filled) } catch { /* ignore */ }

    let narrative: NarrativeResponse | undefined
    try {
      const lof = analysis.anova.find((row) => row.source === 'Lack of Fit')
      narrative = await explainAnalysis({
        anova: analysis.anova,
        r_squared: analysis.r_squared,
        adj_r_squared: analysis.adj_r_squared,
        pred_r_squared: analysis.pred_r_squared,
        adeq_precision: analysis.adeq_precision,
        shapiro_p: diag.shapiro_p,
        lack_of_fit_p: lof?.p_value ?? null,
        cv_percent: analysis.cv_percent,
        n_obs: analysis.n_obs,
        response_name: r.name,
      })
    } catch { /* ignore */ }

    let contour: PredictionGridResponse | null = null
    if (project.factors.length >= 2) {
      try {
        contour = await predictGrid({
          factors: project.factors, coded_matrix: codedMatrix, response: r.data,
          selected_terms: analysis.terms,
          x_factor: project.factors[0].name, y_factor: project.factors[1].name,
          held_constant: {}, held_constant_units: 'coded', grid_size: 28,
        })
      } catch { /* ignore */ }
    }

    perResponse.push({
      name: r.name, analysis, diagnostics: diag, fitSummary: fs, boxCox: bc, narrative, contour,
    })
  }

  // Optimization (best-effort): use provided goals or build defaults from data
  let optimization: OptimizationResponse | undefined
  try {
    const goals: ResponseGoalConfig[] = []
    for (let i = 0; i < project.responses.length; i++) {
      const r = project.responses[i]
      const found = perResponse.find((p) => p.name === r.name)
      const filled = r.data.filter((v): v is number => v !== null && v !== undefined && !Number.isNaN(v))
      const lo = filled.length ? Math.min(...filled) : 0
      const hi = filled.length ? Math.max(...filled) : 1
      const userGoal = opts.goalsByResponseIdx?.[i]
      goals.push(userGoal ?? {
        name: r.name,
        selected_terms: found?.analysis.terms ?? [],
        goal: 'maximize',
        lower: lo, upper: hi, target: null,
        weight: 1, importance: 3,
      })
    }
    if (perResponse.length > 0) {
      optimization = await optimize({
        factors: project.factors, coded_matrix: codedMatrix,
        responses: project.responses.map((r) => ({ name: r.name, data: r.data })),
        goals, n_starts: 25, seed: 42,
      })
    }
  } catch { /* ignore */ }

  return { perResponse, optimization }
}

import axios from 'axios'
import type {
  AnalysisResponse,
  AnovaTermRow,
  BoxCoxResponse,
  DiagnosticsResponse,
  EffectsResponse,
  Factor,
  FitSummaryResponse,
  GenerateDesignRequest,
  GenerateDesignResponse,
  ModelOrder,
  NarrativeResponse,
  OptimizationResponse,
  PredictionGridResponse,
  ResponseGoalConfig,
} from '@/types'

const client = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

export async function generateDesign(
  req: GenerateDesignRequest,
): Promise<GenerateDesignResponse> {
  const { data } = await client.post('/designs/generate', req)
  return data
}

export async function runAnalysis(req: {
  factors: Factor[]
  coded_matrix: number[][]
  response: (number | null)[]
  response_name: string
  model_order: ModelOrder
  selected_terms?: string[] | null
  alpha?: number
}): Promise<AnalysisResponse> {
  const { data } = await client.post('/analysis/run', req)
  return data
}

export async function fitSummary(req: {
  factors: Factor[]
  coded_matrix: number[][]
  response: (number | null)[]
}): Promise<FitSummaryResponse> {
  const { data } = await client.post('/analysis/fit-summary', req)
  return data
}

export async function diagnostics(req: {
  factors: Factor[]
  coded_matrix: number[][]
  response: (number | null)[]
  selected_terms: string[]
}): Promise<DiagnosticsResponse> {
  const { data } = await client.post('/diagnostics/residuals', req)
  return data
}

export async function predictGrid(req: {
  factors: Factor[]
  coded_matrix: number[][]
  response: (number | null)[]
  selected_terms: string[]
  x_factor: string
  y_factor?: string | null
  held_constant?: Record<string, number>
  held_constant_units?: 'coded' | 'actual'
  grid_size?: number
}): Promise<PredictionGridResponse> {
  const { data } = await client.post('/analysis/predict-grid', req)
  return data
}

export async function computeEffects(req: {
  factors: Factor[]
  coded_matrix: number[][]
  response: (number | null)[]
  model_order?: ModelOrder
  alpha?: number
  gamma?: number
}): Promise<EffectsResponse> {
  const { data } = await client.post('/analysis/effects', req)
  return data
}

export interface PointPredictionResponse {
  predicted: number
  std_error: number
  std_error_pred: number
  ci_low: number | null
  ci_high: number | null
  pi_low: number | null
  pi_high: number | null
  ti_low: number | null
  ti_high: number | null
  df_residual: number
}

export async function predictPoint(req: {
  factors: Factor[]
  coded_matrix: number[][]
  response: (number | null)[]
  selected_terms: string[]
  point: Record<string, number>
  point_units?: 'actual' | 'coded'
  alpha?: number
}): Promise<PointPredictionResponse> {
  const { data } = await client.post('/prediction/point', req)
  return data
}

export interface ProfilerCurveResponse {
  x: number[]
  x_coded: number[]
  y: number[]
  ci_low: number[]
  ci_high: number[]
}

export async function profilerCurve(req: {
  factors: Factor[]
  coded_matrix: number[][]
  response: (number | null)[]
  selected_terms: string[]
  current_point: Record<string, number>
  point_units?: 'actual' | 'coded'
  varying_factor: string
  n_points?: number
}): Promise<ProfilerCurveResponse> {
  const { data } = await client.post('/prediction/profiler', req)
  return data
}

export async function explainAnalysis(req: {
  anova: AnovaTermRow[]
  r_squared: number
  adj_r_squared: number
  pred_r_squared?: number | null
  adeq_precision?: number | null
  shapiro_p?: number | null
  lack_of_fit_p?: number | null
  cv_percent: number
  n_obs: number
  response_name?: string
}): Promise<NarrativeResponse> {
  const { data } = await client.post('/narrative/explain', req)
  return data
}

export async function boxCox(response: number[]): Promise<BoxCoxResponse> {
  const { data } = await client.post('/transforms/box-cox', { response })
  return data
}

export interface GraphicalOverlayResponse {
  x_values: number[]
  y_values: number[]
  x_factor: string
  y_factor: string
  surfaces: Record<string, number[][]>
  feasible_masks: Record<string, boolean[][]>
  sweet_spot_mask: boolean[][]
}

export async function graphicalOverlay(req: {
  factors: Factor[]
  coded_matrix: number[][]
  responses: { name: string; data: (number | null)[] }[]
  goals: ResponseGoalConfig[]
  x_factor: string
  y_factor: string
  held_constant?: Record<string, number>
  held_constant_units?: 'coded' | 'actual'
  grid_size?: number
}): Promise<GraphicalOverlayResponse> {
  const { data } = await client.post('/optimization/graphical', req)
  return data
}

export async function optimize(req: {
  factors: Factor[]
  coded_matrix: number[][]
  responses: { name: string; data: (number | null)[] }[]
  goals: ResponseGoalConfig[]
  n_starts?: number
  seed?: number
}): Promise<OptimizationResponse> {
  const { data } = await client.post('/optimization/numerical', req)
  return data
}

export interface EvaluateResponse {
  n_runs: number
  n_terms: number
  model_order: string
  condition_number: number | null
  max_leverage: number | null
  avg_leverage: number | null
  leverage: number[]
  vif: Record<string, number>
  fds: { fraction: number[]; sd_pred: number[] }
  warnings: { severity: string; text: string }[]
}

export async function evaluateDesign(req: {
  factors: Factor[]
  coded_matrix: number[][]
  model_order?: ModelOrder
}): Promise<EvaluateResponse> {
  const { data } = await client.post('/design/evaluate', req)
  return data
}

export interface PowerResponse {
  per_term: { term: string; power: number; var_coef: number }[]
  df_residual: number
  n_runs: number
  n_terms: number
}

export async function designPower(req: {
  factors: Factor[]
  coded_matrix: number[][]
  model_order?: ModelOrder
  signal_to_noise?: number
  alpha?: number
}): Promise<PowerResponse> {
  const { data } = await client.post('/design/power', req)
  return data
}

export interface AugmentResponse {
  rows: import('@/types').DesignRow[]
  n_runs: number
  operation: string
}

export async function augmentDesign(req: {
  operation: 'add_axial' | 'add_center' | 'fold_over' | 'add_replicate'
  factors: Factor[]
  coded_matrix: number[][]
  n_centers?: number
  alpha?: number
  n_reps?: number
}): Promise<AugmentResponse> {
  const { data } = await client.post('/designs/augment', req)
  return data
}

export async function health(): Promise<boolean> {
  try {
    const { data } = await client.get('/health')
    return data.status === 'ok'
  } catch {
    return false
  }
}

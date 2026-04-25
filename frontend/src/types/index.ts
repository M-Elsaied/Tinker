export type DesignType =
  | 'full_factorial'
  | 'fractional_factorial'
  | 'plackett_burman'
  | 'ccd'
  | 'box_behnken'
  | 'definitive_screening'
  | 'optimal_d'
  | 'optimal_i'
  | 'simplex_lattice'
  | 'simplex_centroid'
  | 'latin_hypercube'

export type ModelFamily = 'ols' | 'logistic' | 'poisson'

export type ModelOrder = 'mean' | 'linear' | '2fi' | 'quadratic' | 'cubic'

export type GoalType = 'none' | 'minimize' | 'maximize' | 'target' | 'in_range'

export type CCDType = 'circumscribed' | 'inscribed' | 'face_centered'

export interface Factor {
  name: string
  low: number
  high: number
  units?: string
}

export interface Response {
  name: string
  units?: string
  data: (number | null)[]
  selectedTerms?: string[]
  modelOrder?: ModelOrder
  family?: ModelFamily
}

export interface DesignRow {
  run: number
  std_order: number
  coded: number[]
  actual: number[]
  point_type: string
}

export interface GenerateDesignRequest {
  design_type: DesignType
  factors: Factor[]
  center_points?: number
  replicates?: number
  randomize?: boolean
  seed?: number
  fraction?: number
  ccd_type?: CCDType
  alpha?: number | null
}

export interface GenerateDesignResponse {
  design_type: DesignType
  factor_names: string[]
  rows: DesignRow[]
  n_runs: number
  info: Record<string, unknown>
}

export interface AnovaTermRow {
  source: string
  sum_sq: number
  df: number
  mean_sq: number
  f_value: number | null
  p_value: number | null
}

export interface CoefficientRow {
  term: string
  estimate: number
  std_error: number
  t_value: number | null
  p_value: number | null
  vif: number | null
  ci_low: number | null
  ci_high: number | null
}

export interface AnalysisResponse {
  terms: string[]
  anova: AnovaTermRow[]
  coefficients_coded: CoefficientRow[]
  coefficients_actual: CoefficientRow[]
  r_squared: number
  adj_r_squared: number
  pred_r_squared: number | null
  adeq_precision: number | null
  std_dev: number
  mean: number
  cv_percent: number
  press: number | null
  n_obs: number
  df_residual: number
  equation_coded: string
  equation_actual: string
}

export interface FitSummaryRow {
  model_order: ModelOrder
  sequential_p: number | null
  lack_of_fit_p: number | null
  r_squared: number
  adj_r_squared: number
  pred_r_squared: number | null
  press: number | null
  aliased: boolean
  suggested: boolean
}

export interface FitSummaryResponse {
  rows: FitSummaryRow[]
  suggested: ModelOrder
}

export interface DiagnosticsResponse {
  fitted: number[]
  residuals: number[]
  studentized: number[]
  externally_studentized: number[]
  leverage: number[]
  cooks_distance: number[]
  dffits: number[]
  run_order: number[]
  normal_theoretical: number[]
  normal_ordered: number[]
  shapiro_stat: number | null
  shapiro_p: number | null
}

export interface DesignPointProjection {
  x: number
  y: number
  z: number
  distance: number
  in_slice: boolean
  point_type: string
  run: number
}

export interface CurrentPointInfo {
  x: number
  y: number
  z: number
  se: number
}

export interface PredictionGridResponse {
  x_values: number[]
  y_values: number[] | null
  z_values: number[][] | null
  z_se: number[][] | null
  perturbation: Record<string, { x: number[]; y: number[] }> | null
  design_points?: DesignPointProjection[] | null
  current_point?: CurrentPointInfo | null
}

export type PaneViewId =
  | 'normal-prob' | 'resid-vs-pred' | 'resid-vs-run' | 'resid-vs-factor'
  | 'cooks' | 'leverage' | 'dffits' | 'pred-vs-actual' | 'box-cox'
  | 'contour' | 'surface' | 'interaction' | 'perturbation' | 'one-factor' | 'cube'

export interface NarrativeItem {
  kind: string
  severity: 'info' | 'success' | 'warning' | 'error'
  text: string
}

export interface NarrativeResponse {
  paragraphs: NarrativeItem[]
}

export interface ResponseGoalConfig {
  name: string
  selected_terms: string[]
  goal: GoalType
  lower: number
  upper: number
  target: number | null
  weight: number
  importance: number
}

export interface OptimizationSolution {
  factors: Record<string, number>
  responses: Record<string, number>
  individual_desirabilities: Record<string, number>
  composite_desirability: number
}

export interface OptimizationResponse {
  solutions: OptimizationSolution[]
}

export interface EffectsResponse {
  terms: string[]
  effects: number[]
  abs_effects: number[]
  sum_sq: number[]
  pct_contribution: number[]
  pse: number
  t_me: number
  t_sme: number
  suggested_terms: string[]
}

export interface BoxCoxResponse {
  lambda_best: number
  lambda_ci_low: number
  lambda_ci_high: number
  lambda_grid: number[]
  log_likelihood: number[]
  recommendation: string
}

export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  designType: DesignType
  factors: Factor[]
  designRows: DesignRow[]
  responses: Response[]
  designInfo: Record<string, unknown>
}

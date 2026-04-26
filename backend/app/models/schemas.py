from typing import Optional
from pydantic import BaseModel, Field

from app.models.enums import DesignType, ModelOrder, GoalType, CCDType, ModelFamily


class Factor(BaseModel):
    name: str
    low: float
    high: float
    units: str = ""


class GenerateDesignRequest(BaseModel):
    design_type: DesignType
    factors: list[Factor]
    center_points: int = 0
    replicates: int = 1
    randomize: bool = True
    seed: Optional[int] = None
    fraction: Optional[int] = None  # for fractional factorial: 2^(k-p) where p is fraction
    ccd_type: CCDType = CCDType.CIRCUMSCRIBED
    alpha: Optional[float] = None  # custom alpha for CCD


class DesignRow(BaseModel):
    run: int
    std_order: int
    coded: list[float]
    actual: list[float]
    point_type: str  # 'factorial', 'center', 'axial'


class GenerateDesignResponse(BaseModel):
    design_type: DesignType
    factor_names: list[str]
    rows: list[DesignRow]
    n_runs: int
    info: dict


class AnalysisRequest(BaseModel):
    factors: list[Factor]
    coded_matrix: list[list[float]]  # n_runs x n_factors in coded units
    response: list[Optional[float]]  # may include None for incomplete data
    response_name: str = "Response"
    model_order: ModelOrder = ModelOrder.LINEAR
    selected_terms: Optional[list[str]] = None  # explicit term selection
    alpha: float = 0.05
    family: ModelFamily = ModelFamily.OLS


class AnovaTermRow(BaseModel):
    source: str
    sum_sq: float
    df: int
    mean_sq: Optional[float] = None
    f_value: Optional[float] = None
    p_value: Optional[float] = None


class CoefficientRow(BaseModel):
    term: str
    estimate: float
    std_error: float
    t_value: Optional[float] = None
    p_value: Optional[float] = None
    vif: Optional[float] = None
    ci_low: Optional[float] = None
    ci_high: Optional[float] = None


class AnalysisResponse(BaseModel):
    terms: list[str]
    anova: list[AnovaTermRow]
    coefficients_coded: list[CoefficientRow]
    coefficients_actual: list[CoefficientRow]
    r_squared: float
    adj_r_squared: float
    pred_r_squared: Optional[float] = None
    adeq_precision: Optional[float] = None
    std_dev: float
    mean: float
    cv_percent: float
    press: Optional[float] = None
    n_obs: int
    df_residual: int
    equation_coded: str
    equation_actual: str


class FitSummaryRequest(BaseModel):
    factors: list[Factor]
    coded_matrix: list[list[float]]
    response: list[Optional[float]]


class FitSummaryRow(BaseModel):
    model_order: ModelOrder
    sequential_p: Optional[float] = None
    lack_of_fit_p: Optional[float] = None
    r_squared: float
    adj_r_squared: float
    pred_r_squared: Optional[float] = None
    press: Optional[float] = None
    aliased: bool = False
    suggested: bool = False


class FitSummaryResponse(BaseModel):
    rows: list[FitSummaryRow]
    suggested: ModelOrder


class DiagnosticsRequest(BaseModel):
    factors: list[Factor]
    coded_matrix: list[list[float]]
    response: list[Optional[float]]
    selected_terms: list[str]


class DiagnosticsResponse(BaseModel):
    fitted: list[float]
    residuals: list[float]
    studentized: list[float]
    externally_studentized: list[float]
    leverage: list[float]
    cooks_distance: list[float]
    dffits: list[float]
    run_order: list[int]
    normal_theoretical: list[float]
    normal_ordered: list[float]
    shapiro_stat: Optional[float] = None
    shapiro_p: Optional[float] = None


class AssumptionsRequest(BaseModel):
    factors: list[Factor]
    coded_matrix: list[list[float]]
    response: list[Optional[float]]
    response_name: str = "Response"


class FactorLevelStats(BaseModel):
    coded_level: float                   # -1, 0, +1
    actual_level: float                  # decoded
    n: int
    mean: float
    median: float
    std: float
    q1: float
    q3: float
    min: float
    max: float
    values: list[float]                  # raw observations at this level
    shapiro_stat: Optional[float] = None # per-level normality
    shapiro_p: Optional[float] = None
    shapiro_skipped_reason: Optional[str] = None  # if n < 3


class FactorAssumptions(BaseModel):
    factor_name: str
    units: str
    levels: list[FactorLevelStats]
    levene_stat: Optional[float] = None  # variance homogeneity across levels
    levene_p: Optional[float] = None
    bartlett_stat: Optional[float] = None
    bartlett_p: Optional[float] = None
    homogeneity_skipped_reason: Optional[str] = None  # if any level has < 2 obs


class AssumptionsResponse(BaseModel):
    response_name: str
    n_observations: int
    overall_shapiro_stat: Optional[float] = None
    overall_shapiro_p: Optional[float] = None
    factors: list[FactorAssumptions]


class BoxCoxRequest(BaseModel):
    response: list[float]


class BoxCoxResponse(BaseModel):
    lambda_best: float
    lambda_ci_low: float
    lambda_ci_high: float
    lambda_grid: list[float]
    log_likelihood: list[float]
    recommendation: str  # "none" | "ln" | "sqrt" | "inverse" | "square" | numeric


class PredictionGridRequest(BaseModel):
    factors: list[Factor]
    coded_matrix: list[list[float]]
    response: list[Optional[float]]
    selected_terms: list[str]
    x_factor: str  # name of factor on x axis
    y_factor: Optional[str] = None  # if provided -> contour/surface; else perturbation
    held_constant: dict[str, float] = Field(default_factory=dict)
    held_constant_units: str = "actual"  # "actual" | "coded"
    grid_size: int = 30


class PredictionGridResponse(BaseModel):
    x_values: list[float]
    y_values: Optional[list[float]] = None
    z_values: Optional[list[list[float]]] = None  # for contour/surface
    z_se: Optional[list[list[float]]] = None
    perturbation: Optional[dict[str, dict[str, list[float]]]] = None  # factor -> {x:[], y:[]}
    # Projection of actual experimental runs onto (x_factor, y_factor) plane.
    # Each entry: (x_actual, y_actual, response_value, point_type, run, distance_from_slice)
    design_points: Optional[list[dict]] = None
    # Predicted value at the held-constant slice for the "current point" marker.
    current_point: Optional[dict] = None


class ResponseGoal(BaseModel):
    name: str
    selected_terms: list[str]
    goal: GoalType
    lower: float
    upper: float
    target: Optional[float] = None
    weight: float = 1.0
    importance: int = 3


class OptimizationRequest(BaseModel):
    factors: list[Factor]
    coded_matrix: list[list[float]]
    responses: list[dict]  # {name, data: list[float]}
    goals: list[ResponseGoal]
    factor_goals: dict[str, GoalType] = Field(default_factory=dict)  # optional per-factor goals
    n_starts: int = 25
    seed: Optional[int] = None


class OptimizationSolution(BaseModel):
    factors: dict[str, float]
    responses: dict[str, float]
    individual_desirabilities: dict[str, float]
    composite_desirability: float


class OptimizationResponse(BaseModel):
    solutions: list[OptimizationSolution]

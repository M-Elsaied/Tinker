from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.schemas import Factor
from app.services.point_prediction import predict_point, profiler_curve, cube_predictions

router = APIRouter()


class PointRequest(BaseModel):
    factors: list[Factor]
    coded_matrix: list[list[float]]
    response: list[Optional[float]]
    selected_terms: list[str]
    point: dict[str, float]
    point_units: str = "actual"
    alpha: float = 0.05


class PointResponse(BaseModel):
    predicted: float
    std_error: float
    std_error_pred: float
    ci_low: Optional[float]
    ci_high: Optional[float]
    pi_low: Optional[float]
    pi_high: Optional[float]
    ti_low: Optional[float]
    ti_high: Optional[float]
    df_residual: int


@router.post("/point", response_model=PointResponse)
def point_route(req: PointRequest):
    try:
        return predict_point(
            factors=req.factors, coded_matrix=req.coded_matrix, response=req.response,
            selected_terms=req.selected_terms, point=req.point,
            point_units=req.point_units, alpha=req.alpha,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))


class ProfilerRequest(BaseModel):
    factors: list[Factor]
    coded_matrix: list[list[float]]
    response: list[Optional[float]]
    selected_terms: list[str]
    current_point: dict[str, float]
    point_units: str = "coded"
    varying_factor: str
    n_points: int = 50
    alpha: float = 0.05


class ProfilerResponse(BaseModel):
    x: list[float]
    x_coded: list[float]
    y: list[float]
    ci_low: list[float]
    ci_high: list[float]


@router.post("/profiler", response_model=ProfilerResponse)
def profiler_route(req: ProfilerRequest):
    try:
        return profiler_curve(
            factors=req.factors, coded_matrix=req.coded_matrix, response=req.response,
            selected_terms=req.selected_terms, current_point=req.current_point,
            point_units=req.point_units, varying_factor=req.varying_factor,
            n_points=req.n_points, alpha=req.alpha,
        )
    except (ValueError, StopIteration) as e:
        raise HTTPException(400, str(e))


class CubeRequest(BaseModel):
    factors: list[Factor]
    coded_matrix: list[list[float]]
    response: list[Optional[float]]
    selected_terms: list[str]
    factor_names: list[str]
    coded_low: float = -1.0
    coded_high: float = 1.0
    held_constant: Optional[dict[str, float]] = None
    held_constant_units: str = "coded"


@router.post("/cube")
def cube_route(req: CubeRequest):
    try:
        return cube_predictions(
            factors=req.factors, coded_matrix=req.coded_matrix, response=req.response,
            selected_terms=req.selected_terms, factor_names=req.factor_names,
            coded_low=req.coded_low, coded_high=req.coded_high,
            held_constant=req.held_constant, held_constant_units=req.held_constant_units,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))

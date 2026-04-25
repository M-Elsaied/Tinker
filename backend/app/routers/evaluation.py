from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.enums import ModelOrder
from app.models.schemas import Factor
from app.services.evaluation_engine import evaluate_design
from app.services.power_engine import power_analysis

router = APIRouter()


class EvaluateRequest(BaseModel):
    factors: list[Factor]
    coded_matrix: list[list[float]]
    model_order: ModelOrder = ModelOrder.QUADRATIC


@router.post("/evaluate")
def evaluate(req: EvaluateRequest):
    try:
        return evaluate_design(req.factors, req.coded_matrix, req.model_order)
    except (ValueError, np.linalg.LinAlgError) as e:  # type: ignore  # noqa: F821
        raise HTTPException(400, str(e))


class PowerRequest(BaseModel):
    factors: list[Factor]
    coded_matrix: list[list[float]]
    model_order: ModelOrder = ModelOrder.LINEAR
    signal_to_noise: float = 2.0
    alpha: float = 0.05


@router.post("/power")
def power(req: PowerRequest):
    try:
        return power_analysis(req.factors, req.coded_matrix,
                              signal_to_noise=req.signal_to_noise,
                              alpha=req.alpha, model_order=req.model_order)
    except ValueError as e:
        raise HTTPException(400, str(e))


# Need numpy at module scope for HTTP 400 catch-all
import numpy  # noqa: E402
np = numpy

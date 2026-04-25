from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.enums import ModelOrder
from app.models.schemas import Factor
from app.services.effects_engine import compute_effects

router = APIRouter()


class EffectsRequest(BaseModel):
    factors: list[Factor]
    coded_matrix: list[list[float]]
    response: list[Optional[float]]
    model_order: ModelOrder = ModelOrder.TWO_FACTOR_INTERACTION
    alpha: float = 0.05
    gamma: float = 0.95


class EffectsResponse(BaseModel):
    terms: list[str]
    effects: list[float]
    abs_effects: list[float]
    sum_sq: list[float]
    pct_contribution: list[float]
    pse: float
    t_me: float
    t_sme: float
    suggested_terms: list[str]


@router.post("/effects", response_model=EffectsResponse)
def effects_route(req: EffectsRequest) -> EffectsResponse:
    try:
        out = compute_effects(
            factors=req.factors,
            coded_matrix=req.coded_matrix,
            response=req.response,
            model_order=req.model_order,
            alpha=req.alpha,
            gamma=req.gamma,
        )
        return EffectsResponse(**out)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

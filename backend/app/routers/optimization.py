from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.schemas import (
    Factor, OptimizationRequest, OptimizationResponse, ResponseGoal,
)
from app.services.optimization_engine import graphical_overlay, optimize

router = APIRouter()


@router.post("/numerical", response_model=OptimizationResponse)
def numerical(req: OptimizationRequest) -> OptimizationResponse:
    try:
        return optimize(
            factors=req.factors,
            coded_matrix=req.coded_matrix,
            responses=req.responses,
            goals=req.goals,
            n_starts=req.n_starts,
            seed=req.seed,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


class GraphicalRequest(BaseModel):
    factors: list[Factor]
    coded_matrix: list[list[float]]
    responses: list[dict]
    goals: list[ResponseGoal]
    x_factor: str
    y_factor: str
    held_constant: dict[str, float] = {}
    held_constant_units: str = "coded"
    grid_size: int = 40


@router.post("/graphical")
def graphical(req: GraphicalRequest):
    try:
        return graphical_overlay(
            factors=req.factors, coded_matrix=req.coded_matrix,
            responses=req.responses, goals=req.goals,
            x_factor=req.x_factor, y_factor=req.y_factor,
            held_constant=req.held_constant,
            held_constant_units=req.held_constant_units,
            grid_size=req.grid_size,
        )
    except (ValueError, StopIteration) as e:
        raise HTTPException(400, str(e))

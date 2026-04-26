from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    AssumptionsRequest,
    AssumptionsResponse,
    DiagnosticsRequest,
    DiagnosticsResponse,
)
from app.services.assumptions_engine import compute_assumptions
from app.services.diagnostics_engine import compute_diagnostics

router = APIRouter()


@router.post("/residuals", response_model=DiagnosticsResponse)
def residuals(req: DiagnosticsRequest) -> DiagnosticsResponse:
    try:
        return compute_diagnostics(
            factors=req.factors,
            coded_matrix=req.coded_matrix,
            response=req.response,
            selected_terms=req.selected_terms,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/assumptions", response_model=AssumptionsResponse)
def assumptions(req: AssumptionsRequest) -> AssumptionsResponse:
    try:
        return compute_assumptions(
            factors=req.factors,
            coded_matrix=req.coded_matrix,
            response=req.response,
            response_name=req.response_name,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

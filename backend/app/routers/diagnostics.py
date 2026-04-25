from fastapi import APIRouter, HTTPException

from app.models.schemas import DiagnosticsRequest, DiagnosticsResponse
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

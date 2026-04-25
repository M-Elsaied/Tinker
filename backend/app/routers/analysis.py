from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    FitSummaryRequest,
    FitSummaryResponse,
    PredictionGridRequest,
    PredictionGridResponse,
)
from app.models.enums import ModelFamily
from app.services import analysis_engine, prediction_engine
from app.services.glm_engine import fit_glm

router = APIRouter()


@router.post("/run", response_model=AnalysisResponse)
def run(req: AnalysisRequest) -> AnalysisResponse:
    try:
        if req.family != ModelFamily.OLS:
            return fit_glm(
                factors=req.factors, coded_matrix=req.coded_matrix,
                response=req.response, response_name=req.response_name,
                family=req.family, model_order=req.model_order,
                selected_terms=req.selected_terms,
            )
        return analysis_engine.run_analysis(
            factors=req.factors,
            coded_matrix=req.coded_matrix,
            response=req.response,
            response_name=req.response_name,
            model_order=req.model_order,
            selected_terms=req.selected_terms,
            alpha=req.alpha,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/fit-summary", response_model=FitSummaryResponse)
def fit_summary(req: FitSummaryRequest) -> FitSummaryResponse:
    return analysis_engine.fit_summary(
        factors=req.factors,
        coded_matrix=req.coded_matrix,
        response=req.response,
    )


@router.post("/predict-grid", response_model=PredictionGridResponse)
def predict_grid(req: PredictionGridRequest) -> PredictionGridResponse:
    try:
        return prediction_engine.predict_grid(
            factors=req.factors,
            coded_matrix=req.coded_matrix,
            response=req.response,
            selected_terms=req.selected_terms,
            x_factor=req.x_factor,
            y_factor=req.y_factor,
            held_constant=req.held_constant,
            grid_size=req.grid_size,
            held_constant_units=req.held_constant_units,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        raise HTTPException(
            status_code=500,
            detail=f"{type(e).__name__}: {e}\n{tb}",
        ) from e

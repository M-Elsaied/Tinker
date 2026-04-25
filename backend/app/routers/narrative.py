from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.models.schemas import AnovaTermRow
from app.services.narrative_engine import explain

router = APIRouter()


class NarrativeRequest(BaseModel):
    anova: list[AnovaTermRow]
    r_squared: float
    adj_r_squared: float
    pred_r_squared: Optional[float] = None
    adeq_precision: Optional[float] = None
    shapiro_p: Optional[float] = None
    lack_of_fit_p: Optional[float] = None
    cv_percent: float = 0.0
    n_obs: int = 0
    response_name: str = "Response"


class NarrativeItem(BaseModel):
    kind: str
    severity: str
    text: str


class NarrativeResponse(BaseModel):
    paragraphs: list[NarrativeItem]


@router.post("/explain", response_model=NarrativeResponse)
def explain_route(req: NarrativeRequest) -> NarrativeResponse:
    paragraphs = explain(
        anova=[r.model_dump() for r in req.anova],
        r_squared=req.r_squared,
        adj_r_squared=req.adj_r_squared,
        pred_r_squared=req.pred_r_squared,
        adeq_precision=req.adeq_precision,
        shapiro_p=req.shapiro_p,
        lack_of_fit_p=req.lack_of_fit_p,
        cv_percent=req.cv_percent,
        n_obs=req.n_obs,
        response_name=req.response_name,
    )
    return NarrativeResponse(paragraphs=[NarrativeItem(**p) for p in paragraphs])

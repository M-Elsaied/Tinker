from fastapi import APIRouter

from app.models.schemas import BoxCoxRequest, BoxCoxResponse
from app.services.transforms import box_cox_analysis

router = APIRouter()


@router.post("/box-cox", response_model=BoxCoxResponse)
def box_cox(req: BoxCoxRequest) -> BoxCoxResponse:
    return box_cox_analysis(req.response)

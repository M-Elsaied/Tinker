from typing import Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import numpy as np

from app.models.schemas import DesignRow, Factor
from app.services.augment_engine import (
    augment_axial, augment_centers, augment_foldover, augment_replicate,
    coded_to_actual_rows,
)

router = APIRouter()


class AugmentRequest(BaseModel):
    operation: Literal["add_axial", "add_center", "fold_over", "add_replicate"]
    factors: list[Factor]
    coded_matrix: list[list[float]]
    n_centers: int = 0
    alpha: Optional[float] = None
    n_reps: int = 1


class AugmentResponse(BaseModel):
    rows: list[DesignRow]
    n_runs: int
    operation: str


@router.post("/augment", response_model=AugmentResponse)
def augment(req: AugmentRequest):
    try:
        coded = np.array(req.coded_matrix, dtype=float)
        if req.operation == "add_axial":
            new = augment_axial(coded, req.alpha)
        elif req.operation == "add_center":
            new = augment_centers(coded, max(req.n_centers, 1))
        elif req.operation == "fold_over":
            new = augment_foldover(coded)
        else:
            new = augment_replicate(coded, max(req.n_reps, 1))

        actual = coded_to_actual_rows(new, req.factors)
        rows: list[DesignRow] = []
        for i in range(new.shape[0]):
            point_type = "factorial"
            row_coded = new[i].tolist()
            if i >= coded.shape[0]:
                if req.operation == "add_axial":
                    point_type = "axial" if any(abs(v) > 1.001 for v in row_coded) else "factorial"
                elif req.operation == "add_center":
                    point_type = "center"
            else:
                if all(abs(v) < 1e-9 for v in row_coded):
                    point_type = "center"
            rows.append(DesignRow(
                run=i + 1, std_order=i + 1,
                coded=row_coded, actual=actual[i].tolist(),
                point_type=point_type,
            ))
        return AugmentResponse(rows=rows, n_runs=len(rows), operation=req.operation)
    except ValueError as e:
        raise HTTPException(400, str(e))

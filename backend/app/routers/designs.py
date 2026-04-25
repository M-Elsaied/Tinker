from __future__ import annotations

import numpy as np
from fastapi import APIRouter, HTTPException

from app.models.enums import DesignType
from app.models.schemas import (
    DesignRow,
    GenerateDesignRequest,
    GenerateDesignResponse,
)
from app.services.design_generators import factorial as fac
from app.services.design_generators import rsm
from app.services.design_generators import dsd as dsd_mod
from app.services.design_generators import optimal as opt_mod
from app.services.design_generators import latin as latin_mod
from app.services.design_generators import mixture as mix_mod
from app.models.enums import ModelOrder
from app.utils.coding import coded_to_actual

router = APIRouter()


@router.post("/generate", response_model=GenerateDesignResponse)
def generate_design(req: GenerateDesignRequest) -> GenerateDesignResponse:
    n_factors = len(req.factors)
    if n_factors < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 factors")

    info: dict = {}
    point_types: list[str]

    if req.design_type == DesignType.FULL_FACTORIAL:
        base = fac.full_factorial(n_factors)
        base = fac.replicate(base, req.replicates)
        point_types = ["factorial"] * base.shape[0]
        if req.center_points > 0:
            base = fac.add_center_points(base, req.center_points)
            point_types += ["center"] * req.center_points
        info["resolution"] = "Full"
        info["n_factorial"] = 2**n_factors
    elif req.design_type == DesignType.FRACTIONAL_FACTORIAL:
        if req.fraction is None or req.fraction <= 0:
            raise HTTPException(
                status_code=400,
                detail="fraction (p) is required for fractional factorial",
            )
        base = fac.fractional_factorial(n_factors, req.fraction)
        base = fac.replicate(base, req.replicates)
        point_types = ["factorial"] * base.shape[0]
        if req.center_points > 0:
            base = fac.add_center_points(base, req.center_points)
            point_types += ["center"] * req.center_points
        info["fraction"] = f"2^({n_factors}-{req.fraction})"
        info["n_factorial"] = 2 ** (n_factors - req.fraction)
    elif req.design_type == DesignType.PLACKETT_BURMAN:
        base = fac.plackett_burman(n_factors)
        # Drop dummy columns beyond requested factor count
        base = base[:, :n_factors]
        base = fac.replicate(base, req.replicates)
        point_types = ["factorial"] * base.shape[0]
        if req.center_points > 0:
            base = fac.add_center_points(base, req.center_points)
            point_types += ["center"] * req.center_points
        info["n_factorial"] = base.shape[0]
    elif req.design_type == DesignType.CCD:
        base, point_types = rsm.ccd(
            n_factors,
            center_points_factorial=max(req.center_points, 0),
            center_points_axial=0,
            ccd_type=req.ccd_type,
            alpha=req.alpha,
        )
        if req.replicates > 1:
            base = fac.replicate(base, req.replicates)
            point_types = list(point_types) * req.replicates
        info["alpha"] = float(req.alpha) if req.alpha is not None else round(
            (2**n_factors) ** 0.25, 4
        )
        info["ccd_type"] = req.ccd_type.value
    elif req.design_type == DesignType.BOX_BEHNKEN:
        base, point_types = rsm.box_behnken(
            n_factors, center_points=max(req.center_points, 3)
        )
        info["n_blocks"] = 1
    elif req.design_type == DesignType.DEFINITIVE_SCREENING:
        base, point_types = dsd_mod.dsd(n_factors)
        info["construction"] = "Jones-Nachtsheim DSD"
    elif req.design_type in (DesignType.OPTIMAL_D, DesignType.OPTIMAL_I):
        criterion = "d" if req.design_type == DesignType.OPTIMAL_D else "i"
        n_runs_target = req.center_points if req.center_points >= 8 else 16  # Reuse field as run count
        base, point_types = opt_mod.coordinate_exchange(
            req.factors, n_runs=n_runs_target,
            model_order=ModelOrder.QUADRATIC, criterion=criterion,  # type: ignore
            n_iterations=4, seed=req.seed or 42,
        )
        info["criterion"] = f"{criterion.upper()}-optimal"
    elif req.design_type == DesignType.LATIN_HYPERCUBE:
        n_runs_target = req.center_points if req.center_points >= n_factors * 2 else n_factors * 4
        base = latin_mod.latin_hypercube(n_factors, n_runs_target, seed=req.seed or 42)
        point_types = ["factorial"] * base.shape[0]
        info["construction"] = "Latin hypercube (maximin)"
    elif req.design_type == DesignType.SIMPLEX_LATTICE:
        base, point_types = mix_mod.simplex_lattice(n_factors, degree=2)
        info["mixture_kind"] = "simplex_lattice"
        info["sums_to_1"] = True
    elif req.design_type == DesignType.SIMPLEX_CENTROID:
        base, point_types = mix_mod.simplex_centroid(n_factors)
        info["mixture_kind"] = "simplex_centroid"
        info["sums_to_1"] = True
    else:
        raise HTTPException(status_code=400, detail=f"Unknown design type: {req.design_type}")

    n_runs = base.shape[0]
    std_order = np.arange(1, n_runs + 1)
    if req.randomize:
        rng = np.random.default_rng(req.seed)
        run_order = rng.permutation(n_runs)
    else:
        run_order = np.arange(n_runs)

    if req.design_type in (DesignType.SIMPLEX_LATTICE, DesignType.SIMPLEX_CENTROID):
        # Mixture: components already in [0,1] summing to 1; "actual" = same
        actual = base.copy()
    else:
        actual = coded_to_actual(base, req.factors)

    rows: list[DesignRow] = []
    for run_idx, src_idx in enumerate(run_order):
        rows.append(
            DesignRow(
                run=run_idx + 1,
                std_order=int(std_order[src_idx]),
                coded=base[src_idx].tolist(),
                actual=actual[src_idx].tolist(),
                point_type=point_types[src_idx],
            )
        )

    return GenerateDesignResponse(
        design_type=req.design_type,
        factor_names=[f.name for f in req.factors],
        rows=rows,
        n_runs=n_runs,
        info=info,
    )

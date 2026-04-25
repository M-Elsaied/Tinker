"""Build prediction grids for contour plots, 3D surfaces, and perturbation plots."""
from __future__ import annotations

from typing import Optional

import numpy as np

from app.models.schemas import Factor, PredictionGridResponse
from app.services.analysis_engine import _filter_observed, _ols_fit, _safe
from app.services.terms import build_design_matrix, factor_codes
from app.utils.coding import actual_to_coded, coded_to_actual


def _factor_index(factors: list[Factor], name: str) -> int:
    for i, f in enumerate(factors):
        if f.name == name:
            return i
    raise ValueError(f"Unknown factor: {name}")


def _project_design_points(
    coded_obs: np.ndarray,
    response_obs: np.ndarray,
    factors: list[Factor],
    x_idx: int,
    y_idx: int,
    held_coded: np.ndarray,
    slice_tol: float = 0.4,
    point_types: Optional[list[str]] = None,
) -> list[dict]:
    """Project the actual design rows onto the (x, y) plane.

    Includes a `distance` field = max coded distance of all OTHER coords from the held-constant slice.
    Frontend can fade points by distance.
    """
    out: list[dict] = []
    n_factors = len(factors)
    other_idx = [i for i in range(n_factors) if i != x_idx and i != y_idx]
    for row_idx, row in enumerate(coded_obs):
        if other_idx:
            dists = np.abs(row[other_idx] - held_coded[other_idx])
            distance = float(dists.max()) if dists.size else 0.0
        else:
            distance = 0.0
        # Always include the point but tag its distance — frontend fades far points.
        x_actual = (
            row[x_idx] * (factors[x_idx].high - factors[x_idx].low) / 2
            + (factors[x_idx].high + factors[x_idx].low) / 2
        )
        y_actual = (
            row[y_idx] * (factors[y_idx].high - factors[y_idx].low) / 2
            + (factors[y_idx].high + factors[y_idx].low) / 2
        )
        out.append({
            "x": float(x_actual),
            "y": float(y_actual),
            "z": float(response_obs[row_idx]),
            "distance": distance,
            "in_slice": bool(distance <= slice_tol),
            "point_type": point_types[row_idx] if point_types else "factorial",
            "run": row_idx + 1,
        })
    return out


def predict_grid(
    factors: list[Factor],
    coded_matrix: list[list[float]],
    response: list[Optional[float]],
    selected_terms: list[str],
    x_factor: str,
    y_factor: Optional[str],
    held_constant: dict[str, float],
    grid_size: int = 30,
    held_constant_units: str = "actual",
) -> PredictionGridResponse:
    """Build a prediction grid.

    held_constant_units: 'actual' (default) or 'coded'. Frontend slider state is
    coded; legacy callers pass actual.
    """
    coded = np.array(coded_matrix, dtype=float)
    coded_obs, y, mask = _filter_observed(coded, response)
    codes = factor_codes(factors)
    X = build_design_matrix(coded_obs, selected_terms, codes)
    fit = _ols_fit(X, y)
    beta = fit["beta"]

    n_factors = len(factors)
    x_idx = _factor_index(factors, x_factor)

    obs_min = coded_obs.min(axis=0)
    obs_max = coded_obs.max(axis=0)
    x_grid_coded = np.linspace(obs_min[x_idx], obs_max[x_idx], grid_size)

    # Build held-constant coded vector
    held_coded = np.zeros(n_factors)
    for i, f in enumerate(factors):
        if f.name in held_constant:
            v = held_constant[f.name]
            if held_constant_units == "actual":
                center = (f.high + f.low) / 2.0
                half = (f.high - f.low) / 2.0
                held_coded[i] = (v - center) / half if half else 0.0
            else:
                held_coded[i] = v
        else:
            held_coded[i] = 0.0

    if y_factor:
        y_idx = _factor_index(factors, y_factor)
        y_grid_coded = np.linspace(obs_min[y_idx], obs_max[y_idx], grid_size)

        z = np.zeros((grid_size, grid_size))
        z_se = np.zeros((grid_size, grid_size))
        for i, xv in enumerate(x_grid_coded):
            for j, yv in enumerate(y_grid_coded):
                row = held_coded.copy()
                row[x_idx] = xv
                row[y_idx] = yv
                Xrow = build_design_matrix(row.reshape(1, -1), selected_terms, codes)
                pred = float(Xrow @ beta)
                z[j, i] = pred  # rows=y, cols=x for plotly contour convention
                var = float(Xrow @ fit["XtX_inv"] @ Xrow.T) * fit["mse"]
                z_se[j, i] = float(np.sqrt(max(var, 0)))

        x_actual_grid = (
            x_grid_coded * (factors[x_idx].high - factors[x_idx].low) / 2
            + (factors[x_idx].high + factors[x_idx].low) / 2
        )
        y_actual_grid = (
            y_grid_coded * (factors[y_idx].high - factors[y_idx].low) / 2
            + (factors[y_idx].high + factors[y_idx].low) / 2
        )

        design_points = _project_design_points(
            coded_obs, y, factors, x_idx, y_idx, held_coded
        )

        # Predicted value at the current held-constant point
        held_x_coded = held_coded[x_idx]
        held_y_coded = held_coded[y_idx]
        cur_row = held_coded.copy()
        Xcur = build_design_matrix(cur_row.reshape(1, -1), selected_terms, codes)
        cur_pred = float(Xcur @ beta)
        cur_se = float(np.sqrt(max(float(Xcur @ fit["XtX_inv"] @ Xcur.T) * fit["mse"], 0)))
        cur_x = held_x_coded * (factors[x_idx].high - factors[x_idx].low) / 2 + (factors[x_idx].high + factors[x_idx].low) / 2
        cur_y = held_y_coded * (factors[y_idx].high - factors[y_idx].low) / 2 + (factors[y_idx].high + factors[y_idx].low) / 2
        current = {
            "x": float(cur_x),
            "y": float(cur_y),
            "z": cur_pred,
            "se": cur_se,
        }

        return PredictionGridResponse(
            x_values=x_actual_grid.tolist(),
            y_values=y_actual_grid.tolist(),
            z_values=z.tolist(),
            z_se=z_se.tolist(),
            design_points=design_points,
            current_point=current,
        )

    # Perturbation: vary one factor at a time, others held constant
    perturbation: dict[str, dict[str, list[float]]] = {}
    for i, f in enumerate(factors):
        grid_coded = np.linspace(obs_min[i], obs_max[i], grid_size)
        preds = []
        for v in grid_coded:
            row = held_coded.copy()
            row[i] = v
            Xrow = build_design_matrix(row.reshape(1, -1), selected_terms, codes)
            preds.append(float(Xrow @ beta))
        perturbation[f.name] = {
            "x": grid_coded.tolist(),
            "y": preds,
        }

    return PredictionGridResponse(
        x_values=[],
        perturbation=perturbation,
    )

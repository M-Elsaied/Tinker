"""Point prediction with CI / PI / TI intervals."""
from __future__ import annotations

from typing import Optional

import numpy as np
from scipy import stats

from app.models.schemas import Factor
from app.services.analysis_engine import _filter_observed, _ols_fit, _safe
from app.services.terms import build_design_matrix, factor_codes
from app.utils.coding import actual_to_coded


def predict_point(
    factors: list[Factor],
    coded_matrix: list[list[float]],
    response: list[Optional[float]],
    selected_terms: list[str],
    point: dict[str, float],
    point_units: str = "actual",
    alpha: float = 0.05,
    tolerance_p: float = 0.99,
    tolerance_conf: float = 0.95,
) -> dict:
    """Return predicted mean + CI / PI / TI."""
    coded = np.array(coded_matrix, dtype=float)
    coded_obs, y, _ = _filter_observed(coded, response)
    codes = factor_codes(factors)
    X = build_design_matrix(coded_obs, selected_terms, codes)
    fit = _ols_fit(X, y)

    # Build the point in coded units
    n_factors = len(factors)
    if point_units == "actual":
        pt_actual = np.array([point.get(f.name, (f.high + f.low) / 2) for f in factors])
        pt_coded = actual_to_coded(pt_actual.reshape(1, -1), factors).flatten()
    else:
        pt_coded = np.array([point.get(f.name, 0.0) for f in factors])

    Xp = build_design_matrix(pt_coded.reshape(1, -1), selected_terms, codes)
    yhat = float(Xp @ fit["beta"])
    var_mean = float(Xp @ fit["XtX_inv"] @ Xp.T) * fit["mse"]
    se_mean = float(np.sqrt(max(var_mean, 0)))
    se_pred = float(np.sqrt(max(var_mean + fit["mse"], 0)))

    df = fit["df_resid"]
    t_crit = float(stats.t.ppf(1 - alpha / 2.0, df))
    ci_low = yhat - t_crit * se_mean
    ci_high = yhat + t_crit * se_mean
    pi_low = yhat - t_crit * se_pred
    pi_high = yhat + t_crit * se_pred

    # Tolerance interval (Howe 1969 approximation):
    # k = sqrt( (n-1) * (1 + 1/n) * z²(γ) / chi²(1-α, n-1) )
    # We'll use Wald / Howe combined: k ≈ z_p * sqrt(df * (1 + 1/n) / chi2(1-conf, df))
    n = float(len(y))
    z_p = float(stats.norm.ppf(0.5 + tolerance_p / 2.0))
    chi2 = float(stats.chi2.ppf(1 - tolerance_conf, df) if df > 0 else 1.0)
    k = float(np.sqrt(max(df * (1.0 + 1.0 / n) / max(chi2, 1e-9), 0))) * z_p
    ti_low = yhat - k * float(np.sqrt(fit["mse"]))
    ti_high = yhat + k * float(np.sqrt(fit["mse"]))

    return {
        "predicted": _safe(yhat) or 0.0,
        "std_error": _safe(se_mean) or 0.0,
        "std_error_pred": _safe(se_pred) or 0.0,
        "ci_low": _safe(ci_low),
        "ci_high": _safe(ci_high),
        "pi_low": _safe(pi_low),
        "pi_high": _safe(pi_high),
        "ti_low": _safe(ti_low),
        "ti_high": _safe(ti_high),
        "df_residual": int(df),
    }


def profiler_curve(
    factors: list[Factor],
    coded_matrix: list[list[float]],
    response: list[Optional[float]],
    selected_terms: list[str],
    current_point: dict[str, float],
    varying_factor: str,
    n_points: int = 50,
    point_units: str = "coded",
    alpha: float = 0.05,
) -> dict:
    """Compute response trace with CI band as one factor varies."""
    coded = np.array(coded_matrix, dtype=float)
    coded_obs, y, _ = _filter_observed(coded, response)
    codes = factor_codes(factors)
    X = build_design_matrix(coded_obs, selected_terms, codes)
    fit = _ols_fit(X, y)

    f_idx = next(i for i, f in enumerate(factors) if f.name == varying_factor)
    f = factors[f_idx]
    obs_min = coded_obs.min(axis=0)[f_idx]
    obs_max = coded_obs.max(axis=0)[f_idx]
    grid_coded = np.linspace(obs_min, obs_max, n_points)
    grid_actual = grid_coded * (f.high - f.low) / 2 + (f.high + f.low) / 2

    # held-constant (coded)
    held = np.zeros(len(factors))
    for i, ff in enumerate(factors):
        v = current_point.get(ff.name, 0.0)
        if point_units == "actual":
            center = (ff.high + ff.low) / 2.0
            half = (ff.high - ff.low) / 2.0
            held[i] = (v - center) / half if half else 0.0
        else:
            held[i] = v

    df = fit["df_resid"]
    t_crit = float(stats.t.ppf(1 - alpha / 2.0, df))

    ys, ci_lo, ci_hi = [], [], []
    for v in grid_coded:
        row = held.copy()
        row[f_idx] = v
        Xrow = build_design_matrix(row.reshape(1, -1), selected_terms, codes)
        pred = float(Xrow @ fit["beta"])
        var_mean = float(Xrow @ fit["XtX_inv"] @ Xrow.T) * fit["mse"]
        se = float(np.sqrt(max(var_mean, 0)))
        ys.append(pred)
        ci_lo.append(pred - t_crit * se)
        ci_hi.append(pred + t_crit * se)

    return {
        "x": grid_actual.tolist(),
        "x_coded": grid_coded.tolist(),
        "y": [_safe(v) or 0.0 for v in ys],
        "ci_low": [_safe(v) or 0.0 for v in ci_lo],
        "ci_high": [_safe(v) or 0.0 for v in ci_hi],
    }


def cube_predictions(
    factors: list[Factor],
    coded_matrix: list[list[float]],
    response: list[Optional[float]],
    selected_terms: list[str],
    factor_names: list[str],
    coded_low: float = -1.0,
    coded_high: float = 1.0,
    held_constant: Optional[dict[str, float]] = None,
    held_constant_units: str = "coded",
) -> dict:
    """Predict response at the 8 corners of the (coded_low, coded_high)³ cube."""
    if len(factor_names) != 3:
        raise ValueError("Cube requires exactly 3 factors.")
    coded = np.array(coded_matrix, dtype=float)
    coded_obs, y, _ = _filter_observed(coded, response)
    codes = factor_codes(factors)
    X = build_design_matrix(coded_obs, selected_terms, codes)
    fit = _ols_fit(X, y)

    n = len(factors)
    indices = [next(i for i, f in enumerate(factors) if f.name == n_) for n_ in factor_names]
    held = np.zeros(n)
    if held_constant:
        for i, ff in enumerate(factors):
            v = held_constant.get(ff.name, 0.0)
            if held_constant_units == "actual":
                center = (ff.high + ff.low) / 2.0
                half = (ff.high - ff.low) / 2.0
                held[i] = (v - center) / half if half else 0.0
            else:
                held[i] = v

    corners = []
    for sx in (coded_low, coded_high):
        for sy in (coded_low, coded_high):
            for sz in (coded_low, coded_high):
                row = held.copy()
                row[indices[0]] = sx
                row[indices[1]] = sy
                row[indices[2]] = sz
                Xrow = build_design_matrix(row.reshape(1, -1), selected_terms, codes)
                pred = float(Xrow @ fit["beta"])
                # Convert to actual for display
                actual_x = []
                for k, idx in enumerate(indices):
                    f = factors[idx]
                    coded_val = (sx, sy, sz)[k]
                    actual_x.append(coded_val * (f.high - f.low) / 2 + (f.high + f.low) / 2)
                corners.append({
                    "coded": [sx, sy, sz],
                    "actual": actual_x,
                    "predicted": _safe(pred) or 0.0,
                })
    return {"factors": factor_names, "corners": corners}

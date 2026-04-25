"""Residual diagnostics: fitted, residuals, leverage, Cook's distance, normal probability."""
from __future__ import annotations

from typing import Optional

import numpy as np
from scipy import stats

from app.models.schemas import DiagnosticsResponse, Factor
from app.services.analysis_engine import _filter_observed, _ols_fit, _safe
from app.services.terms import build_design_matrix, factor_codes


def compute_diagnostics(
    factors: list[Factor],
    coded_matrix: list[list[float]],
    response: list[Optional[float]],
    selected_terms: list[str],
) -> DiagnosticsResponse:
    coded = np.array(coded_matrix, dtype=float)
    coded_obs, y, mask = _filter_observed(coded, response)
    codes = factor_codes(factors)
    X = build_design_matrix(coded_obs, selected_terms, codes)
    fit = _ols_fit(X, y)

    fitted = fit["fitted"]
    residuals = fit["residuals"]
    H = X @ fit["XtX_inv"] @ X.T
    leverage = np.clip(np.diag(H), 0, 1.0)
    mse = fit["mse"]
    p = fit["p"]

    denom = np.sqrt(np.maximum(mse * (1 - leverage), 1e-12))
    studentized = residuals / denom

    # Externally studentized (deleted residuals)
    n = fit["n"]
    df_resid = fit["df_resid"]
    ext_stud = np.zeros_like(studentized)
    for i in range(n):
        if df_resid - 1 <= 0:
            ext_stud[i] = float("nan")
            continue
        s_sq_i = ((df_resid) * mse - residuals[i] ** 2 / max(1 - leverage[i], 1e-12)) / max(
            df_resid - 1, 1
        )
        s_sq_i = max(s_sq_i, 1e-12)
        ext_stud[i] = residuals[i] / np.sqrt(s_sq_i * max(1 - leverage[i], 1e-12))

    cooks = (studentized**2 / p) * (leverage / np.maximum(1 - leverage, 1e-12))
    dffits = ext_stud * np.sqrt(np.maximum(leverage / np.maximum(1 - leverage, 1e-12), 0))

    # Normal probability of internally studentized residuals
    sorted_res = np.sort(studentized)
    ranks = np.arange(1, n + 1)
    # Blom's plotting positions
    p_pos = (ranks - 3 / 8) / (n + 1 / 4)
    theoretical = stats.norm.ppf(p_pos)

    # Map back to run order — the indices preserved are positions in mask.
    run_order = list(np.where(mask)[0] + 1)

    shapiro_stat = None
    shapiro_p = None
    if 3 <= n <= 5000:
        try:
            sw = stats.shapiro(residuals)
            shapiro_stat = float(sw.statistic)
            shapiro_p = float(sw.pvalue)
        except Exception:
            pass

    def san(arr):
        return [_safe(v) if _safe(v) is not None else 0.0 for v in arr]

    return DiagnosticsResponse(
        fitted=san(fitted),
        residuals=san(residuals),
        studentized=san(studentized),
        externally_studentized=san(ext_stud),
        leverage=san(leverage),
        cooks_distance=san(cooks),
        dffits=san(dffits),
        run_order=run_order,
        normal_theoretical=san(theoretical),
        normal_ordered=san(sorted_res),
        shapiro_stat=_safe(shapiro_stat),
        shapiro_p=_safe(shapiro_p),
    )

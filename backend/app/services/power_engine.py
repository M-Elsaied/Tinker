"""Power analysis using statsmodels."""
from __future__ import annotations

import numpy as np
from statsmodels.stats.power import FTestPower

from app.models.enums import ModelOrder
from app.models.schemas import Factor
from app.services.analysis_engine import _safe
from app.services.terms import build_design_matrix, enumerate_terms, factor_codes


def power_analysis(
    factors: list[Factor],
    coded_matrix: list[list[float]],
    signal_to_noise: float = 2.0,
    alpha: float = 0.05,
    model_order: ModelOrder = ModelOrder.LINEAR,
) -> dict:
    """Per-term power for a given S/N ratio.

    Computes the noncentrality parameter for each term using the Fisher information
    diagonal element, then derives F-test power from `statsmodels.stats.power.FTestPower`.
    """
    coded = np.array(coded_matrix, dtype=float)
    n = coded.shape[0]
    terms = enumerate_terms(len(factors), model_order)
    codes = factor_codes(factors)
    X = build_design_matrix(coded, terms, codes)
    p = X.shape[1]
    df_resid = n - p
    if df_resid <= 0:
        return {"per_term": [], "df_residual": df_resid, "warning": "No residual df."}

    XtX = X.T @ X
    XtX_inv = np.linalg.pinv(XtX)

    # signal_to_noise is the ratio (effect / sigma) we want to detect
    # for each term, NCP = (signal_to_noise)^2 / Var(coef) where Var(coef) = (X'X)^-1[i,i]
    fp = FTestPower()
    out = []
    for j, term in enumerate(terms, start=1):
        var_coef = float(XtX_inv[j, j])
        # Effect size for F-test (Cohen): f^2 = (signal_to_noise)^2 / 4 * (1 / var_coef)
        # We compute power directly via noncentral F: NCP = ss_term / sigma² = (delta²) / var_coef
        # where delta = signal_to_noise * sigma → NCP = signal_to_noise² / var_coef
        ncp = (signal_to_noise ** 2) / max(var_coef, 1e-9)
        # Cohen's f² = NCP / df_resid (approximation for single df numerator)
        cohen_f2 = ncp / max(df_resid, 1)
        try:
            power = float(fp.solve_power(effect_size=np.sqrt(cohen_f2), df_num=1, df_denom=df_resid, alpha=alpha))
        except Exception:
            power = float("nan")
        out.append({"term": term, "power": _safe(power) or 0.0, "var_coef": _safe(var_coef) or 0.0})
    return {"per_term": out, "df_residual": int(df_resid), "n_runs": int(n), "n_terms": int(p)}

"""Lenth (1989) effects analysis for unreplicated factorials.

For 2-level factorial designs, effect = 2 * coefficient (in coded units).
Lenth's PSE provides a robust significance threshold without replication.

Reference: Lenth, R.V. (1989). Quick and easy analysis of unreplicated factorials.
Technometrics, 31(4), 469-473.
"""
from __future__ import annotations

from typing import Optional

import numpy as np
from scipy import stats

from app.models.enums import ModelOrder
from app.models.schemas import Factor
from app.services.analysis_engine import _filter_observed, _ols_fit, _safe
from app.services.terms import build_design_matrix, enumerate_terms, factor_codes


def lenth_pse(effects: np.ndarray) -> float:
    """Lenth's pseudo standard error.

    s0 = 1.5 * median(|effects|)
    PSE = 1.5 * median(|effects[i]| : |effects[i]| < 2.5*s0)
    """
    abs_e = np.abs(effects)
    s0 = 1.5 * float(np.median(abs_e))
    trimmed = abs_e[abs_e < 2.5 * s0]
    if trimmed.size == 0:
        return s0
    return 1.5 * float(np.median(trimmed))


def lenth_critical(m: int, alpha: float = 0.05, gamma: float = 0.95) -> tuple[float, float]:
    """Return (t_ME, t_SME) multipliers (without PSE).

    Lenth's tail-area approximation:
        df = m / 3
        t_ME = t.ppf(1 - alpha/2, df)
        t_SME = t.ppf((1 + gamma**(1/m)) / 2, df)
    where m = number of effects being tested.
    """
    df = max(m / 3.0, 1.0)
    t_me = float(stats.t.ppf(1 - alpha / 2.0, df))
    t_sme = float(stats.t.ppf((1.0 + gamma ** (1.0 / m)) / 2.0, df))
    return t_me, t_sme


def compute_effects(
    factors: list[Factor],
    coded_matrix: list[list[float]],
    response: list[Optional[float]],
    model_order: ModelOrder = ModelOrder.TWO_FACTOR_INTERACTION,
    alpha: float = 0.05,
    gamma: float = 0.95,
) -> dict:
    """Compute effects for a saturated factorial fit + Lenth thresholds.

    Returns a dict matching EffectsResponse schema.
    """
    coded = np.array(coded_matrix, dtype=float)
    coded_obs, y, _ = _filter_observed(coded, response)

    terms = enumerate_terms(len(factors), model_order)
    if not terms:
        raise ValueError("No model terms — pick at least Linear order.")
    codes = factor_codes(factors)
    X = build_design_matrix(coded_obs, terms, codes)

    if X.shape[0] < X.shape[1]:
        # Saturated: use direct formula effect = 2 * (X'y / n) for orthogonal coded designs.
        # Fall back to least-squares pseudo-inverse for ill-conditioned cases.
        try:
            beta_full = np.linalg.lstsq(X, y, rcond=None)[0]
        except Exception:
            beta_full = np.linalg.pinv(X) @ y
    else:
        fit = _ols_fit(X, y)
        beta_full = fit["beta"]

    # Effects = 2 * coefficient (skip intercept, index 0)
    coefs = beta_full[1:]
    effects = 2.0 * coefs

    # Sum of squares per effect (orthogonal design): SS_i = (effect_i)^2 * n / 4
    n = float(X.shape[0])
    ss = (effects ** 2) * n / 4.0
    ss_total = ss.sum()
    pct = (ss / ss_total * 100.0) if ss_total > 0 else np.zeros_like(ss)

    pse = lenth_pse(effects)
    m = effects.size
    t_me_mult, t_sme_mult = lenth_critical(m, alpha=alpha, gamma=gamma)
    t_me = t_me_mult * pse
    t_sme = t_sme_mult * pse

    suggested_terms = [terms[i] for i in range(m) if abs(effects[i]) > t_me]

    return {
        "terms": terms,
        "effects": [_safe(e) or 0.0 for e in effects.tolist()],
        "abs_effects": [_safe(abs(e)) or 0.0 for e in effects.tolist()],
        "sum_sq": [_safe(s) or 0.0 for s in ss.tolist()],
        "pct_contribution": [_safe(p) or 0.0 for p in pct.tolist()],
        "pse": _safe(pse) or 0.0,
        "t_me": _safe(t_me) or 0.0,
        "t_sme": _safe(t_sme) or 0.0,
        "suggested_terms": suggested_terms,
    }

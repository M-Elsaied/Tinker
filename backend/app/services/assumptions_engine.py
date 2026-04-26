"""Per-factor assumption checks: distribution, variance homogeneity, normality.

Operates on the *raw response grouped by factor level*, complementing the
residual-based diagnostics in diagnostics_engine.py. Useful when there are
multiple replicates per factor level.
"""
from __future__ import annotations

import math
from typing import Optional

import numpy as np
from scipy import stats

from app.models.schemas import (
    AssumptionsResponse,
    Factor,
    FactorAssumptions,
    FactorLevelStats,
)


def _safe(value: float) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return float(value)


def _decode(coded: float, f: Factor) -> float:
    half = (f.high - f.low) / 2.0
    center = (f.high + f.low) / 2.0
    return center + coded * half


def _level_stats(coded_level: float, f: Factor, values: np.ndarray) -> FactorLevelStats:
    n = int(values.size)
    if n == 0:
        return FactorLevelStats(
            coded_level=coded_level,
            actual_level=_decode(coded_level, f),
            n=0, mean=0.0, median=0.0, std=0.0, q1=0.0, q3=0.0,
            min=0.0, max=0.0, values=[],
            shapiro_skipped_reason="No observations at this level",
        )

    q1, median, q3 = np.percentile(values, [25, 50, 75])
    mean = float(values.mean())
    std = float(values.std(ddof=1)) if n > 1 else 0.0

    # Shapiro–Wilk requires 3 ≤ n ≤ 5000
    sw_stat: Optional[float] = None
    sw_p: Optional[float] = None
    sw_reason: Optional[str] = None
    if n < 3:
        sw_reason = f"n={n}, need ≥ 3 for Shapiro–Wilk"
    elif np.allclose(values, values[0]):
        sw_reason = "All values identical (no variation to test)"
    else:
        try:
            res = stats.shapiro(values)
            sw_stat = _safe(float(res.statistic))
            sw_p = _safe(float(res.pvalue))
        except Exception as e:
            sw_reason = f"Shapiro–Wilk failed: {e}"

    return FactorLevelStats(
        coded_level=float(coded_level),
        actual_level=_decode(coded_level, f),
        n=n,
        mean=_safe(mean) or 0.0,
        median=_safe(float(median)) or 0.0,
        std=_safe(std) or 0.0,
        q1=_safe(float(q1)) or 0.0,
        q3=_safe(float(q3)) or 0.0,
        min=_safe(float(values.min())) or 0.0,
        max=_safe(float(values.max())) or 0.0,
        values=[float(v) for v in values],
        shapiro_stat=sw_stat,
        shapiro_p=sw_p,
        shapiro_skipped_reason=sw_reason,
    )


def _per_factor(coded_obs: np.ndarray, y: np.ndarray, factor_idx: int, f: Factor) -> FactorAssumptions:
    col = coded_obs[:, factor_idx]
    # Round to 4 dp to bin near-coded values together (handles -1.0000001 etc.)
    rounded = np.round(col, 4)
    unique_levels = sorted(np.unique(rounded).tolist())

    level_groups: list[np.ndarray] = []
    levels_out: list[FactorLevelStats] = []
    for lvl in unique_levels:
        mask = rounded == lvl
        vals = y[mask]
        level_groups.append(vals)
        levels_out.append(_level_stats(lvl, f, vals))

    # Variance homogeneity tests across levels
    levene_stat: Optional[float] = None
    levene_p: Optional[float] = None
    bartlett_stat: Optional[float] = None
    bartlett_p: Optional[float] = None
    skip: Optional[str] = None

    if len(level_groups) < 2:
        skip = "Only 1 level observed — cannot compare variances across levels"
    elif any(g.size < 2 for g in level_groups):
        skip = "At least one level has < 2 observations"
    else:
        try:
            lev = stats.levene(*level_groups, center="median")
            levene_stat = _safe(float(lev.statistic))
            levene_p = _safe(float(lev.pvalue))
        except Exception as e:
            skip = f"Levene's test failed: {e}"
        try:
            bart = stats.bartlett(*level_groups)
            bartlett_stat = _safe(float(bart.statistic))
            bartlett_p = _safe(float(bart.pvalue))
        except Exception:
            pass  # Bartlett is optional; Levene is the more robust default

    return FactorAssumptions(
        factor_name=f.name,
        units=f.units,
        levels=levels_out,
        levene_stat=levene_stat,
        levene_p=levene_p,
        bartlett_stat=bartlett_stat,
        bartlett_p=bartlett_p,
        homogeneity_skipped_reason=skip,
    )


def compute_assumptions(
    factors: list[Factor],
    coded_matrix: list[list[float]],
    response: list[Optional[float]],
    response_name: str = "Response",
) -> AssumptionsResponse:
    coded = np.array(coded_matrix, dtype=float)
    y_full = np.array([np.nan if v is None else float(v) for v in response], dtype=float)
    mask = ~np.isnan(y_full)
    coded_obs = coded[mask]
    y = y_full[mask]

    # Overall normality on the response itself (not residuals — that's in
    # diagnostics_engine). Useful as a starting point before fitting any model.
    overall_sw_stat: Optional[float] = None
    overall_sw_p: Optional[float] = None
    if y.size >= 3 and not np.allclose(y, y[0]):
        try:
            res = stats.shapiro(y)
            overall_sw_stat = _safe(float(res.statistic))
            overall_sw_p = _safe(float(res.pvalue))
        except Exception:
            pass

    per_factor: list[FactorAssumptions] = []
    for i, f in enumerate(factors):
        per_factor.append(_per_factor(coded_obs, y, i, f))

    return AssumptionsResponse(
        response_name=response_name,
        n_observations=int(y.size),
        overall_shapiro_stat=overall_sw_stat,
        overall_shapiro_p=overall_sw_p,
        factors=per_factor,
    )

"""ANOVA, regression, lack-of-fit, model selection."""
from __future__ import annotations

from math import comb
from typing import Optional

import numpy as np
from scipy import stats


def _safe(v) -> Optional[float]:
    """Convert NaN/Inf to None for JSON safety."""
    if v is None:
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    if np.isnan(f) or np.isinf(f):
        return None
    return f

from app.models.enums import ModelOrder
from app.models.schemas import (
    AnalysisResponse,
    AnovaTermRow,
    CoefficientRow,
    Factor,
    FitSummaryResponse,
    FitSummaryRow,
)
from app.services.terms import (
    build_design_matrix,
    column_names,
    enumerate_terms,
    factor_codes,
)
from app.utils.coding import factor_centers_halfranges


def _filter_observed(
    coded: np.ndarray, response: list[Optional[float]]
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Drop rows where the response is None/NaN. Returns coded, y, original_index_mask."""
    y_full = np.array(
        [np.nan if v is None else float(v) for v in response], dtype=float
    )
    mask = ~np.isnan(y_full)
    return coded[mask], y_full[mask], mask


def _ols_fit(X: np.ndarray, y: np.ndarray) -> dict:
    """Plain OLS via least squares. Returns coefficients, fitted, residuals, etc."""
    n, p = X.shape
    if n <= p:
        raise ValueError(
            f"Insufficient observations ({n}) for {p} model parameters. "
            "Reduce model order or add runs."
        )
    # Solve via QR
    XtX = X.T @ X
    XtX_inv = np.linalg.pinv(XtX)
    beta = XtX_inv @ (X.T @ y)
    fitted = X @ beta
    residuals = y - fitted
    df_resid = n - p
    sse = float(residuals @ residuals)
    mse = sse / df_resid if df_resid > 0 else float("nan")
    cov = XtX_inv * mse
    se = np.sqrt(np.maximum(np.diag(cov), 0))
    return {
        "n": n,
        "p": p,
        "beta": beta,
        "fitted": fitted,
        "residuals": residuals,
        "df_resid": df_resid,
        "sse": sse,
        "mse": mse,
        "cov": cov,
        "se": se,
        "XtX_inv": XtX_inv,
    }


def _replicate_groups(coded: np.ndarray) -> dict[tuple, list[int]]:
    """Group rows by identical coded factor values (for pure error)."""
    groups: dict[tuple, list[int]] = {}
    for i, row in enumerate(coded):
        key = tuple(np.round(row, 8))
        groups.setdefault(key, []).append(i)
    return groups


def _pure_error(coded: np.ndarray, y: np.ndarray) -> tuple[float, int]:
    """Compute pure error sum of squares and df from replicate groups."""
    groups = _replicate_groups(coded)
    sse_pe = 0.0
    df_pe = 0
    for _, idxs in groups.items():
        if len(idxs) > 1:
            vals = y[idxs]
            sse_pe += float(((vals - vals.mean()) ** 2).sum())
            df_pe += len(idxs) - 1
    return sse_pe, df_pe


def _press_statistic(X: np.ndarray, y: np.ndarray, fit: dict) -> Optional[float]:
    """Predicted Residual Sum of Squares via leverage formula."""
    H = X @ fit["XtX_inv"] @ X.T
    h = np.clip(np.diag(H), 0, 0.9999999)
    e = fit["residuals"]
    denom = 1 - h
    if np.any(denom == 0):
        return None
    return float(np.sum((e / denom) ** 2))


def _adeq_precision(X: np.ndarray, fit: dict) -> Optional[float]:
    """Adequate precision = max - min predicted divided by avg std error of prediction.

    Uses the design points themselves (Design-Expert convention).
    """
    if fit["mse"] != fit["mse"]:  # NaN
        return None
    H = X @ fit["XtX_inv"] @ X.T
    var_pred = np.maximum(np.diag(H) * fit["mse"], 0)
    se_pred = np.sqrt(var_pred)
    avg_se = float(se_pred.mean())
    if avg_se == 0:
        return None
    pred_range = float(fit["fitted"].max() - fit["fitted"].min())
    return pred_range / avg_se


def _vif(X: np.ndarray) -> np.ndarray:
    """Variance inflation factors per column (skip intercept = column 0)."""
    p = X.shape[1]
    vifs = np.full(p, np.nan)
    for j in range(1, p):
        Xj = X[:, j]
        others = np.delete(X, j, axis=1)
        try:
            beta_j = np.linalg.pinv(others.T @ others) @ (others.T @ Xj)
            res = Xj - others @ beta_j
            ss_res = float(res @ res)
            ss_tot = float(((Xj - Xj.mean()) ** 2).sum())
            r2 = 1 - ss_res / ss_tot if ss_tot > 0 else 0
            vifs[j] = 1 / (1 - r2) if r2 < 0.999999 else float("inf")
        except np.linalg.LinAlgError:
            vifs[j] = float("inf")
    return vifs


def _term_anova(
    X_full: np.ndarray, y: np.ndarray, terms: list[str], fit_full: dict
) -> list[tuple[str, float, int, float, float]]:
    """Type III-style sum of squares: drop each term and compare SSE."""
    n = X_full.shape[0]
    p_full = X_full.shape[1]
    sse_full = fit_full["sse"]
    df_resid_full = fit_full["df_resid"]
    mse_full = fit_full["mse"]

    rows = []
    for j, term in enumerate(terms, start=1):  # skip intercept (col 0)
        X_reduced = np.delete(X_full, j, axis=1)
        try:
            beta_r = np.linalg.pinv(X_reduced.T @ X_reduced) @ (X_reduced.T @ y)
            res_r = y - X_reduced @ beta_r
            sse_r = float(res_r @ res_r)
        except np.linalg.LinAlgError:
            sse_r = float("nan")
        ss_term = sse_r - sse_full
        ms_term = ss_term  # df=1 for each individual coefficient term
        f_val = ms_term / mse_full if mse_full > 0 else float("nan")
        p_val = 1 - stats.f.cdf(f_val, 1, df_resid_full) if df_resid_full > 0 else float("nan")
        rows.append((term, ss_term, 1, ms_term, f_val, p_val))
    return rows


def _build_equation_coded(terms: list[str], beta: np.ndarray, response_name: str) -> str:
    parts = [f"{beta[0]:.6g}"]
    for j, term in enumerate(terms, start=1):
        coef = beta[j]
        sign = " + " if coef >= 0 else " - "
        parts.append(f"{sign}{abs(coef):.6g} * {term}")
    return f"{response_name} = " + "".join(parts)


def _convert_coefs_to_actual(
    beta: np.ndarray, terms: list[str], factors: list[Factor]
) -> np.ndarray:
    """Convert coded-units coefficients to actual-units coefficients.

    For coded x_c = (x - center)/half_range, expand each term's product back into
    polynomial of actuals. Implementation: build symbolic-like expansion via numpy
    by sampling — accurate by construction since the model is polynomial. We use
    a substitution approach with integer powers.
    """
    # Strategy: build a matrix mapping coded term values to actual-units monomials.
    # Easier: since each term is a product, expand binomials directly.
    centers, half_ranges = factor_centers_halfranges(factors)
    code_idx = {chr(ord("A") + i): i for i in range(len(factors))}

    # Build a dictionary: actual monomial (tuple of powers per factor) -> coefficient.
    actual_coefs: dict[tuple, float] = {}
    n_factors = len(factors)

    def add(monomial: tuple, value: float):
        actual_coefs[monomial] = actual_coefs.get(monomial, 0.0) + value

    # Intercept
    add(tuple([0] * n_factors), float(beta[0]))

    for j, term in enumerate(terms, start=1):
        coef_coded = float(beta[j])
        # Parse into list of (factor_idx, power)
        pieces = term.split("*")
        factor_powers: dict[int, int] = {}
        for piece in pieces:
            if "^" in piece:
                code, power = piece.split("^")
                factor_powers[code_idx[code]] = factor_powers.get(code_idx[code], 0) + int(power)
            else:
                factor_powers[code_idx[piece]] = factor_powers.get(code_idx[piece], 0) + 1

        # Each factor f appears with power p; contributes ((x - c)/r)^p when expanded.
        # Expand each binomial via choose, then convolve.
        # Start expansion as {(0,...,0): coef_coded}
        expansion: dict[tuple, float] = {tuple([0] * n_factors): coef_coded}
        for f_idx, power in factor_powers.items():
            c = centers[f_idx]
            r = half_ranges[f_idx]
            # ((x - c)/r)^p = sum_{k=0..p} C(p,k) * x^k * (-c)^(p-k) / r^p
            new_expansion: dict[tuple, float] = {}
            for monomial, val in expansion.items():
                for k in range(power + 1):
                    binom = float(comb(power, k))
                    contrib = val * binom * ((-c) ** (power - k)) / (r**power)
                    new_mono = list(monomial)
                    new_mono[f_idx] += k
                    key = tuple(new_mono)
                    new_expansion[key] = new_expansion.get(key, 0.0) + contrib
            expansion = new_expansion

        for mono, val in expansion.items():
            add(mono, val)

    # Now produce a coefficient array in the same term ordering as coded.
    # Build a name->coefficient mapping.
    actual_named: dict[str, float] = {}
    intercept_val = actual_coefs.get(tuple([0] * n_factors), 0.0)
    actual_named["Intercept"] = intercept_val

    for term in terms:
        # Compute the monomial powers for this term (treating actual the same form)
        pieces = term.split("*")
        powers = [0] * n_factors
        for piece in pieces:
            if "^" in piece:
                code, p = piece.split("^")
                powers[code_idx[code]] += int(p)
            else:
                powers[code_idx[piece]] += 1
        actual_named[term] = actual_coefs.get(tuple(powers), 0.0)

    out = np.zeros(len(terms) + 1)
    out[0] = actual_named["Intercept"]
    for j, term in enumerate(terms, start=1):
        out[j] = actual_named[term]
    return out


def _build_equation_actual(terms: list[str], beta_actual: np.ndarray, factors: list[Factor], response_name: str) -> str:
    code_to_name = {chr(ord("A") + i): factors[i].name for i in range(len(factors))}
    parts = [f"{beta_actual[0]:.6g}"]
    for j, term in enumerate(terms, start=1):
        coef = beta_actual[j]
        if coef == 0:
            continue
        sign = " + " if coef >= 0 else " - "
        # Replace single-letter codes in term with actual factor names
        translated = term
        for code, name in code_to_name.items():
            translated = translated.replace(code, f"[{name}]")
        parts.append(f"{sign}{abs(coef):.6g} * {translated}")
    return f"{response_name} = " + "".join(parts)


def _resolve_terms(
    n_factors: int, model_order: ModelOrder, selected_terms: Optional[list[str]]
) -> list[str]:
    if selected_terms is not None and len(selected_terms) > 0:
        return list(selected_terms)
    return enumerate_terms(n_factors, model_order)


def run_analysis(
    factors: list[Factor],
    coded_matrix: list[list[float]],
    response: list[Optional[float]],
    response_name: str,
    model_order: ModelOrder,
    selected_terms: Optional[list[str]],
    alpha: float,
) -> AnalysisResponse:
    coded = np.array(coded_matrix, dtype=float)
    coded_obs, y, _ = _filter_observed(coded, response)
    if y.size < 2:
        raise ValueError("Need at least 2 observations to fit a model")

    terms = _resolve_terms(len(factors), model_order, selected_terms)
    codes = factor_codes(factors)
    X = build_design_matrix(coded_obs, terms, codes)
    fit = _ols_fit(X, y)

    # Total SS (corrected)
    n = fit["n"]
    p = fit["p"]
    y_mean = float(y.mean())
    sst = float(((y - y_mean) ** 2).sum())
    ss_model = sst - fit["sse"]
    df_model = p - 1
    ms_model = ss_model / df_model if df_model > 0 else float("nan")

    # Pure error / lack of fit
    sse_pe, df_pe = _pure_error(coded_obs, y)
    sse_lof = fit["sse"] - sse_pe
    df_lof = fit["df_resid"] - df_pe

    anova: list[AnovaTermRow] = []

    f_model = ms_model / fit["mse"] if fit["mse"] > 0 else float("nan")
    p_model = (
        float(1 - stats.f.cdf(f_model, df_model, fit["df_resid"]))
        if df_model > 0 and fit["df_resid"] > 0
        else None
    )
    anova.append(
        AnovaTermRow(
            source="Model",
            sum_sq=_safe(ss_model) or 0.0,
            df=df_model,
            mean_sq=_safe(ms_model),
            f_value=_safe(f_model),
            p_value=_safe(p_model),
        )
    )

    # Per-term ANOVA
    term_rows = _term_anova(X, y, terms, fit)
    for term, ss_t, df_t, ms_t, f_t, p_t in term_rows:
        anova.append(
            AnovaTermRow(
                source=term,
                sum_sq=_safe(ss_t) or 0.0,
                df=df_t,
                mean_sq=_safe(ms_t),
                f_value=_safe(f_t),
                p_value=_safe(p_t),
            )
        )

    # Residual
    anova.append(
        AnovaTermRow(
            source="Residual",
            sum_sq=_safe(fit["sse"]) or 0.0,
            df=fit["df_resid"],
            mean_sq=_safe(fit["mse"]),
        )
    )

    if df_pe > 0 and df_lof > 0 and sse_pe > 0:
        ms_lof = sse_lof / df_lof
        ms_pe = sse_pe / df_pe
        f_lof = ms_lof / ms_pe if ms_pe > 0 else float("nan")
        p_lof = float(1 - stats.f.cdf(f_lof, df_lof, df_pe)) if not np.isnan(f_lof) else None
        anova.append(
            AnovaTermRow(
                source="Lack of Fit",
                sum_sq=_safe(sse_lof) or 0.0,
                df=df_lof,
                mean_sq=_safe(ms_lof),
                f_value=_safe(f_lof),
                p_value=_safe(p_lof),
            )
        )
        anova.append(
            AnovaTermRow(
                source="Pure Error",
                sum_sq=_safe(sse_pe) or 0.0,
                df=df_pe,
                mean_sq=_safe(ms_pe),
            )
        )

    anova.append(AnovaTermRow(source="Cor Total", sum_sq=_safe(sst) or 0.0, df=n - 1, mean_sq=None))

    # Coefficients (coded)
    vifs = _vif(X)
    t_crit = stats.t.ppf(1 - alpha / 2, fit["df_resid"]) if fit["df_resid"] > 0 else float("nan")

    coefficients_coded: list[CoefficientRow] = []
    for j, name in enumerate(["Intercept", *terms]):
        est = float(fit["beta"][j])
        se = float(fit["se"][j])
        t_val = est / se if se > 0 else None
        p_val = float(2 * (1 - stats.t.cdf(abs(t_val), fit["df_resid"]))) if t_val is not None else None
        ci_low = est - t_crit * se if not np.isnan(t_crit) else None
        ci_high = est + t_crit * se if not np.isnan(t_crit) else None
        coefficients_coded.append(
            CoefficientRow(
                term=name,
                estimate=_safe(est) or 0.0,
                std_error=_safe(se) or 0.0,
                t_value=_safe(t_val),
                p_value=_safe(p_val),
                vif=None if j == 0 else _safe(vifs[j]),
                ci_low=_safe(ci_low),
                ci_high=_safe(ci_high),
            )
        )

    # Coefficients (actual units)
    beta_actual = _convert_coefs_to_actual(fit["beta"], terms, factors)
    coefficients_actual: list[CoefficientRow] = [
        CoefficientRow(
            term=name,
            estimate=_safe(beta_actual[j]) or 0.0,
            std_error=0.0,
        )
        for j, name in enumerate(["Intercept", *terms])
    ]

    # Summary stats
    r_sq = 1 - fit["sse"] / sst if sst > 0 else 0.0
    adj_r_sq = 1 - (fit["sse"] / fit["df_resid"]) / (sst / (n - 1)) if sst > 0 and fit["df_resid"] > 0 else 0.0
    press = _press_statistic(X, y, fit)
    pred_r_sq = 1 - press / sst if press is not None and sst > 0 else None
    adeq = _adeq_precision(X, fit)

    std_dev = float(np.sqrt(fit["mse"])) if fit["mse"] > 0 else 0.0
    cv = (std_dev / abs(y_mean)) * 100 if y_mean != 0 else float("nan")

    eq_coded = _build_equation_coded(terms, fit["beta"], response_name)
    eq_actual = _build_equation_actual(terms, beta_actual, factors, response_name)

    return AnalysisResponse(
        terms=terms,
        anova=anova,
        coefficients_coded=coefficients_coded,
        coefficients_actual=coefficients_actual,
        r_squared=_safe(r_sq) or 0.0,
        adj_r_squared=_safe(adj_r_sq) or 0.0,
        pred_r_squared=_safe(pred_r_sq),
        adeq_precision=_safe(adeq),
        std_dev=_safe(std_dev) or 0.0,
        mean=_safe(y_mean) or 0.0,
        cv_percent=_safe(cv) or 0.0,
        press=_safe(press),
        n_obs=int(n),
        df_residual=int(fit["df_resid"]),
        equation_coded=eq_coded,
        equation_actual=eq_actual,
    )


def fit_summary(
    factors: list[Factor],
    coded_matrix: list[list[float]],
    response: list[Optional[float]],
) -> FitSummaryResponse:
    coded = np.array(coded_matrix, dtype=float)
    coded_obs, y, _ = _filter_observed(coded, response)
    n = y.size
    n_factors = len(factors)
    codes = factor_codes(factors)
    sst = float(((y - y.mean()) ** 2).sum())

    sse_pe, df_pe = _pure_error(coded_obs, y)

    rows: list[FitSummaryRow] = []
    prev_sse: Optional[float] = sst
    prev_df: Optional[int] = n - 1

    candidates = [
        ModelOrder.LINEAR,
        ModelOrder.TWO_FACTOR_INTERACTION,
        ModelOrder.QUADRATIC,
    ]
    if n_factors >= 3:
        candidates.append(ModelOrder.CUBIC)

    suggested: ModelOrder = ModelOrder.LINEAR
    last_good: Optional[ModelOrder] = None

    for order in candidates:
        terms = enumerate_terms(n_factors, order)
        if len(terms) + 1 > n:
            rows.append(
                FitSummaryRow(
                    model_order=order,
                    sequential_p=None,
                    lack_of_fit_p=None,
                    r_squared=0.0,
                    adj_r_squared=0.0,
                    pred_r_squared=None,
                    aliased=True,
                )
            )
            continue
        try:
            X = build_design_matrix(coded_obs, terms, codes)
            fit = _ols_fit(X, y)
        except Exception:
            rows.append(
                FitSummaryRow(
                    model_order=order,
                    r_squared=0.0,
                    adj_r_squared=0.0,
                    aliased=True,
                )
            )
            continue

        seq_p: Optional[float] = None
        if prev_sse is not None and prev_df is not None:
            ss_added = prev_sse - fit["sse"]
            df_added = prev_df - fit["df_resid"]
            if df_added > 0 and fit["df_resid"] > 0 and fit["mse"] > 0:
                ms_added = ss_added / df_added
                f_seq = ms_added / fit["mse"]
                seq_p = float(1 - stats.f.cdf(f_seq, df_added, fit["df_resid"]))

        # Lack of fit p-value
        sse_lof = fit["sse"] - sse_pe
        df_lof = fit["df_resid"] - df_pe
        lof_p: Optional[float] = None
        if df_pe > 0 and df_lof > 0 and sse_pe > 0:
            ms_lof = sse_lof / df_lof
            ms_pe = sse_pe / df_pe
            if ms_pe > 0:
                f_lof = ms_lof / ms_pe
                lof_p = float(1 - stats.f.cdf(f_lof, df_lof, df_pe))

        r_sq = 1 - fit["sse"] / sst if sst > 0 else 0.0
        adj_r_sq = (
            1 - (fit["sse"] / fit["df_resid"]) / (sst / (n - 1))
            if sst > 0 and fit["df_resid"] > 0
            else 0.0
        )
        press = _press_statistic(X, y, fit)
        pred_r_sq = 1 - press / sst if press is not None and sst > 0 else None

        # Suggested if seq p < 0.05 and lof p > 0.10 (Design-Expert convention)
        is_suggested = False
        if seq_p is not None and seq_p < 0.05:
            if lof_p is None or lof_p > 0.10:
                is_suggested = True
                last_good = order

        rows.append(
            FitSummaryRow(
                model_order=order,
                sequential_p=_safe(seq_p),
                lack_of_fit_p=_safe(lof_p),
                r_squared=_safe(r_sq) or 0.0,
                adj_r_squared=_safe(adj_r_sq) or 0.0,
                pred_r_squared=_safe(pred_r_sq),
                press=_safe(press),
                suggested=is_suggested,
            )
        )

        prev_sse = fit["sse"]
        prev_df = fit["df_resid"]

    if last_good is not None:
        suggested = last_good

    return FitSummaryResponse(rows=rows, suggested=suggested)

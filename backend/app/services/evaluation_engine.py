"""Design evaluation: VIF, leverage, condition number, FDS."""
from __future__ import annotations

import numpy as np

from app.models.enums import ModelOrder
from app.models.schemas import Factor
from app.services.analysis_engine import _safe, _vif
from app.services.terms import build_design_matrix, enumerate_terms, factor_codes


def evaluate_design(
    factors: list[Factor],
    coded_matrix: list[list[float]],
    model_order: ModelOrder = ModelOrder.QUADRATIC,
    fds_samples: int = 5000,
    seed: int = 42,
) -> dict:
    """Compute leverage, VIF, condition number, and FDS for a design."""
    coded = np.array(coded_matrix, dtype=float)
    n = coded.shape[0]
    terms = enumerate_terms(len(factors), model_order)
    codes = factor_codes(factors)
    X = build_design_matrix(coded, terms, codes)
    p = X.shape[1]

    XtX = X.T @ X
    try:
        XtX_inv = np.linalg.pinv(XtX)
    except np.linalg.LinAlgError:
        XtX_inv = np.linalg.pinv(XtX)

    H = X @ XtX_inv @ X.T
    leverage = np.clip(np.diag(H), 0, 1).tolist()

    # Condition number
    eigvals = np.linalg.eigvalsh(XtX)
    eigvals = eigvals[eigvals > 1e-12]
    cond = float(eigvals.max() / eigvals.min()) if eigvals.size else float("inf")

    # VIFs (for non-intercept terms)
    vifs_arr = _vif(X)
    vifs = {term: _safe(vifs_arr[i + 1]) for i, term in enumerate(terms)}

    # FDS plot: random sample from [-1, 1]^k, compute scaled prediction variance
    rng = np.random.default_rng(seed)
    samples = rng.uniform(-1.0, 1.0, size=(fds_samples, len(factors)))
    Xs = build_design_matrix(samples, terms, codes)
    var = np.einsum("ij,jk,ik->i", Xs, XtX_inv, Xs)
    sd_pred = np.sqrt(np.maximum(var, 0))  # scaled (relative units, σ=1)
    sorted_sd = np.sort(sd_pred)
    fractions = (np.arange(1, fds_samples + 1)) / fds_samples

    return {
        "n_runs": int(n),
        "n_terms": int(p),
        "model_order": model_order.value,
        "condition_number": _safe(cond),
        "max_leverage": _safe(float(max(leverage))),
        "avg_leverage": _safe(float(p / n)),
        "leverage": [_safe(v) or 0.0 for v in leverage],
        "vif": {k: (v if v is not None else 0.0) for k, v in vifs.items()},
        "fds": {
            "fraction": fractions.tolist(),
            "sd_pred": sorted_sd.tolist(),
        },
        "warnings": _build_warnings(leverage, vifs_arr, cond, p, n),
    }


def _build_warnings(leverage: list, vifs: np.ndarray, cond: float, p: int, n: int) -> list[dict]:
    out = []
    if max(leverage) > 0.9:
        out.append({"severity": "warning", "text": f"Maximum leverage = {max(leverage):.3f} is very high (≥ 0.9). Some runs are highly influential."})
    high_vif = [(i, v) for i, v in enumerate(vifs[1:]) if v > 10]
    if high_vif:
        out.append({"severity": "warning", "text": f"{len(high_vif)} terms have VIF > 10 — multicollinearity is present."})
    if cond > 1000:
        out.append({"severity": "warning", "text": f"Condition number = {cond:.0f} (> 1000). The design matrix is ill-conditioned."})
    if n - p < 4:
        out.append({"severity": "warning", "text": f"Only {n - p} residual degrees of freedom — very low for reliable inference."})
    if not out:
        out.append({"severity": "success", "text": "Design quality looks good: leverage < 0.9, condition number < 1000, and VIFs are in range."})
    return out

"""Box-Cox transformation analysis."""
from __future__ import annotations

import numpy as np
from scipy import stats

from app.models.schemas import BoxCoxResponse


def box_cox_analysis(response: list[float]) -> BoxCoxResponse:
    y = np.array(response, dtype=float)
    if np.any(y <= 0):
        # Shift response so all values are positive
        shift = abs(y.min()) + 1.0
        y = y + shift
    lambdas = np.linspace(-3, 3, 121)
    log_likes = []
    for lam in lambdas:
        try:
            ll = stats.boxcox_llf(lam, y)
        except Exception:
            ll = -np.inf
        log_likes.append(float(ll))

    log_likes_arr = np.array(log_likes)
    best_idx = int(np.argmax(log_likes_arr))
    lambda_best = float(lambdas[best_idx])

    # 95% CI: values within chi-square(1) / 2 of max
    threshold = log_likes_arr[best_idx] - stats.chi2.ppf(0.95, 1) / 2
    ci_mask = log_likes_arr >= threshold
    ci_low = float(lambdas[ci_mask][0])
    ci_high = float(lambdas[ci_mask][-1])

    # Recommendation
    if ci_low <= 1 <= ci_high:
        rec = "none"
    elif ci_low <= 0 <= ci_high:
        rec = "ln"
    elif ci_low <= 0.5 <= ci_high:
        rec = "sqrt"
    elif ci_low <= -1 <= ci_high:
        rec = "inverse"
    elif ci_low <= 2 <= ci_high:
        rec = "square"
    else:
        rec = f"{lambda_best:.2f}"

    return BoxCoxResponse(
        lambda_best=lambda_best,
        lambda_ci_low=ci_low,
        lambda_ci_high=ci_high,
        lambda_grid=lambdas.tolist(),
        log_likelihood=log_likes,
        recommendation=rec,
    )

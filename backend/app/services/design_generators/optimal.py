"""D- and I-optimal designs via coordinate exchange (Meyer-Nachtsheim style)."""
from __future__ import annotations

from typing import Literal

import numpy as np

from app.models.enums import ModelOrder
from app.models.schemas import Factor
from app.services.terms import build_design_matrix, enumerate_terms, factor_codes


def _candidate_grid(n_factors: int, levels: int = 5) -> np.ndarray:
    """Cartesian grid of candidate points in [-1, 1]^k at `levels` per dim."""
    grid = np.linspace(-1, 1, levels)
    cols = np.meshgrid(*[grid] * n_factors)
    return np.vstack([c.ravel() for c in cols]).T


def _objective(X: np.ndarray, criterion: Literal["d", "i"]) -> float:
    """Higher = better."""
    XtX = X.T @ X
    try:
        if criterion == "d":
            sign, logdet = np.linalg.slogdet(XtX)
            return float(sign * logdet)
        else:  # i-optimal
            inv = np.linalg.pinv(XtX)
            return -float(np.trace(inv))
    except np.linalg.LinAlgError:
        return -np.inf


def coordinate_exchange(
    factors: list[Factor],
    n_runs: int,
    model_order: ModelOrder = ModelOrder.QUADRATIC,
    criterion: Literal["d", "i"] = "d",
    n_iterations: int = 5,
    seed: int = 42,
) -> tuple[np.ndarray, list[str]]:
    """Generate a D- or I-optimal design via coordinate exchange.

    Strategy: random start, then iteratively replace each row by the candidate
    that maximizes the criterion, repeat for `n_iterations` passes.
    """
    n_factors = len(factors)
    terms = enumerate_terms(n_factors, model_order)
    codes = factor_codes(factors)
    if n_runs <= len(terms):
        n_runs = len(terms) + 2

    candidates = _candidate_grid(n_factors)
    rng = np.random.default_rng(seed)
    best_score = -np.inf
    best_matrix = None
    for restart in range(3):
        # Random start
        idx = rng.choice(len(candidates), size=n_runs, replace=True)
        design = candidates[idx].copy()
        for _ in range(n_iterations):
            improved = False
            for r in range(n_runs):
                cur = design[r].copy()
                base_X = build_design_matrix(design, terms, codes)
                base_score = _objective(base_X, criterion)
                # Try every candidate
                for c in candidates:
                    design[r] = c
                    X = build_design_matrix(design, terms, codes)
                    s = _objective(X, criterion)
                    if s > base_score + 1e-9:
                        base_score = s
                        cur = c.copy()
                        improved = True
                design[r] = cur
            if not improved:
                break
        score = _objective(build_design_matrix(design, terms, codes), criterion)
        if score > best_score:
            best_score = score
            best_matrix = design.copy()

    types = ["factorial"] * n_runs
    return best_matrix, types

"""Derringer-Suich desirability + numerical multi-response optimization."""
from __future__ import annotations

from typing import Optional

import numpy as np
from scipy.optimize import minimize

from app.models.enums import GoalType
from app.models.schemas import (
    Factor,
    OptimizationResponse,
    OptimizationSolution,
    ResponseGoal,
)
from app.services.analysis_engine import _filter_observed, _ols_fit
from app.services.terms import build_design_matrix, factor_codes
from app.utils.coding import coded_to_actual


def desirability(value: float, goal: ResponseGoal) -> float:
    """Compute individual desirability for a single response value."""
    low = goal.lower
    high = goal.upper
    target = goal.target if goal.target is not None else (low + high) / 2
    w = max(goal.weight, 1e-6)

    if goal.goal == GoalType.MINIMIZE:
        if value <= low:
            return 1.0
        if value >= high:
            return 0.0
        return ((high - value) / (high - low)) ** w
    if goal.goal == GoalType.MAXIMIZE:
        if value >= high:
            return 1.0
        if value <= low:
            return 0.0
        return ((value - low) / (high - low)) ** w
    if goal.goal == GoalType.TARGET:
        if value < low or value > high:
            return 0.0
        if value <= target:
            return ((value - low) / (target - low)) ** w if target > low else 1.0
        return ((high - value) / (high - target)) ** w if high > target else 1.0
    if goal.goal == GoalType.IN_RANGE:
        return 1.0 if low <= value <= high else 0.0
    return 1.0  # GoalType.NONE


def composite_desirability(values: dict[str, float], goals: list[ResponseGoal]) -> float:
    weights = []
    ds = []
    for goal in goals:
        if goal.goal == GoalType.NONE:
            continue
        d = desirability(values[goal.name], goal)
        if d <= 0:
            return 0.0
        ds.append(d)
        weights.append(max(goal.importance, 1))
    if not ds:
        return 0.0
    weights_arr = np.array(weights, dtype=float)
    log_d = np.sum(weights_arr * np.log(np.array(ds))) / weights_arr.sum()
    return float(np.exp(log_d))


def graphical_overlay(
    factors: list[Factor],
    coded_matrix: list[list[float]],
    responses: list[dict],
    goals: list[ResponseGoal],
    x_factor: str,
    y_factor: str,
    held_constant: dict[str, float],
    held_constant_units: str = "coded",
    grid_size: int = 50,
) -> dict:
    """Build feasibility masks per response on (x, y) grid.

    Returns x_values (actual), y_values (actual), per-response z grids and feasibility masks,
    and an intersection mask (sweet spot).
    """
    coded = np.array(coded_matrix, dtype=float)
    codes = factor_codes(factors)
    n_factors = len(factors)
    x_idx = next(i for i, f in enumerate(factors) if f.name == x_factor)
    y_idx = next(i for i, f in enumerate(factors) if f.name == y_factor)

    obs_min = coded.min(axis=0)
    obs_max = coded.max(axis=0)
    x_grid = np.linspace(obs_min[x_idx], obs_max[x_idx], grid_size)
    y_grid = np.linspace(obs_min[y_idx], obs_max[y_idx], grid_size)

    # held-constant in coded units
    held = np.zeros(n_factors)
    for i, f in enumerate(factors):
        v = held_constant.get(f.name, 0.0)
        if held_constant_units == "actual":
            center = (f.high + f.low) / 2.0
            half = (f.high - f.low) / 2.0
            held[i] = (v - center) / half if half else 0.0
        else:
            held[i] = v

    masks = {}
    surfaces = {}
    intersection = np.ones((grid_size, grid_size), dtype=bool)
    for resp in responses:
        name = resp["name"]
        goal = next((g for g in goals if g.name == name), None)
        if goal is None or goal.goal == GoalType.NONE:
            continue
        from app.services.analysis_engine import _filter_observed, _ols_fit
        coded_obs, y, _ = _filter_observed(coded, resp["data"])
        X = build_design_matrix(coded_obs, goal.selected_terms, codes)
        fit = _ols_fit(X, y)
        beta = fit["beta"]

        z = np.zeros((grid_size, grid_size))
        for i, xv in enumerate(x_grid):
            for j, yv in enumerate(y_grid):
                row = held.copy()
                row[x_idx] = xv
                row[y_idx] = yv
                Xrow = build_design_matrix(row.reshape(1, -1), goal.selected_terms, codes)
                z[j, i] = float((Xrow @ beta).item())  # rows=y, cols=x

        # Feasibility mask
        if goal.goal == GoalType.MINIMIZE:
            mask = z <= goal.upper
        elif goal.goal == GoalType.MAXIMIZE:
            mask = z >= goal.lower
        elif goal.goal == GoalType.IN_RANGE:
            mask = (z >= goal.lower) & (z <= goal.upper)
        elif goal.goal == GoalType.TARGET:
            mask = (z >= goal.lower) & (z <= goal.upper)
        else:
            mask = np.ones_like(z, dtype=bool)

        intersection &= mask
        masks[name] = mask.tolist()
        surfaces[name] = z.tolist()

    fx = factors[x_idx]
    fy = factors[y_idx]
    x_actual = (x_grid * (fx.high - fx.low) / 2 + (fx.high + fx.low) / 2).tolist()
    y_actual = (y_grid * (fy.high - fy.low) / 2 + (fy.high + fy.low) / 2).tolist()

    return {
        "x_values": x_actual,
        "y_values": y_actual,
        "x_factor": x_factor,
        "y_factor": y_factor,
        "surfaces": surfaces,
        "feasible_masks": masks,
        "sweet_spot_mask": intersection.tolist(),
    }


def optimize(
    factors: list[Factor],
    coded_matrix: list[list[float]],
    responses: list[dict],
    goals: list[ResponseGoal],
    n_starts: int = 25,
    seed: Optional[int] = None,
) -> OptimizationResponse:
    """Find factor settings that maximize composite desirability.

    Each response in `responses` is dict with keys 'name' and 'data'.
    Each goal in `goals` includes the selected_terms for that response's model.
    """
    coded = np.array(coded_matrix, dtype=float)
    codes = factor_codes(factors)

    # Fit a model for each response with its selected terms
    fits: dict[str, dict] = {}
    for resp in responses:
        name = resp["name"]
        goal = next((g for g in goals if g.name == name), None)
        if goal is None:
            continue
        coded_obs, y, _ = _filter_observed(coded, resp["data"])
        X = build_design_matrix(coded_obs, goal.selected_terms, codes)
        fit = _ols_fit(X, y)
        fits[name] = {"fit": fit, "terms": goal.selected_terms}

    n_factors = len(factors)
    bounds = [(-1.0, 1.0)] * n_factors

    def predict(name: str, x: np.ndarray) -> float:
        info = fits[name]
        Xrow = build_design_matrix(x.reshape(1, -1), info["terms"], codes)
        return float((Xrow @ info["fit"]["beta"]).item())

    def neg_composite(x: np.ndarray) -> float:
        vals = {name: predict(name, x) for name in fits}
        d = composite_desirability(vals, goals)
        return -d

    rng = np.random.default_rng(seed)
    starts = rng.uniform(-1, 1, size=(n_starts, n_factors))
    # Always include center as a start
    starts = np.vstack([np.zeros(n_factors), starts])

    solutions: list[OptimizationSolution] = []
    seen_keys = set()

    for x0 in starts:
        try:
            res = minimize(
                neg_composite,
                x0=x0,
                bounds=bounds,
                method="L-BFGS-B",
                options={"maxiter": 200, "ftol": 1e-8},
            )
        except Exception:
            continue
        x_star = np.clip(res.x, -1.0, 1.0)
        d_star = -float(res.fun)
        if d_star <= 0:
            continue

        # Dedup near-identical solutions
        key = tuple(np.round(x_star, 3))
        if key in seen_keys:
            continue
        seen_keys.add(key)

        actual = coded_to_actual(x_star.reshape(1, -1), factors).flatten()
        factor_dict = {factors[i].name: float(actual[i]) for i in range(n_factors)}
        response_dict = {name: predict(name, x_star) for name in fits}
        ind_d = {
            g.name: desirability(response_dict[g.name], g)
            for g in goals
            if g.goal != GoalType.NONE and g.name in response_dict
        }
        solutions.append(
            OptimizationSolution(
                factors=factor_dict,
                responses=response_dict,
                individual_desirabilities=ind_d,
                composite_desirability=d_star,
            )
        )

    solutions.sort(key=lambda s: s.composite_desirability, reverse=True)
    return OptimizationResponse(solutions=solutions[:20])

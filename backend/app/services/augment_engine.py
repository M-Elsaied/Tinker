"""Design augmentation: add axial points, center points, fold-over."""
from __future__ import annotations

import numpy as np

from app.models.schemas import Factor


def augment_axial(coded: np.ndarray, alpha: float | None = None) -> np.ndarray:
    """Append 2k axial (star) points at ±α to convert factorial → CCD."""
    n_factors = coded.shape[1]
    if alpha is None:
        alpha = (2 ** n_factors) ** 0.25  # rotatable
    axial = np.zeros((2 * n_factors, n_factors))
    for i in range(n_factors):
        axial[2 * i, i] = -alpha
        axial[2 * i + 1, i] = alpha
    return np.vstack([coded, axial])


def augment_centers(coded: np.ndarray, n_centers: int) -> np.ndarray:
    """Append n_centers rows of zeros."""
    if n_centers <= 0:
        return coded
    return np.vstack([coded, np.zeros((n_centers, coded.shape[1]))])


def augment_foldover(coded: np.ndarray) -> np.ndarray:
    """Reflect every coordinate to break aliases: sign change of all factors."""
    return np.vstack([coded, -coded])


def augment_replicate(coded: np.ndarray, n_reps: int = 1) -> np.ndarray:
    """Add full replicates of the existing design."""
    if n_reps <= 0:
        return coded
    return np.vstack([coded] + [coded.copy() for _ in range(n_reps)])


def coded_to_actual_rows(coded: np.ndarray, factors: list[Factor]) -> np.ndarray:
    """Convert coded matrix back to actual units."""
    centers = np.array([(f.high + f.low) / 2 for f in factors])
    halves = np.array([(f.high - f.low) / 2 for f in factors])
    return coded * halves + centers

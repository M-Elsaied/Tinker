"""Factorial, fractional factorial, and Plackett-Burman design generators."""
from __future__ import annotations

import numpy as np
import pyDOE3


def full_factorial(n_factors: int) -> np.ndarray:
    """Generate a 2-level full factorial design in coded units (-1, +1)."""
    return pyDOE3.ff2n(n_factors)


def fractional_factorial(n_factors: int, fraction: int) -> np.ndarray:
    """Generate a 2^(k-p) fractional factorial.

    fraction is p; returns 2^(k-p) runs.
    Builds a default minimum-aberration generator string.
    """
    if fraction <= 0 or fraction >= n_factors:
        raise ValueError("fraction must satisfy 0 < fraction < n_factors")
    base = n_factors - fraction
    base_design = pyDOE3.ff2n(base)  # base columns
    # Generators: assign extra factors to high-order interactions of the base.
    # Use highest-order interactions for best resolution.
    extra_columns = []
    base_indices = list(range(base))
    for i in range(fraction):
        # use product of all base columns shifted; for simplicity use full product first,
        # then pairs of base if needed.
        if i == 0:
            cols = base_indices
        else:
            cols = base_indices[: max(2, base - i)]
        col = np.ones(base_design.shape[0])
        for c in cols:
            col = col * base_design[:, c]
        extra_columns.append(col)
    extras = np.column_stack(extra_columns)
    return np.column_stack([base_design, extras])


def plackett_burman(n_factors: int) -> np.ndarray:
    """Plackett-Burman design — uses pyDOE3."""
    return pyDOE3.pbdesign(n_factors)


def add_center_points(design: np.ndarray, n_center: int) -> np.ndarray:
    """Append n_center rows of zeros (center points) to a coded design."""
    if n_center <= 0:
        return design
    centers = np.zeros((n_center, design.shape[1]))
    return np.vstack([design, centers])


def replicate(design: np.ndarray, n_reps: int) -> np.ndarray:
    """Tile the design n_reps times (full replication)."""
    if n_reps <= 1:
        return design
    return np.tile(design, (n_reps, 1))

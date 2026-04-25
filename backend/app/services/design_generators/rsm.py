"""Response Surface Method designs: CCD and Box-Behnken."""
from __future__ import annotations

import numpy as np
import pyDOE3

from app.models.enums import CCDType


def ccd(
    n_factors: int,
    center_points_factorial: int = 0,
    center_points_axial: int = 0,
    ccd_type: CCDType = CCDType.CIRCUMSCRIBED,
    alpha: float | None = None,
) -> tuple[np.ndarray, list[str]]:
    """Central Composite Design.

    Returns (design_matrix, point_types) where point_types is one entry per row:
    'factorial', 'axial', or 'center'.
    """
    factorial = pyDOE3.ff2n(n_factors)
    n_factorial = factorial.shape[0]

    # Determine alpha
    if alpha is None:
        if ccd_type == CCDType.FACE_CENTERED:
            alpha_val = 1.0
        else:
            # Rotatable alpha
            alpha_val = float(n_factorial) ** 0.25
    else:
        alpha_val = float(alpha)

    if ccd_type == CCDType.INSCRIBED:
        # scale factorial inward; axial points sit at +/-1
        factorial = factorial / alpha_val
        ax = 1.0
    else:
        ax = alpha_val

    # Axial points: 2k runs at +/-alpha along each axis
    axial = np.zeros((2 * n_factors, n_factors))
    for i in range(n_factors):
        axial[2 * i, i] = -ax
        axial[2 * i + 1, i] = ax

    cps_f = np.zeros((center_points_factorial, n_factors))
    cps_a = np.zeros((center_points_axial, n_factors))

    matrix = np.vstack([factorial, cps_f, axial, cps_a])
    types = (
        ["factorial"] * factorial.shape[0]
        + ["center"] * cps_f.shape[0]
        + ["axial"] * axial.shape[0]
        + ["center"] * cps_a.shape[0]
    )
    return matrix, types


def box_behnken(n_factors: int, center_points: int = 3) -> tuple[np.ndarray, list[str]]:
    """Box-Behnken design (3+ factors, no axial points)."""
    if n_factors < 3:
        raise ValueError("Box-Behnken requires at least 3 factors")
    matrix = pyDOE3.bbdesign(n_factors, center=center_points)
    # bbdesign returns design with center points already included.
    # Mark center points (rows where all entries are 0).
    types = []
    for row in matrix:
        if np.all(row == 0):
            types.append("center")
        else:
            types.append("factorial")
    return matrix, types

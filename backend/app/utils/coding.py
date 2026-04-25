import numpy as np

from app.models.schemas import Factor


def factor_centers_halfranges(factors: list[Factor]) -> tuple[np.ndarray, np.ndarray]:
    centers = np.array([(f.high + f.low) / 2.0 for f in factors])
    half_ranges = np.array([(f.high - f.low) / 2.0 for f in factors])
    return centers, half_ranges


def coded_to_actual(coded: np.ndarray, factors: list[Factor]) -> np.ndarray:
    centers, half_ranges = factor_centers_halfranges(factors)
    return coded * half_ranges + centers


def actual_to_coded(actual: np.ndarray, factors: list[Factor]) -> np.ndarray:
    centers, half_ranges = factor_centers_halfranges(factors)
    return (actual - centers) / half_ranges

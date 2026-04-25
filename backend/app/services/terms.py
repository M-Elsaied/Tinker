"""Model term enumeration and design-matrix construction."""
from __future__ import annotations

from itertools import combinations

import numpy as np

from app.models.enums import ModelOrder
from app.models.schemas import Factor


def factor_codes(factors: list[Factor]) -> list[str]:
    """Use single-letter codes A, B, C, ... for factors (Design-Expert convention)."""
    return [chr(ord("A") + i) for i in range(len(factors))]


def enumerate_terms(n_factors: int, order: ModelOrder) -> list[str]:
    """Return list of term names for a given model order.

    Term naming: 'A', 'B', 'A*B', 'A^2', etc.
    """
    codes = [chr(ord("A") + i) for i in range(n_factors)]
    terms: list[str] = []

    if order == ModelOrder.MEAN:
        return terms

    # Linear main effects
    terms.extend(codes)

    if order == ModelOrder.LINEAR:
        return terms

    # Two-factor interactions
    for a, b in combinations(range(n_factors), 2):
        terms.append(f"{codes[a]}*{codes[b]}")

    if order == ModelOrder.TWO_FACTOR_INTERACTION:
        return terms

    # Quadratic / pure squares
    if order in (ModelOrder.QUADRATIC, ModelOrder.CUBIC):
        for i in range(n_factors):
            terms.append(f"{codes[i]}^2")

    if order == ModelOrder.QUADRATIC:
        return terms

    # Cubic: add 3-way interactions, A^2*B etc., and pure cubes
    if order == ModelOrder.CUBIC:
        for a, b, c in combinations(range(n_factors), 3):
            terms.append(f"{codes[a]}*{codes[b]}*{codes[c]}")
        for i in range(n_factors):
            for j in range(n_factors):
                if i == j:
                    continue
                terms.append(f"{codes[i]}^2*{codes[j]}")
        for i in range(n_factors):
            terms.append(f"{codes[i]}^3")

    return terms


def build_design_matrix(
    coded: np.ndarray, terms: list[str], factor_codes_list: list[str]
) -> np.ndarray:
    """Build the regression design matrix (X) including the intercept column.

    coded: (n_runs, n_factors) coded factor values
    terms: list of term names like 'A', 'A*B', 'A^2'
    """
    n_runs = coded.shape[0]
    columns = [np.ones(n_runs)]  # intercept
    code_to_idx = {c: i for i, c in enumerate(factor_codes_list)}

    for term in terms:
        col = np.ones(n_runs)
        # Each term is a product of pieces separated by '*'
        pieces = term.split("*")
        for piece in pieces:
            if "^" in piece:
                code, power = piece.split("^")
                col = col * coded[:, code_to_idx[code]] ** int(power)
            else:
                col = col * coded[:, code_to_idx[piece]]
        columns.append(col)

    return np.column_stack(columns)


def column_names(terms: list[str]) -> list[str]:
    return ["Intercept", *terms]

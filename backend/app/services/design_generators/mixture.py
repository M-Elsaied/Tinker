"""Mixture designs (simplex lattice, simplex centroid)."""
from __future__ import annotations

from itertools import combinations, combinations_with_replacement

import numpy as np


def simplex_lattice(n_components: int, degree: int = 2) -> tuple[np.ndarray, list[str]]:
    """{n_components, degree} simplex lattice — uniformly spaced points on the simplex."""
    proportions = list(range(degree + 1))
    rows: list[list[float]] = []
    for combo in combinations_with_replacement(proportions, n_components):
        if sum(combo) == degree:
            rows.append([c / degree for c in combo])
            # Permute? combinations_with_replacement gives sorted; we need all distinct orderings
    # Build all distinct permutations via direct enumeration
    out: set[tuple] = set()
    base = np.array(rows)
    from itertools import permutations
    for r in base:
        for p in permutations(r):
            out.add(p)
    matrix = np.array(sorted(out))
    types = ["vertex" if max(row) == 1.0 else "blend" for row in matrix]
    return matrix, types


def simplex_centroid(n_components: int) -> tuple[np.ndarray, list[str]]:
    """Simplex centroid — vertices + edge midpoints + face centers + ... + overall centroid."""
    rows: list[list[float]] = []
    types: list[str] = []
    indices = list(range(n_components))
    for r in range(1, n_components + 1):
        for combo in combinations(indices, r):
            point = [0.0] * n_components
            for i in combo:
                point[i] = 1.0 / r
            rows.append(point)
            types.append("vertex" if r == 1 else "binary" if r == 2 else f"{r}-blend")
    return np.array(rows), types

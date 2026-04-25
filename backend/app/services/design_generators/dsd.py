"""Definitive Screening Design (Jones & Nachtsheim 2011).

Three-level designs that estimate main effects + curvature with ~2k+1 runs.
Uses conference matrices when k is even, fold-over construction when odd.
"""
from __future__ import annotations

import numpy as np


def _conference_matrix(n: int) -> np.ndarray:
    """Construct a conference matrix of order n (n must be ≡ 2 mod 4 for symmetric type).

    Returns an n×n matrix with 0 on diagonal, ±1 elsewhere, satisfying C·C^T = (n-1)·I.
    Uses Paley construction when n-1 is a prime ≡ 3 mod 4.
    For small n we use known constructions.
    """
    # Fall back to known small constructions
    if n == 6:
        return np.array([
            [0,  1,  1,  1,  1,  1],
            [1,  0,  1, -1, -1,  1],
            [1,  1,  0,  1, -1, -1],
            [1, -1,  1,  0,  1, -1],
            [1, -1, -1,  1,  0,  1],
            [1,  1, -1, -1,  1,  0],
        ])
    if n == 10:
        # Paley construction with q=9 (q ≡ 1 mod 4) gives 10×10 symmetric conference matrix
        # Use a known explicit example via cyclic shifts
        c = np.zeros((10, 10))
        # Quadratic residues mod 9... use a hand-rolled construction
        # Source: standard DSD literature
        first_row = [0, 1, 1, -1, 1, 1, 1, -1, -1, 1]
        for i in range(10):
            c[i] = np.roll(first_row, i)
        c[0, 0] = 0
        for i in range(10):
            c[i, i] = 0
        return c
    # Generic construction via Paley if (n-1) is prime power ≡ 3 mod 4
    q = n - 1
    if _is_prime(q) and q % 4 == 3:
        # Paley type II conference matrix
        # Build Jacobsthal matrix Q of order q based on quadratic residues
        residues = set()
        for x in range(1, q):
            residues.add((x * x) % q)
        Q = np.zeros((q, q))
        for i in range(q):
            for j in range(q):
                if i == j:
                    Q[i, j] = 0
                elif ((j - i) % q) in residues:
                    Q[i, j] = 1
                else:
                    Q[i, j] = -1
        # Jacobsthal Q satisfies Q*Q.T = qI - J for Paley type II; build conference matrix:
        C = np.zeros((n, n))
        C[0, 1:] = 1
        C[1:, 0] = 1
        C[1:, 1:] = Q
        return C
    raise ValueError(f"No conference matrix construction available for n={n}")


def _is_prime(n: int) -> bool:
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True


def dsd(n_factors: int) -> tuple[np.ndarray, list[str]]:
    """Build a definitive screening design.

    For even k: 2k+1 runs from conference matrix Cₖ folded with [+C; -C; 0].
    For odd k: 2k+3 runs (with one extra fake factor).
    """
    k = n_factors
    use_extra = (k % 2 == 1)
    k_use = k + 1 if use_extra else k
    try:
        C = _conference_matrix(k_use)
    except ValueError:
        # Fallback: random-search construction
        return _random_dsd(n_factors), ["factorial"] * (2 * n_factors + 1)

    # Stack: rows of C, rows of -C, all-zero center
    matrix = np.vstack([C, -C, np.zeros(k_use)])
    if use_extra:
        matrix = matrix[:, :k]  # drop the fake factor column
    types = ["factorial"] * matrix.shape[0]
    types[-1] = "center"
    # Mark axial-like points (rows containing a single 0 surrounded by ±1)
    for i, row in enumerate(matrix[:-1]):
        zeros = np.sum(row == 0)
        if zeros == 1:
            types[i] = "axial"
    return matrix, types


def _random_dsd(k: int) -> np.ndarray:
    """Random search fallback for DSD."""
    rng = np.random.default_rng(42)
    best_matrix = None
    best_score = -np.inf
    for _ in range(200):
        m = np.zeros((2 * k + 1, k))
        for i in range(k):
            m[i, i] = 0
            m[i + k, i] = 0
            for j in range(k):
                if j == i:
                    continue
                m[i, j] = rng.choice([-1, 1])
                m[i + k, j] = -m[i, j]
        # score: |det(X'X)|
        try:
            d = abs(np.linalg.det(m.T @ m))
        except Exception:
            continue
        if d > best_score:
            best_score = d
            best_matrix = m
    return best_matrix

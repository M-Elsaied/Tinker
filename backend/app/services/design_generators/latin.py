"""Latin hypercube space-filling design."""
from __future__ import annotations

import numpy as np
import pyDOE3


def latin_hypercube(n_factors: int, n_runs: int, seed: int = 42) -> np.ndarray:
    """LHS in [-1, 1]^k via pyDOE3."""
    rng = np.random.default_rng(seed)
    lhs = pyDOE3.lhs(n_factors, samples=n_runs, criterion="maximin", random_state=rng.integers(0, 2**31))
    # Map [0,1] -> [-1, 1]
    return 2 * lhs - 1

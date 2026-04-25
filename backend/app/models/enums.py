from enum import Enum


class DesignType(str, Enum):
    FULL_FACTORIAL = "full_factorial"
    FRACTIONAL_FACTORIAL = "fractional_factorial"
    PLACKETT_BURMAN = "plackett_burman"
    CCD = "ccd"
    BOX_BEHNKEN = "box_behnken"
    DEFINITIVE_SCREENING = "definitive_screening"
    OPTIMAL_D = "optimal_d"
    OPTIMAL_I = "optimal_i"
    SIMPLEX_LATTICE = "simplex_lattice"
    SIMPLEX_CENTROID = "simplex_centroid"
    LATIN_HYPERCUBE = "latin_hypercube"


class ModelFamily(str, Enum):
    OLS = "ols"
    LOGISTIC = "logistic"
    POISSON = "poisson"


class ModelOrder(str, Enum):
    MEAN = "mean"
    LINEAR = "linear"
    TWO_FACTOR_INTERACTION = "2fi"
    QUADRATIC = "quadratic"
    CUBIC = "cubic"


class GoalType(str, Enum):
    NONE = "none"
    MINIMIZE = "minimize"
    MAXIMIZE = "maximize"
    TARGET = "target"
    IN_RANGE = "in_range"


class CCDType(str, Enum):
    CIRCUMSCRIBED = "circumscribed"
    INSCRIBED = "inscribed"
    FACE_CENTERED = "face_centered"

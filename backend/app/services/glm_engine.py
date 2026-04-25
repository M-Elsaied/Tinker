"""Generalized Linear Models for binary / count responses."""
from __future__ import annotations

from typing import Optional

import numpy as np
import statsmodels.api as sm

from app.models.enums import ModelFamily, ModelOrder
from app.models.schemas import (
    AnalysisResponse, AnovaTermRow, CoefficientRow, Factor,
)
from app.services.analysis_engine import _filter_observed, _safe
from app.services.terms import build_design_matrix, enumerate_terms, factor_codes


def fit_glm(
    factors: list[Factor],
    coded_matrix: list[list[float]],
    response: list[Optional[float]],
    response_name: str,
    family: ModelFamily,
    model_order: ModelOrder,
    selected_terms: Optional[list[str]] = None,
) -> AnalysisResponse:
    coded = np.array(coded_matrix, dtype=float)
    coded_obs, y, _ = _filter_observed(coded, response)

    terms = list(selected_terms) if selected_terms else enumerate_terms(len(factors), model_order)
    codes = factor_codes(factors)
    X = build_design_matrix(coded_obs, terms, codes)

    if family == ModelFamily.LOGISTIC:
        sm_family = sm.families.Binomial()
    elif family == ModelFamily.POISSON:
        sm_family = sm.families.Poisson()
    else:
        raise ValueError(f"Unsupported family: {family}")

    glm = sm.GLM(y, X, family=sm_family).fit()
    coefs = np.asarray(glm.params)
    se = np.asarray(glm.bse)
    z = np.asarray(glm.tvalues)
    p = np.asarray(glm.pvalues)

    coef_rows: list[CoefficientRow] = []
    for j, name in enumerate(["Intercept", *terms]):
        coef_rows.append(CoefficientRow(
            term=name,
            estimate=_safe(float(coefs[j])) or 0.0,
            std_error=_safe(float(se[j])) or 0.0,
            t_value=_safe(float(z[j])),
            p_value=_safe(float(p[j])),
            vif=None, ci_low=None, ci_high=None,
        ))

    deviance = float(glm.deviance)
    null_dev = float(glm.null_deviance)
    pseudo_r2 = 1 - deviance / null_dev if null_dev > 0 else 0.0

    anova: list[AnovaTermRow] = [
        AnovaTermRow(source="Model", sum_sq=null_dev - deviance, df=glm.df_model, mean_sq=None,
                     f_value=None, p_value=None),
    ]
    for j, term in enumerate(terms, start=1):
        anova.append(AnovaTermRow(
            source=term,
            sum_sq=_safe(float(coefs[j] ** 2 / max(se[j] ** 2, 1e-12))) or 0.0,  # Wald score
            df=1,
            mean_sq=None,
            f_value=_safe(float(z[j] ** 2)),
            p_value=_safe(float(p[j])),
        ))
    anova.append(AnovaTermRow(source="Residual deviance", sum_sq=deviance, df=int(glm.df_resid), mean_sq=None))

    eq_coded = f"link({response_name}) = " + " + ".join(
        [f"{coefs[0]:.4g}"] + [f"{coefs[j+1]:.4g} * {t}" for j, t in enumerate(terms)]
    )

    return AnalysisResponse(
        terms=terms,
        anova=anova,
        coefficients_coded=coef_rows,
        coefficients_actual=coef_rows,  # GLM: actual conversion not as meaningful
        r_squared=_safe(pseudo_r2) or 0.0,
        adj_r_squared=_safe(pseudo_r2) or 0.0,
        pred_r_squared=None,
        adeq_precision=None,
        std_dev=_safe(float(np.sqrt(deviance / max(glm.df_resid, 1)))) or 0.0,
        mean=_safe(float(np.mean(y))) or 0.0,
        cv_percent=0.0,
        press=None,
        n_obs=int(len(y)),
        df_residual=int(glm.df_resid),
        equation_coded=eq_coded,
        equation_actual=eq_coded,
    )

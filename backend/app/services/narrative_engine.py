"""Auto-generated interpretation paragraphs in Design-Expert phrasing."""
from __future__ import annotations

from typing import Optional


def _pct(p: float) -> str:
    """Format p-value as percentage e.g. 0.0001 -> '0.01%'."""
    return f"{p * 100:.2f}%"


def _sig_word(p: Optional[float]) -> str:
    if p is None:
        return ""
    if p < 0.0001:
        return "highly significant"
    if p < 0.05:
        return "significant"
    if p < 0.10:
        return "marginally significant"
    return "not significant"


def explain(
    *,
    anova: list[dict],
    r_squared: float,
    adj_r_squared: float,
    pred_r_squared: Optional[float],
    adeq_precision: Optional[float],
    shapiro_p: Optional[float],
    lack_of_fit_p: Optional[float],
    cv_percent: float,
    n_obs: int,
    response_name: str = "Response",
) -> list[dict]:
    """Build a list of interpretation paragraphs.

    Each item is {kind, severity, text} where:
        kind ∈ {model, lof, r2, adeq_precision, normality, cv, summary}
        severity ∈ {info, success, warning, error}
    """
    out: list[dict] = []

    # Find the Model row in ANOVA
    model_row = next((r for r in anova if r.get("source") == "Model"), None)
    if model_row and model_row.get("p_value") is not None and model_row.get("f_value") is not None:
        f = float(model_row["f_value"])
        p = float(model_row["p_value"])
        if p < 0.05:
            text = (
                f"The Model F-value of {f:.2f} implies the model is significant. "
                f"There is only a {_pct(p)} chance that an F-value this large could occur due to noise."
            )
            out.append({"kind": "model", "severity": "success", "text": text})
        else:
            text = (
                f"The Model F-value of {f:.2f} implies the model is {_sig_word(p)} "
                f"(p = {p:.4f}). Consider screening more terms or collecting more data."
            )
            out.append({"kind": "model", "severity": "warning", "text": text})

    # Highlight which terms are significant
    sig_terms = [
        r["source"]
        for r in anova
        if r.get("source") not in {"Model", "Residual", "Lack of Fit", "Pure Error", "Cor Total"}
        and r.get("p_value") is not None
        and r["p_value"] < 0.05
    ]
    if sig_terms:
        joined = ", ".join(sig_terms[:8])
        more = "" if len(sig_terms) <= 8 else f", and {len(sig_terms) - 8} more"
        out.append({
            "kind": "terms",
            "severity": "info",
            "text": f"P-values less than 0.05 indicate significant model terms. In this case {joined}{more} are significant model terms.",
        })

    # Lack of Fit
    if lack_of_fit_p is not None:
        if lack_of_fit_p > 0.10:
            out.append({
                "kind": "lof",
                "severity": "success",
                "text": (
                    f"The Lack of Fit F-test is not significant (p = {lack_of_fit_p:.4f}). "
                    "Non-significant lack of fit is good — it indicates that the chosen model fits the data."
                ),
            })
        elif lack_of_fit_p > 0.05:
            out.append({
                "kind": "lof",
                "severity": "warning",
                "text": (
                    f"The Lack of Fit p-value of {lack_of_fit_p:.4f} is on the borderline. "
                    "Consider examining the residuals plots or fitting a higher-order model."
                ),
            })
        else:
            out.append({
                "kind": "lof",
                "severity": "error",
                "text": (
                    f"The Lack of Fit F-test is significant (p = {lack_of_fit_p:.4f}). "
                    "Significant lack of fit suggests the chosen model is missing important terms — "
                    "try a higher-order model or a response transformation."
                ),
            })

    # R-squared agreement
    if pred_r_squared is not None:
        diff = abs(adj_r_squared - pred_r_squared)
        if diff < 0.20:
            out.append({
                "kind": "r2",
                "severity": "success",
                "text": (
                    f"The Predicted R² of {pred_r_squared:.4f} is in reasonable agreement with the "
                    f"Adjusted R² of {adj_r_squared:.4f}; i.e. the difference is less than 0.20."
                ),
            })
        else:
            out.append({
                "kind": "r2",
                "severity": "warning",
                "text": (
                    f"The Predicted R² of {pred_r_squared:.4f} is not as close to the "
                    f"Adjusted R² of {adj_r_squared:.4f} as one might normally expect; the difference of "
                    f"{diff:.4f} is greater than 0.20. This may indicate a large block effect or a problem "
                    "with the model and/or data — consider model reduction or transformations."
                ),
            })

    # Adequate Precision
    if adeq_precision is not None:
        if adeq_precision >= 4.0:
            out.append({
                "kind": "adeq_precision",
                "severity": "success",
                "text": (
                    f"Adequate Precision measures the signal-to-noise ratio. A ratio greater than 4 is desirable. "
                    f"Your ratio of {adeq_precision:.3f} indicates an adequate signal. This model can be used to "
                    "navigate the design space."
                ),
            })
        else:
            out.append({
                "kind": "adeq_precision",
                "severity": "warning",
                "text": (
                    f"Adequate Precision is {adeq_precision:.3f}, below the desirable threshold of 4. "
                    "The signal is weak relative to the noise — consider collecting more data or reducing the model."
                ),
            })

    # CV
    if cv_percent and cv_percent > 0:
        out.append({
            "kind": "cv",
            "severity": "info",
            "text": (
                f"The coefficient of variation (CV) is {cv_percent:.2f}%, expressing the standard deviation "
                f"as a percentage of the mean of {response_name.lower()}."
            ),
        })

    # Normality
    if shapiro_p is not None:
        if shapiro_p > 0.05:
            out.append({
                "kind": "normality",
                "severity": "success",
                "text": (
                    f"The Shapiro–Wilk test on the residuals (p = {shapiro_p:.4f}) does not reject "
                    "the normality assumption."
                ),
            })
        else:
            out.append({
                "kind": "normality",
                "severity": "warning",
                "text": (
                    f"The Shapiro–Wilk test on the residuals (p = {shapiro_p:.4f}) suggests the "
                    "residuals deviate from normality. Consider a Box–Cox transformation."
                ),
            })

    # Summary line
    out.append({
        "kind": "summary",
        "severity": "info",
        "text": (
            f"Based on {n_obs} observations with R² = {r_squared:.4f} and Adjusted R² = {adj_r_squared:.4f}, "
            "the model captures the dominant trends in the data."
        ),
    })

    return out

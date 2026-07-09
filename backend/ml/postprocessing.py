"""
backend/ml/postprocessing.py
=============================
GET Solar Energy — Prediction Postprocessing
Phase 13.0B (Batch 2)

Responsibilities:
  - prediction formatting
  - confidence formatting
  - response builder
  - explanation formatter

Confidence policy:
  If a model cannot produce confidence values, confidence is returned as
  ``null``. We never fabricate confidence scores.
"""

from typing import Optional, Dict, Any


def format_prediction(value: Optional[float], units: str = "INR") -> Optional[str]:
    """Human-readable, currency-formatted prediction string."""
    if value is None:
        return None
    if units == "INR" or units == "INR/month":
        return f"\u20b9{value:,.2f}"
    return f"{value:,.2f} {units}"


def format_confidence(confidence: Optional[float]) -> Optional[float]:
    """
    Return a confidence value only when one is genuinely available.

    The RandomForest regressors used by this platform do not emit a
    calibrated confidence for regression outputs, so this always returns
    ``None``. The contract is explicit: never fabricate confidence.
    """
    if confidence is None:
        return None
    return None


def format_explanation(
    model: str,
    features_used: Optional[Dict[str, Any]],
    prediction: Optional[float],
    units: str = "INR",
) -> Optional[str]:
    """Build a neutral, factual explanation string (no fabricated metrics)."""
    if prediction is None or features_used is None:
        return None

    if model == "bill_model":
        text = (
            f"Estimated electricity bill is \u20b9{prediction:,.2f} based on "
            f"{features_used.get('monthly_units')} monthly units at "
            f"\u20b9{features_used.get('per_unit_rate')}/unit for billing period "
            f"index {features_used.get('month_num')}."
        )
    elif model == "savings_model":
        text = (
            f"Estimated monthly solar savings is \u20b9{prediction:,.2f} based on "
            f"{features_used.get('monthly_units')} monthly units at "
            f"\u20b9{features_used.get('per_unit_rate')}/unit (80% offset assumption)."
        )
    else:
        text = f"Prediction: {format_prediction(prediction, units)}."

    return text


def build_response(
    success: bool,
    model: str,
    version: str,
    task: str,
    prediction: Optional[float],
    latency_ms: float,
    features_used: Optional[Dict[str, Any]],
    units: str,
    error: Optional[str] = None,
) -> Dict[str, Any]:
    """Assemble the standardized inference response envelope."""
    return {
        "success": success,
        "model": model,
        "version": version,
        "task": task,
        "prediction": round(prediction, 2) if (success and prediction is not None) else None,
        "prediction_formatted": format_prediction(prediction, units) if (success and prediction is not None) else None,
        "confidence": format_confidence(None),
        "units": units,
        "latency_ms": round(latency_ms, 3),
        "features_used": features_used,
        "explanation": format_explanation(model, features_used, prediction, units) if success else None,
        "error": error,
    }

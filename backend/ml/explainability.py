"""
backend/ml/explainability.py
=============================
GET Solar Energy — Prediction Explainability Engine
Phase 13.0C

Generates human-readable explanations for ML predictions. Model-agnostic
by design: works with any prediction output without touching model internals.

Each explanation includes:
  - Prediction and confidence
  - Contributing factors
  - Business interpretation
  - Recommended next action
  - Risk indicators

Future SHAP/LIME integration is supported by the Factor dataclass pattern.
"""

from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field

from utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class Factor:
    name: str
    value: Any
    impact: str  # "positive", "negative", "neutral"
    weight: float  # 0.0 - 1.0 relative importance
    description: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "value": self.value,
            "impact": self.impact,
            "weight": self.weight,
            "description": self.description,
        }


@dataclass
class RiskIndicator:
    severity: str  # "high", "medium", "low"
    category: str
    message: str
    mitigation: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "severity": self.severity,
            "category": self.category,
            "message": self.message,
            "mitigation": self.mitigation,
        }


@dataclass
class Explanation:
    prediction_type: str
    prediction_value: Any
    prediction_formatted: str
    confidence: Optional[float]
    confidence_label: str
    contributing_factors: List[Factor]
    business_interpretation: str
    recommended_action: str
    risk_indicators: List[RiskIndicator]
    metadata: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "prediction_type": self.prediction_type,
            "prediction_value": self.prediction_value,
            "prediction_formatted": self.prediction_formatted,
            "confidence": self.confidence,
            "confidence_label": self.confidence_label,
            "contributing_factors": [f.to_dict() for f in self.contributing_factors],
            "business_interpretation": self.business_interpretation,
            "recommended_action": self.recommended_action,
            "risk_indicators": [r.to_dict() for r in self.risk_indicators],
            "metadata": self.metadata or {},
        }


class ExplainabilityEngine:
    """Model-agnostic explanation generator for solar predictions."""

    _instance: Optional["ExplainabilityEngine"] = None

    def __new__(cls) -> "ExplainabilityEngine":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._initialized = True

    def explain_prediction(
        self,
        model_name: str,
        prediction: Optional[float],
        features_used: Optional[Dict[str, Any]],
        success: bool = True,
        error: Optional[str] = None,
    ) -> Explanation:
        """
        Generate a structured explanation for an ML prediction.

        Args:
            model_name:     Model that produced the prediction.
            prediction:     Raw prediction value (may be None on failure).
            features_used:  Input features fed to the model.
            success:        Whether the prediction succeeded.
            error:          Error message if prediction failed.

        Returns:
            :class:`Explanation` with factors, interpretation, and risks.
        """
        if not success or prediction is None:
            return self._failure_explanation(model_name, error)

        if model_name == "bill_model":
            return self._explain_bill(prediction, features_used or {})
        elif model_name == "savings_model":
            return self._explain_savings(prediction, features_used or {})
        else:
            return self._explain_generic(model_name, prediction, features_used or {})

    def _confidence_label(self, value: Optional[float]) -> str:
        if value is None:
            return "N/A"
        if value >= 0.85:
            return "High"
        if value >= 0.65:
            return "Medium"
        return "Low"

    # ── Bill Prediction Explanation ──────────────────────────────────────

    def _explain_bill(self, prediction: float, features: Dict[str, Any]) -> Explanation:
        monthly_units = features.get("monthly_units", 0)
        per_unit_rate = features.get("per_unit_rate", 7.0)
        month_num = features.get("month_num", 0)

        factors = [
            Factor(
                name="Monthly Consumption",
                value=f"{monthly_units:.0f} kWh",
                impact="positive" if monthly_units > 300 else "neutral",
                weight=0.40,
                description=f"Monthly consumption of {monthly_units:.0f} kWh is the primary cost driver.",
            ),
            Factor(
                name="Per-Unit Rate",
                value=f"₹{per_unit_rate:.2f}",
                impact="positive" if per_unit_rate > 7.0 else "neutral",
                weight=0.30,
                description=f"Electricity rate of ₹{per_unit_rate:.2f}/unit {'is above average' if per_unit_rate > 7.0 else 'is within normal range'}.",
            ),
            Factor(
                name="Billing Period",
                value=f"Month {month_num}",
                impact="neutral",
                weight=0.15,
                description=f"Seasonal billing period index {month_num} affects consumption patterns.",
            ),
        ]

        # Check for extreme values
        risks = []
        if monthly_units > 600:
            risks.append(RiskIndicator(
                severity="high",
                category="consumption",
                message=f"Very high consumption ({monthly_units:.0f} kWh) indicates possible commercial use.",
                mitigation="Verify customer type; commercial tariffs may differ.",
            ))
        elif monthly_units > 400:
            risks.append(RiskIndicator(
                severity="medium",
                category="consumption",
                message=f"Above-average consumption ({monthly_units:.0f} kWh).",
                mitigation="Confirm billing data accuracy.",
            ))

        if per_unit_rate > 10:
            risks.append(RiskIndicator(
                severity="medium",
                category="rate",
                message=f"Per-unit rate ₹{per_unit_rate:.2f} is unusually high.",
                mitigation="Verify DISCOM tariff slab; may include fixed charges.",
            ))

        interpretation = (
            f"Estimated electricity bill is ₹{prediction:,.2f} for {monthly_units:.0f} kWh "
            f"at ₹{per_unit_rate:.2f}/unit. "
            f"{'This is a high bill, indicating strong solar ROI potential.' if prediction > 5000 else 'Solar system can offset a significant portion.'}"
        )

        action = (
            "Recommend immediate solar consultation" if prediction > 8000
            else "Share solar proposal for review" if prediction > 4000
            else "Monitor consumption pattern"
        )

        return Explanation(
            prediction_type="bill",
            prediction_value=round(prediction, 2),
            prediction_formatted=f"₹{prediction:,.2f}",
            confidence=None,
            confidence_label="N/A",
            contributing_factors=factors,
            business_interpretation=interpretation,
            recommended_action=action,
            risk_indicators=risks,
            metadata={"model": "bill_model", "features": features},
        )

    # ── Savings Prediction Explanation ───────────────────────────────────

    def _explain_savings(self, prediction: float, features: Dict[str, Any]) -> Explanation:
        monthly_units = features.get("monthly_units", 0)
        per_unit_rate = features.get("per_unit_rate", 7.0)
        bill_estimate = monthly_units * per_unit_rate

        savings_pct = (prediction / bill_estimate * 100) if bill_estimate > 0 else 0

        factors = [
            Factor(
                name="Monthly Consumption",
                value=f"{monthly_units:.0f} kWh",
                impact="positive",
                weight=0.35,
                description=f"Higher consumption ({monthly_units:.0f} kWh) directly increases solar savings.",
            ),
            Factor(
                name="Per-Unit Rate",
                value=f"₹{per_unit_rate:.2f}",
                impact="positive" if per_unit_rate > 7 else "neutral",
                weight=0.30,
                description=f"Rate of ₹{per_unit_rate:.2f}/unit {'amplifies savings' if per_unit_rate > 7 else 'contributes moderately'}.",
            ),
            Factor(
                name="Solar Offset (80%)",
                value="80%",
                impact="positive",
                weight=0.25,
                description="System designed to offset 80% of monthly consumption.",
            ),
        ]

        risks = []
        if savings_pct > 90:
            risks.append(RiskIndicator(
                severity="medium",
                category="savings",
                message="Savings estimate exceeds 90% of current bill — verify assumptions.",
                mitigation="Confirm per-unit rate and consumption data accuracy.",
            ))

        monthly_bill = monthly_units * per_unit_rate
        payback_hint = None
        if monthly_bill > 0:
            net_cost = max(0, round(monthly_units / 135.0, 1) * 55000 - 78000)
            if prediction > 0:
                payback_hint = round(net_cost / (prediction * 12), 1)

        interpretation = (
            f"Estimated monthly solar savings: ₹{prediction:,.2f} "
            f"(~{savings_pct:.0f}% of current ₹{monthly_bill:,.0f} bill). "
            f"{'Excellent ROI potential.' if savings_pct > 70 else 'Moderate savings; consider system optimization.'}"
        )

        action = (
            "Prioritize this lead — high savings potential" if savings_pct > 70
            else "Review system sizing for better ROI"
        )

        return Explanation(
            prediction_type="savings",
            prediction_value=round(prediction, 2),
            prediction_formatted=f"₹{prediction:,.2f}/month",
            confidence=None,
            confidence_label="N/A",
            contributing_factors=factors,
            business_interpretation=interpretation,
            recommended_action=action,
            risk_indicators=risks,
            metadata={"model": "savings_model", "features": features, "payback_hint": payback_hint},
        )

    # ── Generic Explanation ──────────────────────────────────────────────

    def _explain_generic(self, model_name: str, prediction: float, features: Dict[str, Any]) -> Explanation:
        return Explanation(
            prediction_type=model_name,
            prediction_value=round(prediction, 2),
            prediction_formatted=f"{prediction:,.2f}",
            confidence=None,
            confidence_label="N/A",
            contributing_factors=[],
            business_interpretation=f"Prediction from {model_name}: {prediction:,.2f}.",
            recommended_action="Review prediction in context of customer data.",
            risk_indicators=[],
            metadata={"model": model_name, "features": features},
        )

    # ── Failure Explanation ──────────────────────────────────────────────

    def _failure_explanation(self, model_name: str, error: Optional[str]) -> Explanation:
        return Explanation(
            prediction_type=model_name,
            prediction_value=None,
            prediction_formatted="N/A",
            confidence=None,
            confidence_label="N/A",
            contributing_factors=[],
            business_interpretation=f"Prediction failed: {error or 'Unknown error'}.",
            recommended_action="Verify input data and retry prediction.",
            risk_indicators=[RiskIndicator(
                severity="high",
                category="system",
                message=f"Prediction failed for {model_name}: {error}",
                mitigation="Check input validation and model availability.",
            )],
            metadata={"model": model_name, "error": error},
        )


def get_explainability_engine() -> ExplainabilityEngine:
    """Return singleton explainability engine."""
    return ExplainabilityEngine()

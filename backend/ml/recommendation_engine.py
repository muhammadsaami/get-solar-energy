"""
backend/ml/recommendation_engine.py
====================================
GET Solar Energy — Business Recommendation Engine
Phase 13.0C

Consumes prediction outputs and CRM data to produce actionable
business recommendations. Rules are modular and model-agnostic.

No ML inference occurs here — this is a pure business-rule layer.
"""

from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field

from utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class Recommendation:
    category: str
    title: str
    description: str
    priority: str  # "high", "medium", "low"
    confidence: float  # 0.0 - 1.0
    action: str
    metadata: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "category": self.category,
            "title": self.title,
            "description": self.description,
            "priority": self.priority,
            "confidence": self.confidence,
            "action": self.action,
            "metadata": self.metadata or {},
        }


class RecommendationEngine:
    """Business recommendation layer consuming prediction and CRM data."""

    _instance: Optional["RecommendationEngine"] = None

    def __new__(cls) -> "RecommendationEngine":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._initialized = True

    def generate_recommendations(
        self,
        customer_data: Dict[str, Any],
        predictions: Dict[str, Any],
        crm_context: Optional[Dict[str, Any]] = None,
    ) -> List[Recommendation]:
        """
        Generate all business recommendations from available data.

        Args:
            customer_data:  Bill and profile data (monthly_units, city, etc.)
            predictions:    ML inference outputs (bill, savings).
            crm_context:    Optional CRM enrichment (360 view, scores).

        Returns:
            Ordered list of :class:`Recommendation` objects.
        """
        recommendations: List[Recommendation] = []
        crm_context = crm_context or {}

        try:
            recommendations.extend(self._solar_size_recommendation(customer_data, predictions))
            recommendations.extend(self._battery_recommendation(customer_data, predictions))
            recommendations.extend(self._roof_inspection_recommendation(customer_data, crm_context))
            recommendations.extend(self._subsidy_recommendation(customer_data, predictions))
            recommendations.extend(self._financing_recommendation(customer_data, predictions))
            recommendations.extend(self._high_value_customer(customer_data, predictions, crm_context))
            recommendations.extend(self._followup_priority(customer_data, crm_context))
            recommendations.extend(self._upsell_opportunity(customer_data, predictions, crm_context))
            recommendations.extend(self._amc_recommendation(customer_data, crm_context))
        except Exception as exc:
            logger.error("Recommendation generation failed", extra={"error": str(exc)}, exc_info=True)

        # Sort by priority then confidence descending
        priority_order = {"high": 0, "medium": 1, "low": 2}
        recommendations.sort(key=lambda r: (priority_order.get(r.priority, 2), -r.confidence))
        return recommendations

    # ── Solar Size Recommendation ────────────────────────────────────────

    def _solar_size_recommendation(
        self, customer: Dict[str, Any], predictions: Dict[str, Any]
    ) -> List[Recommendation]:
        monthly_units = customer.get("monthly_units", 0)
        if monthly_units <= 0:
            return []

        recommended_kw = round(monthly_units / 135.0, 1)
        saving_pred = predictions.get("savings", {})
        predicted_savings = saving_pred.get("prediction", 0) or 0

        recs = []
        recs.append(Recommendation(
            category="solar_sizing",
            title=f"Recommended System: {recommended_kw} kW",
            description=(
                f"Based on {monthly_units:.0f} kWh monthly consumption, "
                f"a {recommended_kw} kW solar system is recommended. "
                f"Estimated monthly savings: ₹{predicted_savings:,.0f}."
            ),
            priority="high",
            confidence=0.85,
            action="Generate proposal with recommended system size",
            metadata={
                "recommended_kw": recommended_kw,
                "monthly_units": monthly_units,
                "estimated_savings": predicted_savings,
            },
        ))
        return recs

    # ── Battery Recommendation ───────────────────────────────────────────

    def _battery_recommendation(
        self, customer: Dict[str, Any], predictions: Dict[str, Any]
    ) -> List[Recommendation]:
        monthly_units = customer.get("monthly_units", 0)
        if monthly_units <= 0:
            return []

        recs = []
        if monthly_units >= 500:
            recs.append(Recommendation(
                category="battery",
                title="Battery Storage Recommended",
                description=(
                    f"High consumption ({monthly_units:.0f} kWh/month) suggests a "
                    f"battery storage system could optimize self-consumption by 30-40%."
                ),
                priority="medium",
                confidence=0.70,
                action="Include battery in proposal (5-10 kWh capacity)",
                metadata={"battery_capacity_kwh": min(10, max(5, monthly_units // 100))},
            ))
        return recs

    # ── Roof Inspection ──────────────────────────────────────────────────

    def _roof_inspection_recommendation(
        self, customer: Dict[str, Any], crm: Dict[str, Any]
    ) -> List[Recommendation]:
        roof = crm.get("roof_analysis")
        if roof is None:
            return [Recommendation(
                category="roof_inspection",
                title="Roof Inspection Required",
                description="No roof analysis available. Schedule site survey before proposal.",
                priority="high",
                confidence=0.95,
                action="Schedule roof inspection",
            )]

        score = roof.get("suitability_score", 0)
        if score < 70:
            return [Recommendation(
                category="roof_inspection",
                title="Roof Condition Needs Attention",
                description=(
                    f"Roof suitability score is {score}%. "
                    f"Structural assessment recommended before installation."
                ),
                priority="high",
                confidence=0.80,
                action="Schedule detailed roof inspection",
                metadata={"suitability_score": score},
            )]
        return []

    # ── Subsidy Eligibility ──────────────────────────────────────────────

    def _subsidy_recommendation(
        self, customer: Dict[str, Any], predictions: Dict[str, Any]
    ) -> List[Recommendation]:
        monthly_units = customer.get("monthly_units", 0)
        if monthly_units <= 0:
            return []

        recommended_kw = round(monthly_units / 135.0, 1)

        if recommended_kw <= 3:
            subsidy = 78000 if recommended_kw >= 3 else (60000 if recommended_kw >= 2 else recommended_kw * 30000)
            return [Recommendation(
                category="subsidy",
                title="PM Surya Ghar Subsidy Eligible",
                description=(
                    f"System size {recommended_kw} kW qualifies for PM Surya Ghar "
                    f"subsidy of ₹{subsidy:,.0f}. Net cost after subsidy: "
                    f"₹{max(0, recommended_kw * 55000 - subsidy):,.0f}."
                ),
                priority="high",
                confidence=0.90,
                action="Apply for PM Surya Ghar subsidy before installation",
                metadata={"subsidy_amount": subsidy, "recommended_kw": recommended_kw},
            )]
        return [Recommendation(
            category="subsidy",
            title="Subsidy Limit Exceeded",
            description=(
                f"System size {recommended_kw} kW exceeds PM Surya Ghar cap. "
                f"Maximum subsidy of ₹78,000 applies. Explore state-level incentives."
            ),
            priority="medium",
            confidence=0.85,
            action="Check state-level solar incentives",
            metadata={"recommended_kw": recommended_kw},
        )]

    # ── Financing Recommendation ─────────────────────────────────────────

    def _financing_recommendation(
        self, customer: Dict[str, Any], predictions: Dict[str, Any]
    ) -> List[Recommendation]:
        monthly_units = customer.get("monthly_units", 0)
        if monthly_units <= 0:
            return []

        recommended_kw = round(monthly_units / 135.0, 1)
        system_cost = recommended_kw * 55000
        net_cost = max(0, system_cost - 78000)
        monthly_bill = customer.get("bill_amount", monthly_units * 7.5)

        if net_cost > 200000:
            emi_approx = round(net_cost / 60)  # 5-year loan
            return [Recommendation(
                category="financing",
                title="Solar Financing Available",
                description=(
                    f"Net system cost ₹{net_cost:,.0f} qualifies for solar loan. "
                    f"Estimated 5-year EMI: ₹{emi_approx:,}/month — lower than "
                    f"current bill of ₹{monthly_bill:,.0f}."
                ),
                priority="medium",
                confidence=0.75,
                action="Share financing options (SBI, HDFC, Tata Capital)",
                metadata={"net_cost": net_cost, "estimated_emi": emi_approx},
            )]
        return []

    # ── High-Value Customer ──────────────────────────────────────────────

    def _high_value_customer(
        self, customer: Dict[str, Any], predictions: Dict[str, Any], crm: Dict[str, Any]
    ) -> List[Recommendation]:
        monthly_units = customer.get("monthly_units", 0)
        recommended_kw = round(monthly_units / 135.0, 1)
        system_cost = recommended_kw * 55000

        if system_cost >= 300000:
            return [Recommendation(
                category="lead_priority",
                title="High-Value Customer",
                description=(
                    f"Project value ₹{system_cost:,.0f} ({recommended_kw} kW system). "
                    f"Assign senior sales representative."
                ),
                priority="high",
                confidence=0.90,
                action="Assign senior sales rep and schedule follow-up",
                metadata={"system_cost": system_cost, "recommended_kw": recommended_kw},
            )]
        return []

    # ── Follow-up Priority ───────────────────────────────────────────────

    def _followup_priority(
        self, customer: Dict[str, Any], crm: Dict[str, Any]
    ) -> List[Recommendation]:
        last_activity = crm.get("last_activity")
        if not last_activity:
            return [Recommendation(
                category="followup",
                title="Initial Follow-up Required",
                description="No activity recorded. Initiate contact within 24 hours.",
                priority="high",
                confidence=0.80,
                action="Send introductory message or schedule call",
            )]
        return []

    # ── Upsell Opportunity ───────────────────────────────────────────────

    def _upsell_opportunity(
        self, customer: Dict[str, Any], predictions: Dict[str, Any], crm: Dict[str, Any]
    ) -> List[Recommendation]:
        monthly_units = customer.get("monthly_units", 0)
        if monthly_units >= 600:
            return [Recommendation(
                category="upsell",
                title="Battery & EV Charger Upsell",
                description=(
                    f"High consumption ({monthly_units:.0f} kWh/month) indicates "
                    f"strong ROI on battery storage and EV charger add-ons."
                ),
                priority="medium",
                confidence=0.65,
                action="Include battery and EV charger in proposal",
                metadata={"monthly_units": monthly_units},
            )]
        return []

    # ── AMC Recommendation ───────────────────────────────────────────────

    def _amc_recommendation(
        self, customer: Dict[str, Any], crm: Dict[str, Any]
    ) -> List[Recommendation]:
        installation = crm.get("installation")
        if installation and installation.get("current_stage") == "Completed":
            return [Recommendation(
                category="amc",
                title="AMC Plan Recommended",
                description="Installation completed. Offer annual maintenance contract for panel cleaning and monitoring.",
                priority="medium",
                confidence=0.70,
                action="Send AMC proposal",
            )]
        return []


def get_recommendation_engine() -> RecommendationEngine:
    """Return singleton recommendation engine."""
    return RecommendationEngine()

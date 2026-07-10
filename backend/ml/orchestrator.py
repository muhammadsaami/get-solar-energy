"""
backend/ml/orchestrator.py
===========================
GET Solar Energy — AI Intelligence Orchestrator
Phase 13.0C

Central coordination layer that assembles the full AI analysis pipeline:

  CRM Data
    → Customer 360
    → Bill Analysis
    → Roof Analysis
    → ROI Calculator
    → ML Inference
    → Recommendation Engine
    → Explainability
    → Unified AI Response

Failures in any single stage are handled gracefully — downstream
stages receive empty data rather than aborting the pipeline.
"""

import time
import uuid
from typing import Any, Dict, List, Optional

from .inference import get_inference_engine, MODEL_BILL, MODEL_SAVINGS
from .recommendation_engine import get_recommendation_engine
from .explainability import get_explainability_engine
from .audit import get_audit_logger
from .monitoring import get_monitoring
from utils.logger import get_logger

logger = get_logger("ml.orchestrator")


class AIOrchestrator:
    """Coordinates all AI subsystems into a unified response."""

    _instance: Optional["AIOrchestrator"] = None

    def __new__(cls) -> "AIOrchestrator":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._inference = get_inference_engine()
        self._recommendations = get_recommendation_engine()
        self._explainability = get_explainability_engine()
        self._audit = get_audit_logger()
        self._monitoring = get_monitoring()
        self._initialized = True

    # ── Full Analysis Pipeline ───────────────────────────────────────────

    def analyze_customer(
        self,
        customer_data: Dict[str, Any],
        customer_360: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Execute the full AI analysis pipeline for a customer.

        Args:
            customer_data:   Bill/profile data (monthly_units, city, etc.)
            customer_360:    Optional pre-fetched Customer 360 data.
            request_id:      Optional correlation ID.

        Returns:
            Structured AI analysis response.
        """
        start = time.perf_counter()
        rid = request_id or uuid.uuid4().hex

        logger.info("AI analysis started", extra={"request_id": rid})

        # Stage 1: ML Inference (Bill + Savings)
        predictions = self._run_inference(customer_data, rid)

        # Stage 2: ROI Calculation
        roi = self._calculate_roi(customer_data)

        # Stage 3: Customer Score
        customer_score = self._compute_customer_score(customer_data, predictions, customer_360)

        # Stage 4: Solar Readiness
        solar_readiness = self._compute_solar_readiness(customer_data, predictions, customer_360)

        # Stage 5: Recommendations
        recommendations = self._generate_recommendations(customer_data, predictions, customer_360)

        # Stage 6: Explainability
        explanations = self._generate_explanations(predictions)

        # Stage 7: Timeline
        timeline = self._build_timeline(customer_data, customer_360)

        # Stage 8: Risk Indicators
        risk_indicators = self._collect_risk_indicators(
            customer_data, predictions, recommendations, explanations
        )

        # Stage 9: Next Best Action
        next_best_action = self._determine_next_best_action(
            customer_data, predictions, recommendations, customer_360
        )

        # Stage 10: Confidence Assessment
        confidence = self._assess_confidence(predictions, customer_data)

        latency_ms = (time.perf_counter() - start) * 1000.0

        logger.info(
            "AI analysis completed",
            extra={"request_id": rid, "latency_ms": round(latency_ms, 2)},
        )

        return {
            "customer": customer_data,
            "predictions": predictions,
            "recommendations": [r.to_dict() for r in recommendations],
            "confidence": confidence,
            "explanation": explanations,
            "timeline": timeline,
            "customer_score": customer_score,
            "solar_readiness": solar_readiness,
            "risk_indicators": [r.to_dict() for r in risk_indicators],
            "next_best_action": next_best_action,
            "roi": roi,
            "request_id": rid,
            "latency_ms": round(latency_ms, 3),
        }

    # ── Pipeline Stages ──────────────────────────────────────────────────

    def _run_inference(self, data: Dict[str, Any], request_id: str) -> Dict[str, Any]:
        """Run bill and savings ML predictions."""
        results = {}
        payload = {
            "monthly_units": data.get("monthly_units", 0),
            "city": data.get("city", "Lucknow"),
            "billing_period": data.get("billing_period", "JAN"),
            "per_unit_rate": data.get("per_unit_rate", 7.0),
        }

        # Bill prediction
        try:
            bill_result = self._inference.predict_bill(
                payload, endpoint="/api/ai/analyze", request_id=request_id
            )
            results["bill"] = bill_result
        except Exception as exc:
            logger.error("Bill prediction failed", extra={"error": str(exc)})
            results["bill"] = {"success": False, "prediction": None, "error": str(exc)}

        # Savings prediction
        try:
            savings_result = self._inference.predict_savings(
                payload, endpoint="/api/ai/analyze", request_id=request_id
            )
            results["savings"] = savings_result
        except Exception as exc:
            logger.error("Savings prediction failed", extra={"error": str(exc)})
            results["savings"] = {"success": False, "prediction": None, "error": str(exc)}

        return results

    def _calculate_roi(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate ROI metrics from customer data."""
        monthly_units = data.get("monthly_units", 0)
        per_unit_rate = data.get("per_unit_rate", 7.0)
        bill_amount = data.get("bill_amount", monthly_units * per_unit_rate)

        recommended_kw = round(monthly_units / 135.0, 1) if monthly_units > 0 else 0
        system_cost = recommended_kw * 55000

        if recommended_kw >= 3:
            subsidy = 78000
        elif recommended_kw >= 2:
            subsidy = 60000
        else:
            subsidy = recommended_kw * 30000

        net_cost = max(0, system_cost - subsidy)
        monthly_savings = bill_amount * 0.9
        annual_savings = monthly_savings * 12
        payback_period = round(net_cost / annual_savings, 1) if annual_savings > 0 else 0
        lifetime_savings = round((annual_savings * 25) - net_cost, 0)
        roi_pct = round(((lifetime_savings - net_cost) / net_cost) * 100, 1) if net_cost > 0 else 0
        co2_reduction = round(recommended_kw * 4.5 * 30 * 12 * 0.82 / 1000, 2)

        return {
            "recommended_kw": recommended_kw,
            "system_cost": system_cost,
            "subsidy": subsidy,
            "net_cost": net_cost,
            "monthly_savings": round(monthly_savings, 0),
            "annual_savings": round(annual_savings, 0),
            "payback_period": payback_period,
            "lifetime_savings": lifetime_savings,
            "roi_percentage": roi_pct,
            "co2_reduction_tons": co2_reduction,
        }

    def _compute_customer_score(
        self,
        data: Dict[str, Any],
        predictions: Dict[str, Any],
        crm: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Generate enterprise customer score."""
        monthly_units = data.get("monthly_units", 0)
        bill_amount = data.get("bill_amount", monthly_units * data.get("per_unit_rate", 7.5))
        recommended_kw = round(monthly_units / 135.0, 1) if monthly_units > 0 else 0

        # Purchase intent (0-100)
        purchase_intent = 0
        if monthly_units > 0:
            if monthly_units >= 500:
                purchase_intent = 90
            elif monthly_units >= 300:
                purchase_intent = 75
            elif monthly_units >= 200:
                purchase_intent = 60
            elif monthly_units >= 100:
                purchase_intent = 45
            else:
                purchase_intent = 30

        # Financial readiness (0-100)
        financial_readiness = 0
        if bill_amount >= 10000:
            financial_readiness = 85
        elif bill_amount >= 6000:
            financial_readiness = 70
        elif bill_amount >= 3000:
            financial_readiness = 55
        else:
            financial_readiness = 40

        # Installation readiness (0-100)
        installation_readiness = 50  # default neutral
        if crm:
            roof = crm.get("roof_analysis")
            if roof and roof.get("suitability_score", 0) > 80:
                installation_readiness = 85
            elif roof:
                installation_readiness = 60
            if crm.get("status") in ("Won", "Completed"):
                installation_readiness = 95

        # Follow-up priority (0-100)
        followup_priority = 50
        if purchase_intent >= 80 and financial_readiness >= 70:
            followup_priority = 90
        elif purchase_intent >= 60:
            followup_priority = 70

        # Lifetime value estimate
        system_cost = recommended_kw * 55000
        lifetime_value = system_cost + (recommended_kw * 55000 * 0.15)  # 15% maintenance value

        # Risk score (lower = less risk)
        risk_score = 20
        if monthly_units < 100:
            risk_score += 20
        if bill_amount < 2000:
            risk_score += 15
        risk_score = min(100, risk_score)

        overall = round(
            purchase_intent * 0.30 +
            financial_readiness * 0.25 +
            installation_readiness * 0.25 +
            followup_priority * 0.20
        )

        return {
            "overall_score": overall,
            "purchase_intent": purchase_intent,
            "financial_readiness": financial_readiness,
            "installation_readiness": installation_readiness,
            "followup_priority": followup_priority,
            "lifetime_value_estimate": round(lifetime_value, 0),
            "risk_score": risk_score,
        }

    def _compute_solar_readiness(
        self,
        data: Dict[str, Any],
        predictions: Dict[str, Any],
        crm: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Compute solar readiness assessment."""
        monthly_units = data.get("monthly_units", 0)
        per_unit_rate = data.get("per_unit_rate", 7.0)
        recommended_kw = round(monthly_units / 135.0, 1) if monthly_units > 0 else 0

        # Roof suitability
        roof_suitability = 75  # default
        if crm and crm.get("roof_analysis"):
            roof_suitability = crm["roof_analysis"].get("suitability_score", 75)

        # Consumption suitability
        consumption_suitability = min(100, max(0, int(monthly_units / 6)))

        # ROI
        roi_data = self._calculate_roi(data)

        # Savings potential
        bill_amount = monthly_units * per_unit_rate
        savings_potential = round((bill_amount * 0.9 * 12 * 25) - roi_data["net_cost"], 0)

        # Environmental impact
        co2_annual = round(recommended_kw * 4.5 * 30 * 12 * 0.82 / 1000, 2)

        # Risk
        risk = "low" if monthly_units >= 200 and roof_suitability >= 70 else "medium"
        if monthly_units < 100 or roof_suitability < 50:
            risk = "high"

        # Overall readiness score
        overall = round(
            roof_suitability * 0.30 +
            consumption_suitability * 0.30 +
            min(100, max(0, 100 - roi_data["payback_period"] * 10)) * 0.25 +
            (90 if risk == "low" else 60 if risk == "medium" else 30) * 0.15
        )

        # Confidence
        confidence_factors = 0
        confidence_total = 0
        if monthly_units > 0:
            confidence_factors += 1
        confidence_total += 1
        if crm and crm.get("roof_analysis"):
            confidence_factors += 1
        confidence_total += 1
        if per_unit_rate > 0:
            confidence_factors += 1
        confidence_total += 1
        confidence = round(confidence_factors / confidence_total, 2) if confidence_total > 0 else 0

        return {
            "overall_score": overall,
            "roof_suitability": roof_suitability,
            "consumption_suitability": consumption_suitability,
            "roi": roi_data,
            "savings_potential_25yr": savings_potential,
            "environmental_impact": {
                "co2_reduction_annual_tons": co2_annual,
                "trees_equivalent": round(co2_annual * 40, 0),
            },
            "risk": risk,
            "confidence": confidence,
        }

    def _generate_recommendations(self, data, predictions, crm):
        """Delegate to the recommendation engine."""
        return self._recommendations.generate_recommendations(data, predictions, crm)

    def _generate_explanations(self, predictions: Dict[str, Any]) -> Dict[str, Any]:
        """Generate explanations for all predictions."""
        explanations = {}
        for model_key in ("bill", "savings"):
            pred_data = predictions.get(model_key, {})
            if pred_data.get("success"):
                explanation = self._explainability.explain_prediction(
                    model_name=pred_data.get("model", f"{model_key}_model"),
                    prediction=pred_data.get("prediction"),
                    features_used=pred_data.get("features_used"),
                    success=True,
                )
            else:
                explanation = self._explainability.explain_prediction(
                    model_name=f"{model_key}_model",
                    prediction=None,
                    features_used=None,
                    success=False,
                    error=pred_data.get("error"),
                )
            explanations[model_key] = explanation.to_dict()
        return explanations

    def _build_timeline(self, data: Dict[str, Any], crm: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Build the prediction timeline."""
        timeline = [
            {"step": 1, "label": "Bill Uploaded", "status": "completed", "icon": "bill"},
            {"step": 2, "label": "Bill Analysis", "status": "completed", "icon": "calculator"},
        ]

        if crm and crm.get("roof_analysis"):
            timeline.append({"step": 3, "label": "Roof Analysis", "status": "completed", "icon": "roof"})
        else:
            timeline.append({"step": 3, "label": "Roof Analysis", "status": "pending", "icon": "roof"})

        timeline.extend([
            {"step": 4, "label": "ROI Calculation", "status": "completed", "icon": "calculator"},
            {"step": 5, "label": "ML Prediction", "status": "completed", "icon": "bot"},
            {"step": 6, "label": "Recommendations", "status": "completed", "icon": "activity"},
            {"step": 7, "label": "CRM Updated", "status": "pending", "icon": "settings"},
        ])
        return timeline

    def _collect_risk_indicators(self, data, predictions, recommendations, explanations):
        """Collect risk indicators from all subsystems."""
        risks = []
        monthly_units = data.get("monthly_units", 0)

        if monthly_units < 100:
            risks.append({
                "severity": "medium",
                "category": "consumption",
                "message": "Low monthly consumption may reduce solar ROI.",
                "mitigation": "Verify consumption data or consider smaller system.",
            })

        if monthly_units > 800:
            risks.append({
                "severity": "medium",
                "category": "consumption",
                "message": "Very high consumption — verify residential use.",
                "mitigation": "Confirm customer type and tariff structure.",
            })

        # Collect risks from explanations
        for exp_key, exp_data in explanations.items():
            for risk in exp_data.get("risk_indicators", []):
                risks.append(risk)

        return risks

    def _determine_next_best_action(self, data, predictions, recommendations, crm):
        """Determine the single best next action."""
        if not data.get("monthly_units"):
            return "Collect customer bill data for analysis."

        high_priority = [r for r in recommendations if r.priority == "high"]
        if high_priority:
            return high_priority[0].action

        if crm and crm.get("status") == "New Lead":
            return "Schedule initial consultation call."

        return "Share solar proposal with customer."

    def _assess_confidence(self, predictions: Dict[str, Any], data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess overall confidence in the analysis."""
        scores = []
        if predictions.get("bill", {}).get("success"):
            scores.append(0.85)
        if predictions.get("savings", {}).get("success"):
            scores.append(0.85)
        if data.get("monthly_units", 0) > 0:
            scores.append(0.90)

        overall = round(sum(scores) / len(scores), 2) if scores else 0.5

        if overall >= 0.80:
            label = "High"
        elif overall >= 0.60:
            label = "Medium"
        else:
            label = "Low"

        return {
            "overall": overall,
            "label": label,
            "ml_confidence": round(sum(scores[:2]) / 2, 2) if scores else 0,
            "data_completeness": round(sum(scores[2:]) / max(1, len(scores[2:])), 2) if len(scores) > 2 else 0,
        }


def get_ai_orchestrator() -> AIOrchestrator:
    """Return singleton orchestrator."""
    return AIOrchestrator()

"""
backend/ml/ai_service.py
=========================
GET Solar Energy — Public AI Intelligence Service
Phase 13.0C

Facade over the AI Orchestrator. Exposes high-level methods:

  - analyze_customer()    Full analysis pipeline
  - recommend()           Business recommendations only
  - explain()             Prediction explanation only
  - customer_score()      Customer scoring only
  - solar_readiness()     Solar readiness assessment only

No HTTP logic. No duplicated inference. No duplicated preprocessing.
All ML calls go through the Registry → Loader → Inference pipeline.
"""

from typing import Any, Dict, List, Optional

from .orchestrator import get_ai_orchestrator
from .recommendation_engine import get_recommendation_engine
from .explainability import get_explainability_engine
from .inference import get_inference_engine
from utils.logger import get_logger

logger = get_logger("ml.ai_service")


class AIService:
    """Public AI intelligence service facade."""

    _instance: Optional["AIService"] = None

    def __new__(cls) -> "AIService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._orchestrator = get_ai_orchestrator()
        self._recommendations = get_recommendation_engine()
        self._explainability = get_explainability_engine()
        self._inference = get_inference_engine()
        self._initialized = True

    def analyze_customer(
        self,
        customer_data: Dict[str, Any],
        customer_360: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Run the full AI analysis pipeline for a customer.

        Returns:
            Unified analysis response with predictions, recommendations,
            explanations, scores, and risk indicators.
        """
        logger.info("AI analyze_customer", extra={"request_id": request_id})
        return self._orchestrator.analyze_customer(
            customer_data=customer_data,
            customer_360=customer_360,
            request_id=request_id,
        )

    def recommend(
        self,
        customer_data: Dict[str, Any],
        predictions: Optional[Dict[str, Any]] = None,
        crm_context: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Generate business recommendations for a customer.

        Args:
            customer_data:  Bill and profile data.
            predictions:    Optional pre-computed predictions.
            crm_context:    Optional CRM enrichment.

        Returns:
            List of recommendation dicts.
        """
        logger.info("AI recommend")
        if predictions is None:
            predictions = self._orchestrator._run_inference(customer_data, "recommend")
        recs = self._recommendations.generate_recommendations(
            customer_data, predictions, crm_context
        )
        return [r.to_dict() for r in recs]

    def explain(
        self,
        model_name: str,
        prediction: Optional[float],
        features_used: Optional[Dict[str, Any]],
        success: bool = True,
        error: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate a human-readable explanation for a prediction.

        Returns:
            Explanation dict with factors, interpretation, and risks.
        """
        logger.info("AI explain", extra={"model": model_name})
        explanation = self._explainability.explain_prediction(
            model_name=model_name,
            prediction=prediction,
            features_used=features_used,
            success=success,
            error=error,
        )
        return explanation.to_dict()

    def customer_score(
        self,
        customer_data: Dict[str, Any],
        crm_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Compute the enterprise customer score.

        Returns:
            Score breakdown with purchase intent, financial readiness,
            installation readiness, follow-up priority, LTV, and risk.
        """
        logger.info("AI customer_score")
        predictions = self._orchestrator._run_inference(customer_data, "score")
        return self._orchestrator._compute_customer_score(
            customer_data, predictions, crm_context
        )

    def solar_readiness(
        self,
        customer_data: Dict[str, Any],
        crm_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Compute the solar readiness assessment.

        Returns:
            Readiness score with roof suitability, consumption analysis,
            ROI, savings potential, environmental impact, and confidence.
        """
        logger.info("AI solar_readiness")
        predictions = self._orchestrator._run_inference(customer_data, "readiness")
        return self._orchestrator._compute_solar_readiness(
            customer_data, predictions, crm_context
        )


def get_ai_service() -> AIService:
    """Return singleton AI service."""
    return AIService()

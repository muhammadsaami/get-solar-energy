"""
backend/ml/ai_routes.py
========================
GET Solar Energy — AI Intelligence API Router
Phase 13.0C

Exposes:
  POST /api/ai/analyze          Full AI analysis pipeline
  POST /api/ai/recommend        Business recommendations
  POST /api/ai/explain          Prediction explanation
  POST /api/ai/customer-score   Enterprise customer scoring
  POST /api/ai/solar-readiness  Solar readiness assessment

All endpoints use the standard response envelope (utils.responses).
All endpoints use structured logging (utils.logger).
All predictions go through the ML Registry pipeline.
"""

import uuid
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from .ai_service import get_ai_service
from .orchestrator import get_ai_orchestrator
from utils.logger import get_logger
from utils.responses import ok, server_error, bad_request

logger = get_logger("ml.ai_routes")

router = APIRouter(prefix="/api/ai", tags=["ai-intelligence"])


# ── Request Schemas ──────────────────────────────────────────────────────

class AIAnalyzeRequest(BaseModel):
    monthly_units: float = Field(..., gt=0, description="Monthly consumption in kWh")
    city: str = Field("Lucknow", description="City name")
    billing_period: str = Field("JAN", description="Billing period (JAN-DEC)")
    per_unit_rate: float = Field(7.0, gt=0, description="Per-unit electricity rate (INR)")
    bill_amount: Optional[float] = Field(None, description="Current bill amount (INR)")
    customer_id: Optional[int] = Field(None, description="CRM customer ID for 360 enrichment")

    class Config:
        json_schema_extra = {
            "example": {
                "monthly_units": 350,
                "city": "Lucknow",
                "billing_period": "JUN",
                "per_unit_rate": 7.5,
                "bill_amount": 2625,
                "customer_id": 1,
            }
        }


class AIRecommendRequest(BaseModel):
    monthly_units: float = Field(..., gt=0)
    city: str = Field("Lucknow")
    billing_period: str = Field("JAN")
    per_unit_rate: float = Field(7.0, gt=0)
    bill_amount: Optional[float] = None
    customer_id: Optional[int] = None


class AIExplainRequest(BaseModel):
    model_name: str = Field(..., description="Model name (bill_model or savings_model)")
    prediction: Optional[float] = Field(None, description="Prediction value to explain")
    features_used: Optional[dict] = Field(None, description="Features used in prediction")
    success: bool = Field(True, description="Whether prediction succeeded")
    error: Optional[str] = Field(None, description="Error message if prediction failed")


class AICustomerScoreRequest(BaseModel):
    monthly_units: float = Field(..., gt=0)
    city: str = Field("Lucknow")
    billing_period: str = Field("JAN")
    per_unit_rate: float = Field(7.0, gt=0)
    bill_amount: Optional[float] = None
    customer_id: Optional[int] = None


class AISolarReadinessRequest(BaseModel):
    monthly_units: float = Field(..., gt=0)
    city: str = Field("Lucknow")
    billing_period: str = Field("JAN")
    per_unit_rate: float = Field(7.0, gt=0)
    bill_amount: Optional[float] = None
    customer_id: Optional[int] = None


# ── Helper ───────────────────────────────────────────────────────────────

def _customer_360_from_id(customer_id: Optional[int]) -> Optional[dict]:
    """Fetch Customer 360 data if customer_id is provided."""
    if customer_id is None:
        return None
    try:
        from database_sqlite import SessionLocalSqlite
        from crm_service import get_customer_360
        db = SessionLocalSqlite()
        try:
            return get_customer_360(db, customer_id)
        finally:
            db.close()
    except Exception as exc:
        logger.warning("Failed to fetch Customer 360", extra={"customer_id": customer_id, "error": str(exc)})
        return None


def _build_customer_data(req) -> dict:
    """Extract customer_data dict from any request model."""
    bill_amount = req.bill_amount or (req.monthly_units * req.per_unit_rate)
    return {
        "monthly_units": req.monthly_units,
        "city": req.city,
        "billing_period": req.billing_period,
        "per_unit_rate": req.per_unit_rate,
        "bill_amount": bill_amount,
    }


# ── Endpoints ────────────────────────────────────────────────────────────

@router.post("/analyze")
def ai_analyze(req: AIAnalyzeRequest):
    """
    Full AI analysis pipeline.

    Returns predictions, recommendations, explanations, customer score,
    solar readiness, risk indicators, and next best action.
    """
    request_id = uuid.uuid4().hex
    logger.info("AI analyze request", extra={"request_id": request_id, "units": req.monthly_units})

    try:
        service = get_ai_service()
        customer_data = _build_customer_data(req)
        crm_360 = _customer_360_from_id(req.customer_id)

        result = service.analyze_customer(
            customer_data=customer_data,
            customer_360=crm_360,
            request_id=request_id,
        )
        return ok(data=result, message="AI analysis complete")
    except Exception as exc:
        logger.error("AI analyze failed", extra={"request_id": request_id, "error": str(exc)}, exc_info=True)
        return server_error(message="AI analysis failed")


@router.post("/recommend")
def ai_recommend(req: AIRecommendRequest):
    """
    Business recommendations for a customer.
    """
    request_id = uuid.uuid4().hex
    logger.info("AI recommend request", extra={"request_id": request_id})

    try:
        service = get_ai_service()
        customer_data = _build_customer_data(req)
        crm_360 = _customer_360_from_id(req.customer_id)

        result = service.recommend(
            customer_data=customer_data,
            crm_context=crm_360,
        )
        return ok(data={"recommendations": result}, message="Recommendations generated")
    except Exception as exc:
        logger.error("AI recommend failed", extra={"request_id": request_id, "error": str(exc)}, exc_info=True)
        return server_error(message="Recommendation generation failed")


@router.post("/explain")
def ai_explain(req: AIExplainRequest):
    """
    Human-readable explanation for a prediction.
    """
    request_id = uuid.uuid4().hex
    logger.info("AI explain request", extra={"request_id": request_id, "model": req.model_name})

    try:
        service = get_ai_service()
        result = service.explain(
            model_name=req.model_name,
            prediction=req.prediction,
            features_used=req.features_used,
            success=req.success,
            error=req.error,
        )
        return ok(data=result, message="Explanation generated")
    except Exception as exc:
        logger.error("AI explain failed", extra={"request_id": request_id, "error": str(exc)}, exc_info=True)
        return server_error(message="Explanation generation failed")


@router.post("/customer-score")
def ai_customer_score(req: AICustomerScoreRequest):
    """
    Enterprise customer scoring.
    """
    request_id = uuid.uuid4().hex
    logger.info("AI customer-score request", extra={"request_id": request_id})

    try:
        service = get_ai_service()
        customer_data = _build_customer_data(req)
        crm_360 = _customer_360_from_id(req.customer_id)

        result = service.customer_score(
            customer_data=customer_data,
            crm_context=crm_360,
        )
        return ok(data=result, message="Customer score computed")
    except Exception as exc:
        logger.error("AI customer-score failed", extra={"request_id": request_id, "error": str(exc)}, exc_info=True)
        return server_error(message="Customer scoring failed")


@router.post("/solar-readiness")
def ai_solar_readiness(req: AISolarReadinessRequest):
    """
    Solar readiness assessment.
    """
    request_id = uuid.uuid4().hex
    logger.info("AI solar-readiness request", extra={"request_id": request_id})

    try:
        service = get_ai_service()
        customer_data = _build_customer_data(req)
        crm_360 = _customer_360_from_id(req.customer_id)

        result = service.solar_readiness(
            customer_data=customer_data,
            crm_context=crm_360,
        )
        return ok(data=result, message="Solar readiness assessed")
    except Exception as exc:
        logger.error("AI solar-readiness failed", extra={"request_id": request_id, "error": str(exc)}, exc_info=True)
        return server_error(message="Solar readiness assessment failed")

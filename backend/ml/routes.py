"""
backend/ml/routes.py
====================
GET Solar Energy — ML Prediction API Router
Phase 13.0B (Batch 4)

Exposes:
  GET  /api/ml/models
  GET  /api/ml/status
  GET  /api/ml/metrics
  POST /api/ml/predict/bill
  POST /api/ml/predict/savings
  POST /api/ml/batch-predict

Prediction endpoints:
  - validate payload
  - call InferenceEngine
  - use the standard response envelope (utils.responses)
  - use structured logging (utils.logger)
"""

import uuid
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, Depends
from security import verify_token
from pydantic import BaseModel, Field

from .inference import get_inference_engine
from .registry import get_registry
from .monitoring import get_monitoring
from .loader import get_loader
from utils.logger import get_logger
from utils.responses import ok, server_error, validation_error, not_found


logger = get_logger("ml.routes")

router = APIRouter(prefix="/api/ml", tags=["ml"], dependencies=[Depends(verify_token)])


# ── Request schemas ──────────────────────────────────────────────────────

class PredictionRequest(BaseModel):
    monthly_units: float = Field(..., gt=0, description="Monthly consumption in kWh")
    city: str = Field("Lucknow", description="City name (must be a known encoder class)")
    billing_period: str = Field("JAN", description="Billing period, e.g. JAN, FEB, ...")
    per_unit_rate: float = Field(7.0, gt=0, description="Per-unit electricity rate in INR")


class BatchPredictionItem(BaseModel):
    type: str = Field("bill", description="'bill' or 'savings'")
    monthly_units: float = Field(..., gt=0)
    city: str = Field("Lucknow")
    billing_period: str = Field("JAN")
    per_unit_rate: float = Field(7.0, gt=0)


class BatchPredictionRequest(BaseModel):
    items: List[BatchPredictionItem] = Field(..., min_items=1)


# ── Read-only endpoints ─────────────────────────────────────────────────

@router.get("/models")
def list_models():
    registry = get_registry()
    models = [
        {
            "name": m.name,
            "version": m.version,
            "algorithm": m.algorithm,
            "framework": m.framework,
            "task": m.task,
            "status": m.status,
            "checksum": m.checksum,
            "file_size": m.file_size,
            "features": m.features,
        }
        for m in registry.get_all()
    ]
    encoders = [
        {"name": e.name, "algorithm": e.algorithm, "framework": e.framework}
        for e in registry.get_all_encoders()
    ]
    return ok(data={"models": models, "encoders": encoders})


@router.get("/status")
def ml_status():
    registry = get_registry()
    loader = get_loader()
    return ok(
        data={
            "registry_loaded": True,
            "total_models": len(registry.get_all()),
            "total_encoders": len(registry.get_all_encoders()),
            "loader_cache_size": len(loader._cache),
            "status": "operational",
        },
        message="ML platform operational",
    )


@router.get("/metrics")
def ml_metrics():
    monitoring = get_monitoring()
    return ok(data=monitoring.get_metrics())


# ── Prediction endpoints ────────────────────────────────────────────────

@router.post("/predict/bill")
def predict_bill(req: PredictionRequest):
    engine = get_inference_engine()
    request_id = uuid.uuid4().hex
    logger.info("ML predict bill", extra={"request_id": request_id, "monthly_units": req.monthly_units, "city": req.city})

    result = engine.predict_bill(req.dict(), endpoint="/api/ml/predict/bill", request_id=request_id)
    if not result.get("success"):
        logger.error("ML predict bill failed", extra={"request_id": request_id, "error": result.get("error")})
        return server_error(message="Prediction failed", )
    return ok(data=result, message="Bill prediction complete")


@router.post("/predict/savings")
def predict_savings(req: PredictionRequest):
    engine = get_inference_engine()
    request_id = uuid.uuid4().hex
    logger.info("ML predict savings", extra={"request_id": request_id, "monthly_units": req.monthly_units, "city": req.city})

    result = engine.predict_savings(req.dict(), endpoint="/api/ml/predict/savings", request_id=request_id)
    if not result.get("success"):
        logger.error("ML predict savings failed", extra={"request_id": request_id, "error": result.get("error")})
        return server_error(message="Prediction failed")
    return ok(data=result, message="Savings prediction complete")


@router.post("/batch-predict")
def batch_predict(req: BatchPredictionRequest):
    engine = get_inference_engine()
    request_id = uuid.uuid4().hex
    logger.info("ML batch predict", extra={"request_id": request_id, "items": len(req.items)})

    items = [item.dict() for item in req.items]
    result = engine.predict_batch(items, endpoint="/api/ml/batch-predict", request_id=request_id)
    return ok(data=result, message="Batch prediction complete")

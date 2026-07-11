"""
backend/mlops/routes.py
========================
GET Solar Energy — MLOps API Router
Phase 13.0E.9

Exposes:
  GET  /api/mlops/models
  GET  /api/mlops/models/{name}
  GET  /api/mlops/versions
  POST /api/mlops/deploy
  POST /api/mlops/rollback
  GET  /api/mlops/health
  GET  /api/mlops/metrics
  GET  /api/mlops/drift
  POST /api/mlops/validate
  GET  /api/mlops/status
  GET  /api/mlops/events

All endpoints protected by Administrator authentication.
"""

import hashlib
import uuid
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from security import verify_token
from auth import load_users
from utils.responses import ok, server_error, bad_request, not_found
from utils.logger import get_logger
from ml.validation import validate_model

from .model_manager import get_model_manager, ModelState
from .model_versioning import get_versioning_service
from .deployment_manager import get_deployment_manager, DeployStrategy
from .rollback_manager import get_rollback_manager
from .health_monitor import get_health_monitor
from .metrics_collector import get_metrics_collector
from .drift_detection import get_drift_detector
from .model_registry_service import get_registry_service
from .repository import get_repository

logger = get_logger("mlops.routes")

router = APIRouter(prefix="/api/mlops", tags=["mlops"])

ADMIN_EMAIL = "admin@getsolar.in"


# ── Auth Dependency ──────────────────────────────────────────────────────

def _determine_role(email: str) -> str:
    if email == ADMIN_EMAIL:
        return "Administrator"
    h = int(hashlib.md5(email.encode("utf-8")).hexdigest(), 16)
    if (h % 3) == 0:
        return "Premium User"
    return "Free User"


def require_mlops_admin(token: str = Depends(verify_token)) -> str:
    """Verify token and require Administrator role."""
    role = _determine_role(token)
    if role != "Administrator":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="MLOps requires Administrator access")
    return token


# ── Request Schemas ──────────────────────────────────────────────────────

class DeployRequest(BaseModel):
    model_name: str = Field(..., description="Model name to deploy")
    version: Optional[str] = Field(None, description="Version to deploy (default: latest)")
    strategy: str = Field("standard", description="Deployment strategy: standard, blue_green, canary")
    force: bool = Field(False, description="Force deployment even if validation warnings")

class RollbackRequest(BaseModel):
    model_name: str = Field(..., description="Model name to rollback")
    force: bool = Field(False, description="Force rollback even if validation fails")


# ── Endpoints ────────────────────────────────────────────────────────────

@router.get("/models")
def list_models(user: str = Depends(require_mlops_admin)):
    """List all registered models with metadata."""
    try:
        service = get_registry_service()
        models = service.active_model_lookup()
        return ok(data={"models": models, "total": len(models)})
    except Exception as e:
        logger.error("Failed to list models", extra={"error": str(e)})
        return server_error(message="Failed to list models")


@router.get("/models/{name}")
def get_model(name: str, user: str = Depends(require_mlops_admin)):
    """Get model details with metadata."""
    try:
        manager = get_model_manager()
        model = manager.get_model(name)
        if model is None:
            return not_found(resource="Model", resource_id=name)
        return ok(data=model)
    except Exception as e:
        logger.error("Failed to get model", extra={"error": str(e), "model": name})
        return server_error(message="Failed to get model")


@router.get("/versions")
def list_versions(
    model_name: Optional[str] = Query(None, description="Filter by model name"),
    user: str = Depends(require_mlops_admin),
):
    """List version history for models."""
    try:
        versioning = get_versioning_service()
        manager = get_model_manager()
        models = manager.list_models()

        result = []
        for m in models:
            name = m["name"]
            if model_name and name != model_name:
                continue
            history = versioning.get_history(name)
            result.append({
                "model_name": name,
                "current_version": m.get("version"),
                "previous_version": m.get("previous_version"),
                "history": history,
            })

        return ok(data={"versions": result})
    except Exception as e:
        logger.error("Failed to list versions", extra={"error": str(e)})
        return server_error(message="Failed to list versions")


@router.post("/deploy")
def deploy_model(req: DeployRequest, user: str = Depends(require_mlops_admin)):
    """Deploy a model through the 6-stage pipeline."""
    request_id = uuid.uuid4().hex
    logger.info("MLOps deploy", extra={"request_id": request_id, "model": req.model_name})

    try:
        deploy_mgr = get_deployment_manager()
        result = deploy_mgr.deploy(
            model_name=req.model_name,
            version=req.version,
            strategy=req.strategy,
            force=req.force,
        )

        if not result.get("success"):
            return bad_request(message=f"Deployment failed: {result.get('error', 'unknown')}")

        return ok(data=result, message=f"Model '{req.model_name}' deployed successfully")
    except Exception as e:
        logger.error("Deploy failed", extra={"request_id": request_id, "error": str(e)})
        return server_error(message="Deployment failed")


@router.post("/rollback")
def rollback_model(req: RollbackRequest, user: str = Depends(require_mlops_admin)):
    """Rollback a model to its previous version."""
    request_id = uuid.uuid4().hex
    logger.info("MLOps rollback", extra={"request_id": request_id, "model": req.model_name})

    try:
        rollback_mgr = get_rollback_manager()
        result = rollback_mgr.rollback_to_previous(
            model_name=req.model_name,
            force=req.force,
        )

        if not result.get("success"):
            return bad_request(message=f"Rollback failed: {result.get('error', 'unknown')}")

        return ok(data=result, message=f"Model '{req.model_name}' rolled back successfully")
    except Exception as e:
        logger.error("Rollback failed", extra={"request_id": request_id, "error": str(e)})
        return server_error(message="Rollback failed")


@router.get("/health")
def get_health(
    model_name: Optional[str] = Query(None, description="Model name for per-model health"),
    user: str = Depends(require_mlops_admin),
):
    """Get health snapshot."""
    try:
        hm = get_health_monitor()
        if model_name:
            health = hm.per_model_health(model_name)
        else:
            health = hm.snapshot()
        return ok(data=health)
    except Exception as e:
        logger.error("Health check failed", extra={"error": str(e)})
        return server_error(message="Health check failed")


@router.get("/metrics")
def get_metrics(user: str = Depends(require_mlops_admin)):
    """Get aggregated metrics."""
    try:
        mc = get_metrics_collector()
        metrics = mc.collect()
        return ok(data=metrics)
    except Exception as e:
        logger.error("Metrics collection failed", extra={"error": str(e)})
        return server_error(message="Metrics collection failed")


@router.get("/drift")
def get_drift(
    model_name: Optional[str] = Query(None, description="Model name for per-model drift"),
    user: str = Depends(require_mlops_admin),
):
    """Get drift analysis."""
    try:
        dd = get_drift_detector()
        report = dd.analyze(model_name)
        return ok(data=report)
    except Exception as e:
        logger.error("Drift detection failed", extra={"error": str(e)})
        return server_error(message="Drift detection failed")


@router.post("/validate")
def validate_model_endpoint(
    model_name: str = Query(..., description="Model name to validate"),
    user: str = Depends(require_mlops_admin),
):
    """Validate a model (checksum, structure, metadata)."""
    try:
        result = validate_model(model_name)
        return ok(data=result.to_dict())
    except Exception as e:
        logger.error("Validation failed", extra={"error": str(e), "model": model_name})
        return server_error(message="Validation failed")


@router.get("/status")
def get_status(user: str = Depends(require_mlops_admin)):
    """Get overall MLOps platform status."""
    try:
        manager = get_model_manager()
        status = manager.status()
        return ok(data=status, message="MLOps platform operational")
    except Exception as e:
        logger.error("Status check failed", extra={"error": str(e)})
        return server_error(message="Status check failed")


@router.get("/events")
def get_events(
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    limit: int = Query(100, ge=1, le=1000),
    user: str = Depends(require_mlops_admin),
):
    """Get MLOps event history (deployments, rollbacks, validations, health, drift)."""
    try:
        repo = get_repository()
        if event_type:
            events = repo.read_events_by_type(event_type, limit)
        else:
            events = repo.read_events(limit)
        return ok(data={"events": events, "total": len(events)})
    except Exception as e:
        logger.error("Events fetch failed", extra={"error": str(e)})
        return server_error(message="Events fetch failed")

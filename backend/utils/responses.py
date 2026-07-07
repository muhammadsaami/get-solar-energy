"""
backend/utils/responses.py
==========================
GET Solar Energy — Standardised API Response Helpers
Phase 12.4A+++ Production Excellence

Every CRM endpoint returns a consistent envelope:

    {
        "success": true | false,
        "message": "Human-readable summary",
        "data": <payload> | null,
        "errors": [] | [{"field": "...", "msg": "..."}],
        "timestamp": "2026-07-06T07:00:00Z"
    }

Usage:
    from utils.responses import ok, created, not_found, server_error
    return ok(data=task, message="Task retrieved successfully")
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi.responses import JSONResponse


def _envelope(
    success: bool,
    message: str,
    data: Any = None,
    errors: Optional[List[Dict]] = None,
    status_code: int = 200,
) -> JSONResponse:
    """Internal envelope builder."""
    return JSONResponse(
        status_code=status_code,
        content={
            "success": success,
            "message": message,
            "data": data,
            "errors": errors or [],
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        },
    )


# ─── Success Responses ────────────────────────────────────────────────────────

def ok(data: Any = None, message: str = "Request successful") -> JSONResponse:
    """200 OK with payload."""
    return _envelope(True, message, data=data, status_code=200)


def created(data: Any = None, message: str = "Resource created successfully") -> JSONResponse:
    """201 Created with payload."""
    return _envelope(True, message, data=data, status_code=201)


# ─── Error Responses ──────────────────────────────────────────────────────────

def bad_request(message: str = "Invalid request", errors: Optional[List[Dict]] = None) -> JSONResponse:
    """400 Bad Request."""
    return _envelope(False, message, errors=errors, status_code=400)


def not_found(resource: str = "Resource", resource_id: Any = None) -> JSONResponse:
    """404 Not Found."""
    detail = f"{resource} not found"
    if resource_id is not None:
        detail = f"{resource} with id={resource_id} not found"
    return _envelope(False, detail, status_code=404)


def validation_error(errors: List[Dict]) -> JSONResponse:
    """422 Validation Error."""
    return _envelope(False, "Validation failed", errors=errors, status_code=422)


def server_error(message: str = "An internal server error occurred") -> JSONResponse:
    """500 Internal Server Error — never leak exception details to the client."""
    return _envelope(False, message, status_code=500)


# ─── Serialisation Helpers ────────────────────────────────────────────────────

def serialise(obj) -> Any:
    """
    Convert a SQLAlchemy model instance to a plain dict suitable for JSON
    serialisation.  Only returns columns (no relationship lazy-loads).
    """
    if obj is None:
        return None
    if isinstance(obj, list):
        return [serialise(item) for item in obj]
    if hasattr(obj, "__table__"):
        result = {}
        for col in obj.__table__.columns:
            val = getattr(obj, col.name)
            # Datetime → ISO string
            if hasattr(val, "isoformat"):
                val = val.isoformat()
            result[col.name] = val
        return result
    return obj

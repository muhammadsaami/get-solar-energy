"""
backend/ml/audit.py
====================
GET Solar Energy — Prediction Audit Logging
Phase 13.0B (Batch 3)

Persists an immutable audit trail for every prediction request.

Stored fields per event:
  - timestamp
  - model
  - version
  - endpoint
  - latency
  - success
  - prediction hash
  - input hash
  - request id

Privacy:
  Raw customer information is NEVER written. Only deterministic hashes of
  the prediction value and the (non-PII) feature payload are stored.
"""

import json
import hashlib
import uuid
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, Optional

from .config import get_config


def _hash(value: Any) -> str:
    """Deterministic short hash of an arbitrary value."""
    try:
        payload = json.dumps(value, sort_keys=True, default=str)
    except Exception:
        payload = str(value)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]


def _audit_path() -> Path:
    cfg = get_config()
    path = Path(cfg.models_dir) / "audit" / "predictions.jsonl"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


class AuditLogger:
    """Singleton that appends prediction audit events to a JSONL file."""

    _instance: Optional["AuditLogger"] = None

    def __new__(cls) -> "AuditLogger":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._path = _audit_path()
        self._initialized = True

    def log(
        self,
        *,
        model: str,
        version: str,
        endpoint: str,
        latency_ms: float,
        success: bool,
        prediction: Optional[float] = None,
        input_data: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "model": model,
            "version": version,
            "endpoint": endpoint,
            "latency_ms": round(latency_ms, 3) if latency_ms is not None else None,
            "success": bool(success),
            "prediction_hash": _hash({"model": model, "prediction": prediction}),
            "input_hash": _hash({"model": model, "input": input_data}),
            "request_id": request_id or uuid.uuid4().hex,
        }

        try:
            with open(self._path, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception:
            # Audit logging must never break inference.
            pass

        return entry

    def read(self, limit: int = 100) -> list:
        if not self._path.exists():
            return []
        out = []
        with open(self._path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    out.append(json.loads(line))
                except Exception:
                    continue
        return out[-limit:]


def get_audit_logger() -> AuditLogger:
    return AuditLogger()

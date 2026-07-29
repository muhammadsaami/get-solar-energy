"""
backend/ml/inference.py
========================
GET Solar Energy — Inference Engine
Phase 13.0B (Batch 1)

Responsibilities:
  - Load models using the existing ModelLoader (never touch files directly)
  - Validate input
  - Run preprocessing (reuse ml.preprocessing)
  - Execute prediction (use trained models exactly as-is)
  - Postprocess output (ml.postprocessing)
  - Measure latency
  - Handle errors
  - Return a standardized response
  - Audit + monitor every call

The engine is intentionally thin: it orchestrates the Phase 13.0A
infrastructure and the trained artifacts without altering prediction logic,
feature engineering, or model weights.
"""

import time
from typing import Any, Dict, List, Optional

import pandas as pd

from .config import get_config, FEATURES_BILL, FEATURES_SAVINGS
from .loader import get_loader, ModelLoader
from .registry import get_registry, ModelRegistry
from .metadata import load_metadata
from .postprocessing import build_response
from .monitoring import get_monitoring, Monitoring
from .audit import get_audit_logger, AuditLogger

# ── Month index map (mirrors ml.preprocessing.common.MONTH_MAP) ───────
# Kept local to avoid importing the ml.preprocessing package; values are
# identical so prediction behaviour is unchanged.
_MONTH_MAP = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4,
    "MAY": 5, "JUN": 6, "JUL": 7, "AUG": 8,
    "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12,
}


def _month_num(billing_period) -> int:
    if billing_period is None:
        return 0
    try:
        return _MONTH_MAP.get(str(billing_period).strip()[:3].upper(), 0)
    except Exception:
        return 0

# Canonical registry names for the trained assets.
MODEL_BILL = "bill_model"
MODEL_SAVINGS = "savings_model"
ENCODER_CITY = "city_encoder"

BILL_UNITS = "INR"
SAVINGS_UNITS = "INR/month"

DEFAULT_CITY = "Lucknow"
DEFAULT_PERIOD = "JAN"
DEFAULT_RATE = 7.0


class InferenceEngine:
    """
    Stateless-per-call orchestrator over the ML infrastructure.

    A single instance is shared (singleton) so it reuses the loader cache,
    monitoring counters, and audit logger.
    """

    _instance: Optional["InferenceEngine"] = None

    def __new__(cls) -> "InferenceEngine":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._config = get_config()
        self._loader: ModelLoader = get_loader()
        self._registry: ModelRegistry = get_registry()
        self._monitoring: Monitoring = get_monitoring()
        self._audit: AuditLogger = get_audit_logger()
        self._initialized = True

    # ── Internal helpers ────────────────────────────────────────────────

    def _ensure_ready(self) -> None:
        """Defensively (re)discover models if the registry is empty."""
        if not self._registry.get_all() and not self._registry.get_all_encoders():
            self._registry.discover(self._config.models_dir)

    def _version_for(self, model_name: str) -> str:
        meta = load_metadata(model_name)
        if meta and meta.get("version"):
            return meta["version"]
        entry = self._registry.get(model_name)
        return entry.version if entry else "1.0.0"

    @staticmethod
    def _validate_payload(payload: Dict[str, Any]) -> Optional[str]:
        try:
            units = float(payload.get("monthly_units"))
            rate = float(payload.get("per_unit_rate", DEFAULT_RATE))
        except (TypeError, ValueError):
            return "monthly_units and per_unit_rate must be numeric"
        if units <= 0:
            return "monthly_units must be greater than 0"
        if rate <= 0:
            return "per_unit_rate must be greater than 0"
        return None

    @staticmethod
    def _build_feature_row(
        monthly_units: float,
        city: str,
        billing_period: str,
        per_unit_rate: float,
        encoder: Any,
    ) -> Dict[str, Any]:
        """
        Build the model input feature dict.

        Mirrors ``ml.preprocessing.bill_features.transform_bill_input`` exactly
        (city encoded via the trained LabelEncoder, month index from the billing
        period, then the canonical feature columns). Kept inline to avoid importing
        the preprocessing package, but the produced features are identical.
        """
        city_encoded = int(encoder.transform([city])[0]) if city in encoder.classes_ else 0
        month_num = _month_num(billing_period)
        return {
            "monthly_units": monthly_units,
            "city_encoded": city_encoded,
            "month_num": month_num,
            "per_unit_rate": per_unit_rate,
        }

    # ── Core predictions ────────────────────────────────────────────────

    def predict_bill(self, payload: Dict[str, Any], endpoint: str, request_id: str) -> Dict[str, Any]:
        start = time.perf_counter()
        success = False
        prediction: Optional[float] = None
        error: Optional[str] = None
        features_used: Optional[Dict[str, Any]] = None

        try:
            self._ensure_ready()

            err = self._validate_payload(payload)
            if err:
                raise ValueError(err)

            monthly_units = float(payload["monthly_units"])
            per_unit_rate = float(payload.get("per_unit_rate", DEFAULT_RATE))
            city = str(payload.get("city", DEFAULT_CITY))
            billing_period = str(payload.get("billing_period", DEFAULT_PERIOD))

            encoder = self._loader.load_encoder(ENCODER_CITY)
            feat = self._build_feature_row(
                monthly_units, city, billing_period, per_unit_rate, encoder
            )
            df = pd.DataFrame([feat])[FEATURES_BILL]
            model = self._loader.load(MODEL_BILL)
            prediction = float(model.predict(df)[0])
            features_used = feat
            success = True
        except Exception as exc:  # noqa: BLE001 - normalized at boundary
            error = str(exc)
            success = False
        finally:
            latency_ms = (time.perf_counter() - start) * 1000.0

        self._audit.log(
            model=MODEL_BILL,
            version=self._version_for(MODEL_BILL),
            endpoint=endpoint,
            latency_ms=latency_ms,
            success=success,
            prediction=prediction,
            input_data=features_used,
            request_id=request_id,
        )
        self._monitoring.record(latency_ms, success)

        return build_response(
            success=success,
            model=MODEL_BILL,
            version=self._version_for(MODEL_BILL),
            task="regression",
            prediction=prediction,
            latency_ms=latency_ms,
            features_used=features_used,
            units=BILL_UNITS,
            error=error,
        )

    def predict_savings(self, payload: Dict[str, Any], endpoint: str, request_id: str) -> Dict[str, Any]:
        start = time.perf_counter()
        success = False
        prediction: Optional[float] = None
        error: Optional[str] = None
        features_used: Optional[Dict[str, Any]] = None

        try:
            self._ensure_ready()

            err = self._validate_payload(payload)
            if err:
                raise ValueError(err)

            monthly_units = float(payload["monthly_units"])
            per_unit_rate = float(payload.get("per_unit_rate", DEFAULT_RATE))
            city = str(payload.get("city", DEFAULT_CITY))
            billing_period = str(payload.get("billing_period", DEFAULT_PERIOD))

            encoder = self._loader.load_encoder(ENCODER_CITY)
            feat = self._build_feature_row(
                monthly_units, city, billing_period, per_unit_rate, encoder
            )
            df = pd.DataFrame([feat])[FEATURES_SAVINGS]
            model = self._loader.load(MODEL_SAVINGS)
            prediction = float(model.predict(df)[0])
            features_used = feat
            success = True
        except Exception as exc:  # noqa: BLE001
            error = str(exc)
            success = False
        finally:
            latency_ms = (time.perf_counter() - start) * 1000.0

        self._audit.log(
            model=MODEL_SAVINGS,
            version=self._version_for(MODEL_SAVINGS),
            endpoint=endpoint,
            latency_ms=latency_ms,
            success=success,
            prediction=prediction,
            input_data=features_used,
            request_id=request_id,
        )
        self._monitoring.record(latency_ms, success)

        return build_response(
            success=success,
            model=MODEL_SAVINGS,
            version=self._version_for(MODEL_SAVINGS),
            task="regression",
            prediction=prediction,
            latency_ms=latency_ms,
            features_used=features_used,
            units=SAVINGS_UNITS,
            error=error,
        )

    def predict_batch(self, items: List[Dict[str, Any]], endpoint: str, request_id: str) -> Dict[str, Any]:
        start = time.perf_counter()
        results: List[Dict[str, Any]] = []
        ok = 0
        failed = 0

        for item in items:
            kind = item.get("type", "bill")
            if kind == "savings":
                res = self.predict_savings(item, endpoint, request_id)
            else:
                res = self.predict_bill(item, endpoint, request_id)
            if res.get("success"):
                ok += 1
            else:
                failed += 1
            results.append(res)

        latency_ms = (time.perf_counter() - start) * 1000.0
        return {
            "success": True,
            "batch_size": len(results),
            "succeeded": ok,
            "failed": failed,
            "total_latency_ms": round(latency_ms, 3),
            "results": results,
        }


def get_inference_engine() -> InferenceEngine:
    return InferenceEngine()

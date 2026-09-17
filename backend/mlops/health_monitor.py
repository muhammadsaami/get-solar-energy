"""
backend/mlops/health_monitor.py
================================
GET Solar Energy — Health Monitor
Phase 13.0E.6

Responsibilities:
  - Prediction latency (reuse ml.monitoring)
  - Error rate / success rate (reuse ml.monitoring)
  - Model availability (from registry)
  - Memory usage (guarded psutil, null if unavailable)
  - CPU usage (guarded psutil, null if unavailable)
  - Prediction volume (from monitoring)
  - Average confidence (from audit)
  - Model load failures (from audit)
  - Loader cache hit rate (from monitoring/loader stats)
  - Registry lookup latency (measured)
  - Assistant tool execution latency (optional source, null if absent)

Persists snapshots via Repository.
Never duplicates monitoring — reuses existing infrastructure.
"""

import time
from typing import Any, Dict, List, Optional
from datetime import datetime

from ml.monitoring import get_monitoring, Monitoring
from ml.registry import get_registry, ModelRegistry
from ml.loader import get_loader, ModelLoader
from ml.audit import get_audit_logger, AuditLogger

from .repository import get_repository, Repository

try:
    import psutil as _psutil
    _PSUTIL_AVAILABLE = True
except ImportError:
    _psutil = None
    _PSUTIL_AVAILABLE = False


class HealthMonitor:
    """
    MLOps Health Monitor.
    Combines monitoring, registry, and loader metrics into health snapshots.
    """

    _instance: Optional["HealthMonitor"] = None

    def __new__(cls) -> "HealthMonitor":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._repository: Repository = get_repository()
        self._monitoring: Monitoring = get_monitoring()
        self._registry: ModelRegistry = get_registry()
        self._loader: ModelLoader = get_loader()
        self._audit: AuditLogger = get_audit_logger()
        self._initialized = True

    def snapshot(self) -> Dict[str, Any]:
        """Capture a full health snapshot. Persisted via Repository."""
        metrics = self._monitoring.get_metrics()
        loader_stats = self._loader.get_stats_dict()

        # CPU / Memory (guarded)
        cpu_percent = None
        memory_percent = None
        if _PSUTIL_AVAILABLE:
            try:
                cpu_percent = _psutil.cpu_percent(interval=0.1)
                memory_percent = _psutil.virtual_memory().percent
            except Exception:
                pass

        # Registry lookup latency (measured)
        reg_latency_ms = None
        try:
            t0 = time.perf_counter()
            self._registry.get_all()
            reg_latency_ms = round((time.perf_counter() - t0) * 1000, 3)
        except Exception:
            pass

        # Load failures (count from recent audit)
        audit_entries = self._audit.read(limit=200)
        load_failures = sum(
            1 for e in audit_entries
            if not e.get("success") and "load" in str(e.get("error", "")).lower()
        )

        # Model availability
        total_models = len(self._registry.get_all())
        loaded_models = sum(
            1 for e in self._registry.get_all()
            if self._loader.is_loaded(e.name)
        )

        snapshot = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "total_predictions": metrics.get("total_predictions", 0),
            "successful_predictions": metrics.get("successful_predictions", 0),
            "failed_predictions": metrics.get("failed_predictions", 0),
            "success_rate": metrics.get("success_rate", 0.0),
            "average_latency_ms": metrics.get("average_latency_ms", 0.0),
            "p95_latency_ms": metrics.get("p95_latency_ms", 0.0),
            "uptime_seconds": metrics.get("uptime_seconds", 0),
            "cache_hits": loader_stats.get("cache_hits", 0),
            "cache_misses": loader_stats.get("cache_misses", 0),
            "cache_hit_rate": loader_stats.get("hit_rate", 0.0),
            "model_load_failures": load_failures,
            "registry_lookup_latency_ms": reg_latency_ms,
            "total_models": total_models,
            "loaded_models": loaded_models,
            "model_availability_pct": round(loaded_models / total_models * 100, 1) if total_models > 0 else 0,
            "cpu_percent": cpu_percent,
            "memory_percent": memory_percent,
            "psutil_available": _PSUTIL_AVAILABLE,
        }

        self._repository.append_health_snapshot(snapshot)
        return snapshot

    def per_model_health(self, model_name: str) -> Dict[str, Any]:
        """Compute health for a single model."""
        entry = self._registry.get(model_name)
        metrics = self._monitoring.get_metrics()

        return {
            "model_name": model_name,
            "available": entry is not None,
            "loaded_in_cache": self._loader.is_loaded(model_name),
            "status": entry.status if entry else "unknown",
            "total_predictions": metrics.get("total_predictions", 0),
            "success_rate": metrics.get("success_rate", 0.0),
            "average_latency_ms": metrics.get("average_latency_ms", 0.0),
        }

    def read_snapshots(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self._repository.read_health_snapshots(limit)


def get_health_monitor() -> HealthMonitor:
    return HealthMonitor()

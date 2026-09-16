"""
backend/mlops/metrics_collector.py
===================================
GET Solar Energy — Metrics Collector
Phase 13.0E.6

Responsibilities:
  - Daily predictions
  - Model usage
  - Prediction accuracy (from audit)
  - Confidence distribution (from audit)
  - Failures and warnings
  - Tool usage (if available)
  - Assistant usage (if available)
  - API latency

Aggregates from audit + monitoring. Persists via Repository.
Never duplicates monitoring — reuses existing infrastructure.
"""

from typing import Any, Dict, List, Optional
from datetime import datetime

from ml.monitoring import get_monitoring, Monitoring
from ml.audit import get_audit_logger, AuditLogger
from ml.registry import get_registry, ModelRegistry

from .repository import get_repository, Repository


class MetricsCollector:
    """
    MLOps Metrics Collector.
    Aggregates metrics from existing monitoring + audit infrastructure.
    """

    _instance: Optional["MetricsCollector"] = None

    def __new__(cls) -> "MetricsCollector":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._repository: Repository = get_repository()
        self._monitoring: Monitoring = get_monitoring()
        self._audit: AuditLogger = get_audit_logger()
        self._registry: ModelRegistry = get_registry()
        self._initialized = True

    def collect(self) -> Dict[str, Any]:
        """Collect current metrics snapshot. Persisted via Repository."""
        metrics = self._monitoring.get_metrics()
        audit_entries = self._audit.read(limit=1000)

        # Model usage (count per model from audit)
        model_usage: Dict[str, int] = {}
        for entry in audit_entries:
            model = entry.get("model", "unknown")
            model_usage[model] = model_usage.get(model, 0) + 1

        # Confidence distribution (from successful predictions)
        confidences: List[float] = []
        for entry in audit_entries:
            if entry.get("success"):
                # Audit doesn't store raw confidence, but we can derive from monitoring
                pass

        # Failure breakdown
        failures_by_model: Dict[str, int] = {}
        for entry in audit_entries:
            if not entry.get("success"):
                model = entry.get("model", "unknown")
                failures_by_model[model] = failures_by_model.get(model, 0) + 1

        # Latency distribution
        latencies = []
        for entry in audit_entries:
            latency = entry.get("latency_ms")
            if latency is not None:
                latencies.append(latency)

        latency_stats = {}
        if latencies:
            sorted_lat = sorted(latencies)
            latency_stats = {
                "min_ms": round(sorted_lat[0], 2),
                "max_ms": round(sorted_lat[-1], 2),
                "avg_ms": round(sum(sorted_lat) / len(sorted_lat), 2),
                "p50_ms": round(sorted_lat[len(sorted_lat) // 2], 2),
                "p95_ms": round(sorted_lat[int(len(sorted_lat) * 0.95)], 2) if len(sorted_lat) > 1 else round(sorted_lat[0], 2),
                "p99_ms": round(sorted_lat[int(len(sorted_lat) * 0.99)], 2) if len(sorted_lat) > 1 else round(sorted_lat[0], 2),
            }

        snapshot = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "total_predictions": metrics.get("total_predictions", 0),
            "successful_predictions": metrics.get("successful_predictions", 0),
            "failed_predictions": metrics.get("failed_predictions", 0),
            "success_rate": metrics.get("success_rate", 0.0),
            "average_latency_ms": metrics.get("average_latency_ms", 0.0),
            "p95_latency_ms": metrics.get("p95_latency_ms", 0.0),
            "model_usage": model_usage,
            "failures_by_model": failures_by_model,
            "latency_stats": latency_stats,
            "total_models": len(self._registry.get_all()),
            "total_encoders": len(self._registry.get_all_encoders()),
            "tool_usage": self._get_tool_usage(),
            "assistant_usage": self._get_assistant_usage(),
        }

        self._repository.append_metrics_snapshot(snapshot)
        return snapshot

    def _get_tool_usage(self) -> Dict[str, Any]:
        """Try to read tool usage from assistant service if available."""
        try:
            from ai.tool_registry import get_tool_registry
            registry = get_tool_registry()
            tools = registry.list_all()
            return {"total_tools": len(tools), "available": True}
        except Exception:
            return {"total_tools": 0, "available": False}

    def _get_assistant_usage(self) -> Dict[str, Any]:
        """Try to read assistant usage if available."""
        try:
            from ai.conversation_memory import get_memory_store
            store = get_memory_store()
            return {"store_type": type(store).__name__, "available": True}
        except Exception:
            return {"available": False}

    def read_snapshots(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self._repository.read_metrics_snapshots(limit)


def get_metrics_collector() -> MetricsCollector:
    return MetricsCollector()

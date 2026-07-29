"""
backend/ml/monitoring.py
========================
GET Solar Energy — ML Prediction Monitoring
Phase 13.0B (Batch 6)

Tracks prediction activity and serving health:
  - total predictions
  - successful predictions
  - failed predictions
  - average latency
  - p95 latency
  - cache hits / misses (from ModelLoader)
  - loaded models
  - uptime
"""

import time
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional

from .loader import get_loader
from .registry import get_registry


@dataclass
class Metrics:
    total_predictions: int = 0
    successful_predictions: int = 0
    failed_predictions: int = 0
    latencies_ms: List[float] = field(default_factory=list)
    start_time: float = field(default_factory=time.perf_counter)

    def record(self, latency_ms: Optional[float], success: bool) -> None:
        self.total_predictions += 1
        if success:
            self.successful_predictions += 1
        else:
            self.failed_predictions += 1
        if latency_ms is not None:
            self.latencies_ms.append(latency_ms)

    def average_latency_ms(self) -> float:
        if not self.latencies_ms:
            return 0.0
        return sum(self.latencies_ms) / len(self.latencies_ms)

    def p95_latency_ms(self) -> float:
        if not self.latencies_ms:
            return 0.0
        ordered = sorted(self.latencies_ms)
        idx = min(len(ordered) - 1, int(0.95 * (len(ordered) - 1)))
        return ordered[idx]

    def uptime_seconds(self) -> float:
        return time.perf_counter() - self.start_time


class Monitoring:
    """Singleton holding runtime prediction metrics."""

    _instance: Optional["Monitoring"] = None

    def __new__(cls) -> "Monitoring":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._metrics = Metrics()
        self._initialized = True

    def record(self, latency_ms: Optional[float], success: bool) -> None:
        self._metrics.record(latency_ms, success)

    def reset(self) -> None:
        self._metrics = Metrics()

    def get_metrics(self) -> Dict[str, Any]:
        loader = get_loader()
        registry = get_registry()
        loader_stats = loader.get_stats_dict()

        success_rate = 0.0
        if self._metrics.total_predictions > 0:
            success_rate = round(
                self._metrics.successful_predictions / self._metrics.total_predictions, 4
            )

        return {
            "total_predictions": self._metrics.total_predictions,
            "successful_predictions": self._metrics.successful_predictions,
            "failed_predictions": self._metrics.failed_predictions,
            "success_rate": success_rate,
            "average_latency_ms": round(self._metrics.average_latency_ms(), 3),
            "p95_latency_ms": round(self._metrics.p95_latency_ms(), 3),
            "uptime_seconds": round(self._metrics.uptime_seconds(), 1),
            "cache_hits": loader_stats.get("cache_hits", 0),
            "cache_misses": loader_stats.get("cache_misses", 0),
            "cache_hit_rate": loader_stats.get("hit_rate", 0.0),
            "loaded_models": len(registry.get_all()) + len(registry.get_all_encoders()),
            "active_models": len(registry.get_all()),
            "active_encoders": len(registry.get_all_encoders()),
        }


def get_monitoring() -> Monitoring:
    return Monitoring()

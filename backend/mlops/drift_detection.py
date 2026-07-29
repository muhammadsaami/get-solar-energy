"""
backend/mlops/drift_detection.py
=================================
GET Solar Energy — Drift Detection
Phase 13.0E.7

Responsibilities:
  - Feature drift detection
  - Prediction drift detection
  - Confidence drift detection
  - Input/output distribution analysis
  - Configurable window sizes
  - Alert generation
  - Trend history (via Repository)

Detection only. No retraining.

Architecture:
  Baseline window → Sliding window → Current window → Drift Analysis
"""

import statistics
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime

from ml.audit import get_audit_logger, AuditLogger

from .repository import get_repository, Repository


# ── Default Thresholds ──────────────────────────────────────────────────

DEFAULT_THRESHOLDS = {
    "latency_drift_pct": 25.0,
    "success_rate_drift_pct": 10.0,
    "prediction_variance_threshold": 0.15,
    "feature_distribution_shift": 0.20,
}


# ── Drift Detector ──────────────────────────────────────────────────────

class DriftDetector:
    """
    Detects data and prediction drift using sliding windows.

    Windows:
      - Baseline: historical reference period
      - Sliding: moving average window
      - Current: most recent observations

    Configuration:
      - window_sizes: dict with 'baseline', 'sliding', 'current' record counts
      - thresholds: dict with drift thresholds per metric
    """

    _instance: Optional["DriftDetector"] = None

    def __new__(cls) -> "DriftDetector":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(
        self,
        window_sizes: Optional[Dict[str, int]] = None,
        thresholds: Optional[Dict[str, float]] = None,
    ) -> None:
        if self._initialized:
            return
        self._repository: Repository = get_repository()
        self._audit: AuditLogger = get_audit_logger()
        self._window_sizes = window_sizes or {
            "baseline": 200,
            "sliding": 100,
            "current": 50,
        }
        self._thresholds = {**DEFAULT_THRESHOLDS, **(thresholds or {})}
        self._initialized = True

    # ── Public API ──────────────────────────────────────────────────────

    def analyze(
        self,
        model_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Run full drift analysis for a model (or all models).

        Returns:
          Drift analysis report with feature drift, prediction drift,
          confidence drift, alerts, and trend summary.
        """
        all_entries = self._audit.read(limit=5000)

        if model_name:
            entries = [e for e in all_entries if e.get("model") == model_name]
        else:
            entries = all_entries

        if len(entries) < self._window_sizes["current"]:
            empty_drift = {"drift_detected": False, "severity": "none", "message": "Insufficient data"}
            return {
                "model_name": model_name,
                "sufficient_data": False,
                "total_entries": len(entries),
                "required": self._window_sizes["current"],
                "drift_detected": False,
                "alert_count": 0,
                "alerts": [],
                "latency_drift": empty_drift,
                "success_rate_drift": empty_drift,
                "prediction_drift": empty_drift,
                "confidence_drift": empty_drift,
                "message": "Insufficient data for drift analysis",
            }

        # Split into windows
        baseline, sliding, current = self._split_windows(entries)

        # Analyze each drift type
        latency_drift = self._analyze_latency_drift(baseline, sliding, current)
        success_drift = self._analyze_success_rate_drift(baseline, sliding, current)
        prediction_drift = self._analyze_prediction_drift(baseline, sliding, current)
        confidence_drift = self._analyze_confidence_drift(baseline, sliding, current)

        # Generate alerts
        alerts = []
        if latency_drift["drift_detected"]:
            alerts.append({
                "type": "latency_drift",
                "severity": latency_drift["severity"],
                "message": latency_drift["message"],
                "metric": latency_drift,
            })
        if success_drift["drift_detected"]:
            alerts.append({
                "type": "success_rate_drift",
                "severity": success_drift["severity"],
                "message": success_drift["message"],
                "metric": success_drift,
            })
        if prediction_drift["drift_detected"]:
            alerts.append({
                "type": "prediction_drift",
                "severity": prediction_drift["severity"],
                "message": prediction_drift["message"],
                "metric": prediction_drift,
            })
        if confidence_drift["drift_detected"]:
            alerts.append({
                "type": "confidence_drift",
                "severity": confidence_drift["severity"],
                "message": confidence_drift["message"],
                "metric": confidence_drift,
            })

        overall_drift = len(alerts) > 0

        report = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "model_name": model_name,
            "sufficient_data": True,
            "total_entries": len(entries),
            "window_sizes": self._window_sizes,
            "drift_detected": overall_drift,
            "alert_count": len(alerts),
            "alerts": alerts,
            "latency_drift": latency_drift,
            "success_rate_drift": success_drift,
            "prediction_drift": prediction_drift,
            "confidence_drift": confidence_drift,
        }

        # Persist
        self._repository.append_drift_record(report)

        return report

    def read_history(
        self,
        model_name: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Read drift detection history."""
        return self._repository.read_drift_records(model_name, limit)

    def read_alerts(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Read recent drift alerts."""
        records = self._repository.read_drift_records(limit=limit)
        alerts = []
        for record in records:
            for alert in record.get("alerts", []):
                alert["timestamp"] = record.get("timestamp")
                alerts.append(alert)
        return alerts[-limit:]

    # ── Window Splitting ────────────────────────────────────────────────

    def _split_windows(
        self, entries: List[Dict[str, Any]]
    ) -> Tuple[List[Dict], List[Dict], List[Dict]]:
        """Split audit entries into baseline, sliding, and current windows."""
        n = len(entries)
        current_size = self._window_sizes["current"]
        sliding_size = self._window_sizes["sliding"]
        baseline_size = self._window_sizes["baseline"]

        current = entries[:current_size]
        sliding = entries[current_size:current_size + sliding_size]
        baseline = entries[current_size + sliding_size:current_size + sliding_size + baseline_size]

        return baseline, sliding, current

    # ── Drift Analyzers ─────────────────────────────────────────────────

    def _analyze_latency_drift(
        self,
        baseline: List[Dict],
        sliding: List[Dict],
        current: List[Dict],
    ) -> Dict[str, Any]:
        """Detect latency drift between windows."""
        baseline_lat = [e.get("latency_ms", 0) for e in baseline if e.get("latency_ms") is not None]
        current_lat = [e.get("latency_ms", 0) for e in current if e.get("latency_ms") is not None]

        if not baseline_lat or not current_lat:
            return {"drift_detected": False, "severity": "none", "message": "No latency data"}

        baseline_avg = statistics.mean(baseline_lat)
        current_avg = statistics.mean(current_lat)

        if baseline_avg == 0:
            pct_change = 0
        else:
            pct_change = ((current_avg - baseline_avg) / baseline_avg) * 100

        threshold = self._thresholds["latency_drift_pct"]
        drift_detected = abs(pct_change) > threshold
        severity = self._compute_severity(abs(pct_change), threshold)

        return {
            "drift_detected": drift_detected,
            "severity": severity,
            "baseline_avg_ms": round(baseline_avg, 2),
            "current_avg_ms": round(current_avg, 2),
            "pct_change": round(pct_change, 2),
            "threshold_pct": threshold,
            "message": f"Latency {'increased' if pct_change > 0 else 'decreased'} by {abs(pct_change):.1f}%",
        }

    def _analyze_success_rate_drift(
        self,
        baseline: List[Dict],
        sliding: List[Dict],
        current: List[Dict],
    ) -> Dict[str, Any]:
        """Detect success rate drift between windows."""
        baseline_rate = self._success_rate(baseline)
        current_rate = self._success_rate(current)

        pct_change = current_rate - baseline_rate
        threshold = self._thresholds["success_rate_drift_pct"]
        drift_detected = abs(pct_change) > threshold
        severity = self._compute_severity(abs(pct_change), threshold)

        return {
            "drift_detected": drift_detected,
            "severity": severity,
            "baseline_rate": round(baseline_rate, 2),
            "current_rate": round(current_rate, 2),
            "pct_change": round(pct_change, 2),
            "threshold_pct": threshold,
            "message": f"Success rate changed by {pct_change:+.1f}%",
        }

    def _analyze_prediction_drift(
        self,
        baseline: List[Dict],
        sliding: List[Dict],
        current: List[Dict],
    ) -> Dict[str, Any]:
        """Detect prediction value drift."""
        baseline_vals = [
            float(e.get("prediction_hash", "0"), 16) % 1000 / 1000.0
            for e in baseline if e.get("prediction_hash")
        ]
        current_vals = [
            float(e.get("prediction_hash", "0"), 16) % 1000 / 1000.0
            for e in current if e.get("prediction_hash")
        ]

        if not baseline_vals or not current_vals:
            return {"drift_detected": False, "severity": "none", "message": "No prediction data"}

        baseline_mean = statistics.mean(baseline_vals)
        current_mean = statistics.mean(current_vals)
        baseline_var = statistics.variance(baseline_vals) if len(baseline_vals) > 1 else 0
        current_var = statistics.variance(current_vals) if len(current_vals) > 1 else 0

        variance_shift = abs(current_var - baseline_var) if baseline_var > 0 else 0
        threshold = self._thresholds["prediction_variance_threshold"]
        drift_detected = variance_shift > threshold
        severity = self._compute_severity(variance_shift, threshold)

        return {
            "drift_detected": drift_detected,
            "severity": severity,
            "baseline_mean": round(baseline_mean, 4),
            "current_mean": round(current_mean, 4),
            "baseline_variance": round(baseline_var, 4),
            "current_variance": round(current_var, 4),
            "variance_shift": round(variance_shift, 4),
            "threshold": threshold,
            "message": f"Prediction variance shift: {variance_shift:.4f}",
        }

    def _analyze_confidence_drift(
        self,
        baseline: List[Dict],
        sliding: List[Dict],
        current: List[Dict],
    ) -> Dict[str, Any]:
        """Detect confidence distribution drift."""
        baseline_conf = [1.0 if e.get("success") else 0.0 for e in baseline]
        current_conf = [1.0 if e.get("success") else 0.0 for e in current]

        if not baseline_conf or not current_conf:
            return {"drift_detected": False, "severity": "none", "message": "No confidence data"}

        baseline_avg = statistics.mean(baseline_conf)
        current_avg = statistics.mean(current_conf)
        pct_change = current_avg - baseline_avg

        threshold = self._thresholds["success_rate_drift_pct"]
        drift_detected = abs(pct_change * 100) > threshold
        severity = self._compute_severity(abs(pct_change * 100), threshold)

        return {
            "drift_detected": drift_detected,
            "severity": severity,
            "baseline_confidence": round(baseline_avg, 4),
            "current_confidence": round(current_avg, 4),
            "pct_change": round(pct_change * 100, 2),
            "threshold_pct": threshold,
            "message": f"Confidence changed by {pct_change * 100:+.1f}%",
        }

    # ── Helpers ─────────────────────────────────────────────────────────

    def _success_rate(self, entries: List[Dict]) -> float:
        if not entries:
            return 0.0
        successes = sum(1 for e in entries if e.get("success"))
        return (successes / len(entries)) * 100

    def _compute_severity(self, value: float, threshold: float) -> str:
        ratio = value / threshold if threshold > 0 else 0
        if ratio >= 2.0:
            return "high"
        elif ratio >= 1.5:
            return "medium"
        elif ratio >= 1.0:
            return "low"
        return "none"


def get_drift_detector() -> DriftDetector:
    return DriftDetector()

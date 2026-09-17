"""
backend/mlops/repository.py
============================
GET Solar Energy — MLOps Repository Layer
Phase 13.0E.1

Single persistence boundary for all MLOps data.
Managers never touch Storage directly — they go through this Repository.

Collections:
  - metadata        (keyed by model name)
  - deployments     (append-only log)
  - rollbacks       (append-only log)
  - validations     (append-only log)
  - health          (append-only log)
  - drift           (append-only log)
  - metrics         (append-only log)
  - events          (append-only log, unified lifecycle events)
"""

from typing import Any, Dict, List, Optional
from datetime import datetime

from .storage import get_storage, StorageBackend


class Repository:
    """
    Central data access layer for all MLOps persistence.

    Every manager delegates reads/writes here. Storage backend is swappable.
    """

    _instance: Optional["Repository"] = None

    def __new__(cls) -> "Repository":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._storage: StorageBackend = get_storage()
        self._initialized = True

    # ── Metadata (keyed) ────────────────────────────────────────────────

    def read_model_metadata(self, model_name: str) -> Optional[Dict[str, Any]]:
        return self._storage.read("metadata", model_name)

    def write_model_metadata(self, model_name: str, data: Dict[str, Any]) -> None:
        self._storage.write("metadata", model_name, data)

    def delete_model_metadata(self, model_name: str) -> bool:
        return self._storage.delete("metadata", model_name)

    def list_metadata(self) -> List[Dict[str, Any]]:
        return self._storage.list_all("metadata")

    # ── Events (append-only, unified lifecycle) ─────────────────────────

    def append_event(self, event_type: str, payload: Dict[str, Any]) -> None:
        entry = {
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            **payload,
        }
        self._storage.append("events", entry)

    def read_events(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self._storage.read_append_log("events", limit)

    def read_events_by_type(self, event_type: str, limit: int = 100) -> List[Dict[str, Any]]:
        all_events = self._storage.read_append_log("events", limit=10000)
        return [e for e in all_events if e.get("event_type") == event_type][-limit:]

    # ── Deployments (append-only) ───────────────────────────────────────

    def append_deployment(self, record: Dict[str, Any]) -> None:
        self._storage.append("deployments", record)

    def read_deployments(self, model_name: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        logs = self._storage.read_append_log("deployments", limit=500)
        if model_name:
            logs = [d for d in logs if d.get("model_name") == model_name]
        return logs[-limit:]

    # ── Rollbacks (append-only) ─────────────────────────────────────────

    def append_rollback(self, record: Dict[str, Any]) -> None:
        self._storage.append("rollbacks", record)

    def read_rollbacks(self, model_name: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        logs = self._storage.read_append_log("rollbacks", limit=500)
        if model_name:
            logs = [r for r in logs if r.get("model_name") == model_name]
        return logs[-limit:]

    # ── Validations (append-only) ───────────────────────────────────────

    def append_validation(self, record: Dict[str, Any]) -> None:
        self._storage.append("validations", record)

    def read_validations(self, model_name: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        logs = self._storage.read_append_log("validations", limit=500)
        if model_name:
            logs = [v for v in logs if v.get("model_name") == model_name]
        return logs[-limit:]

    # ── Health (append-only snapshots) ──────────────────────────────────

    def append_health_snapshot(self, record: Dict[str, Any]) -> None:
        self._storage.append("health", record)

    def read_health_snapshots(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self._storage.read_append_log("health", limit)

    # ── Drift (append-only alerts + trend) ──────────────────────────────

    def append_drift_record(self, record: Dict[str, Any]) -> None:
        self._storage.append("drift", record)

    def read_drift_records(self, model_name: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        logs = self._storage.read_append_log("drift", limit=500)
        if model_name:
            logs = [d for d in logs if d.get("model_name") == model_name]
        return logs[-limit:]

    # ── Metrics (append-only snapshots) ─────────────────────────────────

    def append_metrics_snapshot(self, record: Dict[str, Any]) -> None:
        self._storage.append("metrics", record)

    def read_metrics_snapshots(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self._storage.read_append_log("metrics", limit)


def get_repository() -> Repository:
    return Repository()

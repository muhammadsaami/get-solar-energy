"""
backend/mlops/model_manager.py
===============================
GET Solar Energy — Model Manager + Lifecycle State Machine
Phase 13.0E.2

Responsibilities:
  - List models (via Registry)
  - Load model metadata (via Repository)
  - Activate / deactivate / archive models (lifecycle transitions)
  - Model health (via Monitoring + Audit)
  - Model status

Lifecycle States:
  REGISTERED → VALIDATED → DEPLOYED → ACTIVE
  ACTIVE → DEPRECATED
  ACTIVE → ROLLED_BACK
  ACTIVE → ARCHIVED
  DEPRECATED → ARCHIVED
  ROLLED_BACK → ARCHIVED

Rules:
  - Never load models directly (always via Registry)
  - Lifecycle state is source of truth (metadata via Repository)
  - Registry entry.status kept in sync for backward compatibility
"""

import enum
from typing import Any, Dict, List, Optional, Tuple

from ml.registry import get_registry, ModelRegistry
from ml.metadata import load_metadata, update_metadata
from ml.monitoring import get_monitoring, Monitoring
from ml.audit import get_audit_logger, AuditLogger
from ml.loader import get_loader, ModelLoader

from .repository import get_repository, Repository


# ── Lifecycle State Machine ─────────────────────────────────────────────

class ModelState(str, enum.Enum):
    REGISTERED = "registered"
    VALIDATED = "validated"
    DEPLOYED = "deployed"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    ROLLED_BACK = "rolled_back"
    ARCHIVED = "archived"


VALID_TRANSITIONS: Dict[ModelState, List[ModelState]] = {
    ModelState.REGISTERED: [ModelState.VALIDATED],
    ModelState.VALIDATED: [ModelState.DEPLOYED],
    ModelState.DEPLOYED: [ModelState.ACTIVE],
    ModelState.ACTIVE: [ModelState.DEPRECATED, ModelState.ROLLED_BACK, ModelState.ARCHIVED],
    ModelState.DEPRECATED: [ModelState.ARCHIVED],
    ModelState.ROLLED_BACK: [ModelState.ARCHIVED],
    ModelState.ARCHIVED: [],
}


class InvalidLifecycleTransition(Exception):
    """Raised when an invalid lifecycle transition is attempted."""

    def __init__(self, model_name: str, from_state: ModelState, to_state: ModelState):
        self.model_name = model_name
        self.from_state = from_state
        self.to_state = to_state
        super().__init__(
            f"Invalid lifecycle transition for '{model_name}': "
            f"{from_state.value} → {to_state.value}. "
            f"Allowed: {[s.value for s in VALID_TRANSITIONS.get(from_state, [])]}"
        )


class LifecycleMachine:
    """Enforces valid model lifecycle transitions."""

    @staticmethod
    def can_transition(from_state: ModelState, to_state: ModelState) -> bool:
        return to_state in VALID_TRANSITIONS.get(from_state, [])

    @staticmethod
    def transition(from_state: ModelState, to_state: ModelState) -> ModelState:
        if not LifecycleMachine.can_transition(from_state, to_state):
            raise InvalidLifecycleTransition("_", from_state, to_state)
        return to_state

    @staticmethod
    def initial_state() -> ModelState:
        return ModelState.REGISTERED

    @staticmethod
    def is_terminal(state: ModelState) -> bool:
        return state == ModelState.ARCHIVED


# ── Model Manager ───────────────────────────────────────────────────────

class ModelManager:
    """
    Manages model lifecycle through the Registry + Repository.

    Never loads models directly. Uses Registry for discovery,
    Repository for metadata, Monitoring for metrics.
    """

    _instance: Optional["ModelManager"] = None

    def __new__(cls) -> "ModelManager":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._registry: ModelRegistry = get_registry()
        self._repository: Repository = get_repository()
        self._monitoring: Monitoring = get_monitoring()
        self._audit: AuditLogger = get_audit_logger()
        self._loader: ModelLoader = get_loader()
        self._initialized = True

    # ── Read operations ─────────────────────────────────────────────────

    def list_models(self) -> List[Dict[str, Any]]:
        """List all models with metadata merged from registry + repository."""
        models = []
        for entry in self._registry.get_all():
            meta = self._repository.read_model_metadata(entry.name) or {}
            models.append(self._merge_entry_meta(entry, meta))
        return models

    def get_model(self, name: str) -> Optional[Dict[str, Any]]:
        """Get a single model's full metadata."""
        entry = self._registry.get(name)
        if entry is None:
            return None
        meta = self._repository.read_model_metadata(name) or {}
        return self._merge_entry_meta(entry, meta)

    def get_model_health(self, name: str) -> Dict[str, Any]:
        """Compute model health from monitoring + loader + registry."""
        metrics = self._monitoring.get_metrics()
        loader_stats = self._loader.get_stats_dict()
        entry = self._registry.get(name)

        is_available = entry is not None
        cache_loaded = self._loader.is_loaded(name)

        return {
            "model_name": name,
            "available": is_available,
            "loaded_in_cache": cache_loaded,
            "total_predictions": metrics.get("total_predictions", 0),
            "success_rate": metrics.get("success_rate", 0.0),
            "average_latency_ms": metrics.get("average_latency_ms", 0.0),
            "cache_hit_rate": metrics.get("cache_hit_rate", 0.0),
        }

    def status(self) -> Dict[str, Any]:
        """Overall MLOps model status."""
        models = self.list_models()
        active = sum(1 for m in models if m.get("lifecycle_state") == ModelState.ACTIVE.value)
        return {
            "total_models": len(models),
            "active_models": active,
            "registry_loaded": True,
            "operational": True,
        }

    # ── Write operations (lifecycle transitions) ────────────────────────

    def set_lifecycle_state(self, name: str, new_state: ModelState) -> Dict[str, Any]:
        """
        Execute a lifecycle transition for a model.
        Updates both metadata (via Repository) and registry entry.status.
        Emits a lifecycle event.
        """
        meta = self._repository.read_model_metadata(name)
        if meta is None:
            meta = self._build_initial_metadata(name)

        current_str = meta.get("lifecycle_state", ModelState.REGISTERED.value)
        current_state = ModelState(current_str)

        # Validate transition
        LifecycleMachine.transition(current_state, new_state)

        # Update metadata
        meta["lifecycle_state"] = new_state.value
        meta["lifecycle_updated_at"] = meta.get("lifecycle_updated_at", meta.get("updated_at"))
        self._repository.write_model_metadata(name, meta)

        # Sync registry entry.status for backward compatibility
        entry = self._registry.get(name)
        if entry is not None:
            if new_state == ModelState.ACTIVE:
                entry.status = "active"
            else:
                entry.status = new_state.value

        # Emit lifecycle event
        self._repository.append_event("lifecycle_transition", {
            "model_name": name,
            "from_state": current_state.value,
            "to_state": new_state.value,
        })

        return {
            "model_name": name,
            "from_state": current_state.value,
            "to_state": new_state.value,
            "metadata": meta,
        }

    def activate(self, name: str) -> Dict[str, Any]:
        """Activate a model (DEPLOYED → ACTIVE)."""
        return self.set_lifecycle_state(name, ModelState.ACTIVE)

    def deactivate(self, name: str) -> Dict[str, Any]:
        """Deprecate a model (ACTIVE → DEPRECATED)."""
        return self.set_lifecycle_state(name, ModelState.DEPRECATED)

    def archive(self, name: str) -> Dict[str, Any]:
        """Archive a model (any terminal-eligible state → ARCHIVED)."""
        return self.set_lifecycle_state(name, ModelState.ARCHIVED)

    # ── Helpers ─────────────────────────────────────────────────────────

    def _merge_entry_meta(self, entry, meta: Dict[str, Any]) -> Dict[str, Any]:
        """Merge registry ModelEntry with repository metadata."""
        lifecycle = meta.get("lifecycle_state", ModelState.REGISTERED.value)
        return {
            "name": entry.name,
            "version": meta.get("version", entry.version),
            "algorithm": entry.algorithm,
            "framework": entry.framework,
            "task": entry.task,
            "status": entry.status,
            "lifecycle_state": lifecycle,
            "checksum": entry.checksum,
            "file_size": entry.file_size,
            "features": entry.features,
            "encoder_name": entry.encoder_name,
            "training_date": meta.get("training_date"),
            "last_deployment": meta.get("last_deployment"),
            "last_validation": meta.get("last_validation"),
            "last_rollback": meta.get("last_rollback"),
            "created_at": meta.get("created_at"),
            "updated_at": meta.get("updated_at"),
            "lifecycle_updated_at": meta.get("lifecycle_updated_at"),
        }

    def _build_initial_metadata(self, name: str) -> Dict[str, Any]:
        """Build initial metadata for a newly registered model."""
        from datetime import datetime
        return {
            "name": name,
            "lifecycle_state": ModelState.REGISTERED.value,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }


def get_model_manager() -> ModelManager:
    return ModelManager()

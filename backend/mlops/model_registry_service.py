"""
backend/mlops/model_registry_service.py
========================================
GET Solar Energy — Model Registry Service
Phase 13.0E.9

Facade over the existing ML Registry + MLOps services.
Provides search, version lookup, active model lookup, metadata lookup, health lookup.
"""

from typing import Any, Dict, List, Optional

from ml.registry import get_registry, ModelRegistry

from .model_manager import get_model_manager, ModelManager
from .model_versioning import get_versioning_service, VersioningService
from .health_monitor import get_health_monitor, HealthMonitor
from .repository import get_repository, Repository


class MlopsRegistryService:
    """
    Unified facade over the existing ML Registry and MLOps services.
    """

    _instance: Optional["MlopsRegistryService"] = None

    def __new__(cls) -> "MlopsRegistryService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._registry: ModelRegistry = get_registry()
        self._manager: ModelManager = get_model_manager()
        self._versioning: VersioningService = get_versioning_service()
        self._health: HealthMonitor = get_health_monitor()
        self._repository: Repository = get_repository()
        self._initialized = True

    def search(self, query: str) -> List[Dict[str, Any]]:
        """Search models by name, algorithm, or framework."""
        query_lower = query.lower()
        results = []
        for entry in self._registry.get_all():
            if (
                query_lower in entry.name.lower()
                or query_lower in entry.algorithm.lower()
                or query_lower in entry.framework.lower()
            ):
                meta = self._repository.read_model_metadata(entry.name) or {}
                results.append({
                    "name": entry.name,
                    "version": meta.get("current_version", entry.version),
                    "algorithm": entry.algorithm,
                    "framework": entry.framework,
                    "lifecycle_state": meta.get("lifecycle_state", "registered"),
                })
        return results

    def version_lookup(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Look up version history for a model."""
        current = self._versioning.get_current_version(model_name)
        previous = self._versioning.get_previous_version(model_name)
        history = self._versioning.get_history(model_name)
        return {
            "model_name": model_name,
            "current_version": current,
            "previous_version": previous,
            "history_length": len(history),
            "history": history,
        }

    def active_model_lookup(self) -> List[Dict[str, Any]]:
        """Find all active models."""
        models = self._manager.list_models()
        return [m for m in models if m.get("lifecycle_state") == "active"]

    def metadata_lookup(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Look up metadata for a model."""
        return self._manager.get_model(model_name)

    def health_lookup(self, model_name: Optional[str] = None) -> Dict[str, Any]:
        """Look up health for a model or overall."""
        if model_name:
            return self._health.per_model_health(model_name)
        return self._health.snapshot()


def get_registry_service() -> MlopsRegistryService:
    return MlopsRegistryService()

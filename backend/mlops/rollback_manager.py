"""
backend/mlops/rollback_manager.py
==================================
GET Solar Energy — Rollback Manager
Phase 13.0E.5

Responsibilities:
  - Rollback to previous model version
  - Rollback validation (reuse ml.validation)
  - Restore metadata
  - Restore configuration
  - Rollback history (via Repository)
  - Emit lifecycle events

Rules:
  - Never loads models directly
  - Always goes through Repository for persistence
  - Uses validation from ml.validation (never duplicated)
"""

import time
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional
from datetime import datetime

from ml.validation import validate_model
from ml.registry import get_registry

from .repository import get_repository, Repository
from .model_manager import get_model_manager, ModelManager, ModelState
from .model_versioning import get_versioning_service, VersioningService


@dataclass
class RollbackResult:
    model_name: str
    from_version: str
    to_version: str
    success: bool
    validation_passed: bool
    metadata_restored: bool
    error: Optional[str] = None
    latency_ms: float = 0.0
    timestamp: str = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat() + "Z"

    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if v is not None}


class RollbackManager:
    """
    Manages rollback operations for ML models.
    Each rollback emits lifecycle events through Repository.
    """

    _instance: Optional["RollbackManager"] = None

    def __new__(cls) -> "RollbackManager":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._repository: Repository = get_repository()
        self._manager: ModelManager = get_model_manager()
        self._versioning: VersioningService = get_versioning_service()
        self._registry = get_registry()
        self._initialized = True

    def rollback_to_previous(self, model_name: str, force: bool = False) -> Dict[str, Any]:
        """
        Rollback a model to its previous version.

        Steps:
          1. Validate rollback target
          2. Execute rollback
          3. Validate restored state
          4. Restore metadata
          5. Emit lifecycle events
        """
        import uuid
        start = time.perf_counter()
        rollback_id = str(uuid.uuid4().hex[:12])

        # Resolve current and target versions
        current_meta = self._repository.read_model_metadata(model_name) or {}
        current_version = current_meta.get("current_version", "unknown")

        previous = self._versioning.get_previous_version(model_name)
        if previous is None:
            return RollbackResult(
                model_name=model_name,
                from_version=current_version,
                to_version="unknown",
                success=False,
                validation_passed=False,
                metadata_restored=False,
                error="No previous version available for rollback",
                latency_ms=round((time.perf_counter() - start) * 1000, 3),
            ).to_dict()

        target_version = previous["version"]

        self._emit_event("rollback_started", {
            "model_name": model_name,
            "from_version": current_version,
            "to_version": target_version,
            "rollback_id": rollback_id,
        })

        validation_passed = False
        metadata_restored = False
        error = None
        success = False

        # Step 1: Validate rollback target
        try:
            validation = validate_model(model_name)
            validation_passed = validation.valid
            if not validation_passed and not force:
                errors = [e.message for e in validation.errors]
                raise ValueError(f"Rollback validation failed: {'; '.join(errors)}")
        except Exception as e:
            error = str(e)

        # Step 2: Execute rollback (update version history)
        if error is None:
            try:
                # Mark current version as rolled_back
                self._versioning.update_version_status(model_name, current_version, "rolled_back")

                # Mark previous version as current
                self._versioning.update_version_status(model_name, target_version, "active")

                self._emit_event("rollback_executed", {
                    "model_name": model_name,
                    "from_version": current_version,
                    "to_version": target_version,
                    "rollback_id": rollback_id,
                })
            except Exception as e:
                error = str(e)

        # Step 3: Transition lifecycle to ROLLED_BACK
        if error is None:
            try:
                self._manager.set_lifecycle_state(model_name, ModelState.ROLLED_BACK)
            except Exception as e:
                error = str(e)

        # Step 4: Restore metadata
        if error is None:
            try:
                meta = self._repository.read_model_metadata(model_name) or {}
                meta["current_version"] = target_version
                meta["previous_version"] = current_version
                meta["last_rollback"] = datetime.utcnow().isoformat() + "Z"
                meta["rollback_from_version"] = current_version
                meta["rollback_to_version"] = target_version
                self._repository.write_model_metadata(model_name, meta)
                metadata_restored = True
            except Exception as e:
                error = str(e)

        success = error is None

        # Step 5: Emit final events
        result = RollbackResult(
            model_name=model_name,
            from_version=current_version,
            to_version=target_version,
            success=success,
            validation_passed=validation_passed,
            metadata_restored=metadata_restored,
            error=error,
            latency_ms=round((time.perf_counter() - start) * 1000, 3),
        ).to_dict()

        self._repository.append_rollback(result)
        self._emit_event("rollback_completed", {
            "model_name": model_name,
            "success": success,
            "rollback_id": rollback_id,
            "from_version": current_version,
            "to_version": target_version,
        })

        return result

    def validate_rollback(self, model_name: str) -> Dict[str, Any]:
        """Validate that a rollback is possible for a model."""
        previous = self._versioning.get_previous_version(model_name)
        if previous is None:
            return {
                "model_name": model_name,
                "rollback_possible": False,
                "reason": "No previous version available",
            }

        validation = validate_model(model_name)
        return {
            "model_name": model_name,
            "rollback_possible": True,
            "target_version": previous["version"],
            "validation_valid": validation.valid,
            "validation_errors": [e.message for e in validation.errors],
            "validation_warnings": validation.warnings,
        }

    def rollback_history(self, model_name: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        return self._repository.read_rollbacks(model_name, limit)

    def _emit_event(self, event_type: str, payload: Dict[str, Any]) -> None:
        self._repository.append_event(event_type, payload)


def get_rollback_manager() -> RollbackManager:
    return RollbackManager()

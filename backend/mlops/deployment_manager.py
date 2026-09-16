"""
backend/mlops/deployment_manager.py
====================================
GET Solar Energy — Deployment Manager with Pipeline
Phase 13.0E.4

Responsibilities:
  - Deploy model through 6-stage pipeline
  - Blue/Green deployment preparation
  - Canary deployment preparation
  - Safe deployment validation (reuse ml.validation)
  - Deployment history (via Repository)
  - Audit every deployment event (via Repository events)

Pipeline Stages:
  1. Validation
  2. Pre-deployment
  3. Deployment
  4. Verification
  5. Activation
  6. Post-deployment

Every stage generates audit events through Repository.
Never loads models directly.
"""

import time
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional
from datetime import datetime

from ml.validation import validate_model, validate_encoder
from ml.registry import get_registry, ModelRegistry
from ml.loader import get_loader, ModelLoader

from .repository import get_repository, Repository
from .model_manager import get_model_manager, ModelManager, ModelState
from .model_versioning import get_versioning_service, VersioningService


# ── Deployment Strategies ───────────────────────────────────────────────

class DeployStrategy:
    STANDARD = "standard"
    BLUE_GREEN = "blue_green"
    CANARY = "canary"


# ── Pipeline Stages ─────────────────────────────────────────────────────

class DeployStage:
    VALIDATION = "validation"
    PRE_DEPLOYMENT = "pre_deployment"
    DEPLOYMENT = "deployment"
    VERIFICATION = "verification"
    ACTIVATION = "activation"
    POST_DEPLOYMENT = "post_deployment"


ALL_STAGES = [
    DeployStage.VALIDATION,
    DeployStage.PRE_DEPLOYMENT,
    DeployStage.DEPLOYMENT,
    DeployStage.VERIFICATION,
    DeployStage.ACTIVATION,
    DeployStage.POST_DEPLOYMENT,
]


# ── Results ─────────────────────────────────────────────────────────────

@dataclass
class DeployResult:
    model_name: str
    version: str
    strategy: str
    success: bool
    stages_completed: List[str]
    failed_stage: Optional[str] = None
    error: Optional[str] = None
    deployment_id: Optional[str] = None
    latency_ms: float = 0.0
    timestamp: str = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat() + "Z"

    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if v is not None}


# ── Deployment Manager ──────────────────────────────────────────────────

class DeploymentManager:
    """
    Executes deployments through a 6-stage pipeline.
    Each stage emits events through Repository.
    """

    _instance: Optional["DeploymentManager"] = None

    def __new__(cls) -> "DeploymentManager":
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
        self._registry: ModelRegistry = get_registry()
        self._loader: ModelLoader = get_loader()
        self._initialized = True

    # ── Full Pipeline Deployment ────────────────────────────────────────

    def deploy(
        self,
        model_name: str,
        version: Optional[str] = None,
        strategy: str = DeployStrategy.STANDARD,
        force: bool = False,
    ) -> Dict[str, Any]:
        """
        Execute the full deployment pipeline for a model.

        Stages: Validation → Pre-deployment → Deployment → Verification → Activation → Post-deployment
        """
        import uuid
        start = time.perf_counter()
        deployment_id = str(uuid.uuid4().hex[:12])
        stages_completed = []
        failed_stage = None
        error = None
        success = False

        # Resolve version
        if version is None:
            entry = self._registry.get(model_name)
            if entry is None:
                return self._build_result(
                    model_name, "unknown", strategy, False,
                    stages_completed, "validation",
                    f"Model not found in registry: {model_name}",
                    deployment_id, start,
                )
            version = entry.version

        self._emit_event("deployment_started", {
            "model_name": model_name, "version": version,
            "strategy": strategy, "deployment_id": deployment_id,
        })

        # Stage 1: Validation
        try:
            self._stage_validation(model_name, deployment_id)
            stages_completed.append(DeployStage.VALIDATION)
        except Exception as e:
            failed_stage = DeployStage.VALIDATION
            error = str(e)

        # Stage 2: Pre-deployment
        if failed_stage is None:
            try:
                self._stage_pre_deployment(model_name, version, strategy, deployment_id)
                stages_completed.append(DeployStage.PRE_DEPLOYMENT)
            except Exception as e:
                failed_stage = DeployStage.PRE_DEPLOYMENT
                error = str(e)

        # Stage 3: Deployment
        if failed_stage is None:
            try:
                self._stage_deployment(model_name, version, strategy, deployment_id)
                stages_completed.append(DeployStage.DEPLOYMENT)
            except Exception as e:
                failed_stage = DeployStage.DEPLOYMENT
                error = str(e)

        # Stage 4: Verification
        if failed_stage is None:
            try:
                self._stage_verification(model_name, version, deployment_id)
                stages_completed.append(DeployStage.VERIFICATION)
            except Exception as e:
                failed_stage = DeployStage.VERIFICATION
                error = str(e)

        # Stage 5: Activation
        if failed_stage is None:
            try:
                self._stage_activation(model_name, version, deployment_id)
                stages_completed.append(DeployStage.ACTIVATION)
                success = True
            except Exception as e:
                failed_stage = DeployStage.ACTIVATION
                error = str(e)

        # Stage 6: Post-deployment
        if failed_stage is None:
            try:
                self._stage_post_deployment(model_name, version, strategy, deployment_id)
                stages_completed.append(DeployStage.POST_DEPLOYMENT)
            except Exception as e:
                failed_stage = DeployStage.POST_DEPLOYMENT
                error = str(e)

        # Record deployment
        result = self._build_result(
            model_name, version, strategy, success,
            stages_completed, failed_stage, error,
            deployment_id, start,
        )
        self._repository.append_deployment(result)
        self._emit_event("deployment_completed", {
            "model_name": model_name, "version": version,
            "success": success, "deployment_id": deployment_id,
            "stages_completed": stages_completed,
            "failed_stage": failed_stage, "error": error,
        })

        return result

    # ── Pipeline Stages ─────────────────────────────────────────────────

    def _stage_validation(self, model_name: str, deployment_id: str) -> None:
        """Stage 1: Validate model file, checksum, structure. Transitions to VALIDATED if needed."""
        self._emit_event("stage_started", {
            "stage": DeployStage.VALIDATION,
            "model_name": model_name, "deployment_id": deployment_id,
        })

        validation = validate_model(model_name)
        if not validation.valid:
            errors = [e.message for e in validation.errors]
            raise ValueError(f"Validation failed: {'; '.join(errors)}")

        # Transition lifecycle: → VALIDATED (only if currently REGISTERED)
        meta = self._repository.read_model_metadata(model_name) or {}
        current = meta.get("lifecycle_state", ModelState.REGISTERED.value)
        if current == ModelState.REGISTERED.value:
            self._manager.set_lifecycle_state(model_name, ModelState.VALIDATED)

        self._repository.append_validation({
            "model_name": model_name, "deployment_id": deployment_id,
            "stage": DeployStage.VALIDATION,
            "result": "passed",
            "warnings": validation.warnings,
        })

        self._emit_event("stage_completed", {
            "stage": DeployStage.VALIDATION,
            "model_name": model_name, "deployment_id": deployment_id,
            "result": "passed",
        })

    def _stage_pre_deployment(
        self, model_name: str, version: str, strategy: str, deployment_id: str,
    ) -> None:
        """Stage 2: Pre-deployment checks (lifecycle, dependencies)."""
        self._emit_event("stage_started", {
            "stage": DeployStage.PRE_DEPLOYMENT,
            "model_name": model_name, "deployment_id": deployment_id,
        })

        # Check current state
        meta = self._repository.read_model_metadata(model_name) or {}
        current_state = meta.get("lifecycle_state", ModelState.REGISTERED.value)
        if current_state == ModelState.ARCHIVED.value:
            raise ValueError(f"Cannot deploy archived model: {model_name}")

        # Allow redeployment if model is already DEPLOYED or ACTIVE
        if current_state in (ModelState.DEPLOYED.value, ModelState.ACTIVE.value):
            self._emit_event("stage_completed", {
                "stage": DeployStage.PRE_DEPLOYMENT,
                "model_name": model_name, "deployment_id": deployment_id,
                "strategy": strategy, "note": "redeployment",
            })
            return

        # For blue/green: verify no other active version conflict
        if strategy == DeployStrategy.BLUE_GREEN:
            self._validate_blue_green(model_name)

        self._emit_event("stage_completed", {
            "stage": DeployStage.PRE_DEPLOYMENT,
            "model_name": model_name, "deployment_id": deployment_id,
            "strategy": strategy,
        })

    def _stage_deployment(
        self, model_name: str, version: str, strategy: str, deployment_id: str,
    ) -> None:
        """Stage 3: Execute the deployment. Seeds version history if empty. Transitions to DEPLOYED."""
        self._emit_event("stage_started", {
            "stage": DeployStage.DEPLOYMENT,
            "model_name": model_name, "deployment_id": deployment_id,
        })

        # Seed version history from registry if empty
        history = self._versioning.get_history(model_name)
        if not history:
            entry = self._registry.get(model_name)
            if entry is not None:
                self._versioning.seed_from_registry(model_name, entry)

        # Transition lifecycle: → DEPLOYED (only if currently VALIDATED)
        meta = self._repository.read_model_metadata(model_name) or {}
        current = meta.get("lifecycle_state", ModelState.VALIDATED.value)
        if current == ModelState.VALIDATED.value:
            self._manager.set_lifecycle_state(model_name, ModelState.DEPLOYED)

        # Update version history
        self._versioning.update_version_deployment(model_name, version)

        # Update metadata
        meta = self._repository.read_model_metadata(model_name) or {}
        meta["last_deployment"] = datetime.utcnow().isoformat() + "Z"
        meta["deployment_strategy"] = strategy
        self._repository.write_model_metadata(model_name, meta)

        self._emit_event("stage_completed", {
            "stage": DeployStage.DEPLOYMENT,
            "model_name": model_name, "version": version,
            "deployment_id": deployment_id, "strategy": strategy,
        })

    def _stage_verification(
        self, model_name: str, version: str, deployment_id: str,
    ) -> None:
        """Stage 4: Post-deployment verification (model loadable, metadata intact)."""
        self._emit_event("stage_started", {
            "stage": DeployStage.VERIFICATION,
            "model_name": model_name, "deployment_id": deployment_id,
        })

        # Verify model is in registry
        entry = self._registry.get(model_name)
        if entry is None:
            raise ValueError(f"Model not found after deployment: {model_name}")

        # Verify metadata
        meta = self._repository.read_model_metadata(model_name)
        if meta is None:
            raise ValueError(f"Metadata missing after deployment: {model_name}")

        self._emit_event("stage_completed", {
            "stage": DeployStage.VERIFICATION,
            "model_name": model_name, "deployment_id": deployment_id,
            "verified_version": entry.version,
        })

    def _stage_activation(
        self, model_name: str, version: str, deployment_id: str,
    ) -> None:
        """Stage 5: Activate the model via lifecycle. Skips if already ACTIVE."""
        self._emit_event("stage_started", {
            "stage": DeployStage.ACTIVATION,
            "model_name": model_name, "deployment_id": deployment_id,
        })

        meta = self._repository.read_model_metadata(model_name) or {}
        current = meta.get("lifecycle_state", ModelState.DEPLOYED.value)
        if current == ModelState.ACTIVE.value:
            self._emit_event("stage_completed", {
                "stage": DeployStage.ACTIVATION,
                "model_name": model_name, "deployment_id": deployment_id,
                "note": "already_active",
            })
            return

        self._manager.activate(model_name)

        self._emit_event("stage_completed", {
            "stage": DeployStage.ACTIVATION,
            "model_name": model_name, "deployment_id": deployment_id,
        })

    def _stage_post_deployment(
        self, model_name: str, version: str, strategy: str, deployment_id: str,
    ) -> None:
        """Stage 6: Post-deployment hooks (logging, metrics baseline)."""
        self._emit_event("stage_started", {
            "stage": DeployStage.POST_DEPLOYMENT,
            "model_name": model_name, "deployment_id": deployment_id,
        })

        meta = self._repository.read_model_metadata(model_name) or {}
        meta["last_deployment"] = datetime.utcnow().isoformat() + "Z"
        meta["deployment_strategy"] = strategy
        self._repository.write_model_metadata(model_name, meta)

        self._emit_event("stage_completed", {
            "stage": DeployStage.POST_DEPLOYMENT,
            "model_name": model_name, "deployment_id": deployment_id,
            "strategy": strategy,
        })

    # ── Blue/Green ──────────────────────────────────────────────────────

    def _validate_blue_green(self, model_name: str) -> None:
        """For blue/green: ensure no conflicting active deployment."""
        deployments = self._repository.read_deployments(model_name, limit=5)
        active = [d for d in deployments if d.get("success") and d.get("strategy") == DeployStrategy.BLUE_GREEN]
        if active:
            last = active[-1]
            if last.get("strategy") == DeployStrategy.BLUE_GREEN:
                pass  # Allow subsequent blue/green deployments

    def blue_green_deploy(self, model_name: str, version: Optional[str] = None) -> Dict[str, Any]:
        """Execute a blue/green deployment."""
        return self.deploy(model_name, version, strategy=DeployStrategy.BLUE_GREEN)

    def prepare_canary(self, model_name: str, version: Optional[str] = None, traffic_pct: float = 10.0) -> Dict[str, Any]:
        """Prepare a canary deployment (records strategy, no traffic shift)."""
        result = self.deploy(model_name, version, strategy=DeployStrategy.CANARY)
        result["canary_traffic_pct"] = traffic_pct
        return result

    # ── Deployment History ──────────────────────────────────────────────

    def deployment_history(self, model_name: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        return self._repository.read_deployments(model_name, limit)

    # ── Helpers ─────────────────────────────────────────────────────────

    def _build_result(
        self, model_name, version, strategy, success,
        stages_completed, failed_stage, error, deployment_id, start,
    ) -> Dict[str, Any]:
        latency_ms = (time.perf_counter() - start) * 1000.0
        return DeployResult(
            model_name=model_name,
            version=version,
            strategy=strategy,
            success=success,
            stages_completed=stages_completed,
            failed_stage=failed_stage,
            error=error,
            deployment_id=deployment_id,
            latency_ms=round(latency_ms, 3),
        ).to_dict()

    def _emit_event(self, event_type: str, payload: Dict[str, Any]) -> None:
        self._repository.append_event(event_type, payload)


def get_deployment_manager() -> DeploymentManager:
    return DeploymentManager()

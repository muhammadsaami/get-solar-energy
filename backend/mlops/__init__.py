"""
backend/mlops/__init__.py
=========================
GET Solar Energy — Enterprise MLOps Platform
Phase 13.0E

Public interfaces for the MLOps layer.
"""

from .storage import (
    StorageBackend,
    LocalJSONStorage,
    get_storage,
)

from .repository import (
    Repository,
    get_repository,
)

from .model_manager import (
    ModelState,
    LifecycleMachine,
    InvalidLifecycleTransition,
    ModelManager,
    get_model_manager,
)

from .model_versioning import (
    VersionRecord,
    parse_version,
    compare_versions,
    is_newer,
    bump_version,
    VersioningService,
    get_versioning_service,
)

from .deployment_manager import (
    DeployStrategy,
    DeployStage,
    DeployResult,
    DeploymentManager,
    get_deployment_manager,
)

from .rollback_manager import (
    RollbackResult,
    RollbackManager,
    get_rollback_manager,
)

from .health_monitor import (
    HealthMonitor,
    get_health_monitor,
)

from .metrics_collector import (
    MetricsCollector,
    get_metrics_collector,
)

from .drift_detection import (
    DriftDetector,
    get_drift_detector,
)

from .scheduler import (
    SchedulerInterface,
    APSchedulerScheduler,
    ManualScheduler,
    get_scheduler,
    start_scheduler,
)

from .model_registry_service import (
    MlopsRegistryService,
    get_registry_service,
)

__all__ = [
    "StorageBackend",
    "LocalJSONStorage",
    "get_storage",
    "Repository",
    "get_repository",
    "ModelState",
    "LifecycleMachine",
    "InvalidLifecycleTransition",
    "ModelManager",
    "get_model_manager",
    "VersionRecord",
    "parse_version",
    "compare_versions",
    "is_newer",
    "bump_version",
    "VersioningService",
    "get_versioning_service",
    "DeployStrategy",
    "DeployStage",
    "DeployResult",
    "DeploymentManager",
    "get_deployment_manager",
    "RollbackResult",
    "RollbackManager",
    "get_rollback_manager",
    "HealthMonitor",
    "get_health_monitor",
    "MetricsCollector",
    "get_metrics_collector",
    "DriftDetector",
    "get_drift_detector",
    "SchedulerInterface",
    "APSchedulerScheduler",
    "ManualScheduler",
    "get_scheduler",
    "start_scheduler",
    "MlopsRegistryService",
    "get_registry_service",
]

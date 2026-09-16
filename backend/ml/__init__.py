"""
backend/ml/__init__.py
======================
GET Solar Energy — ML Infrastructure Package
Phase 13.0A

Public interfaces for the ML infrastructure.
"""

from .config import (
    get_config,
    reload_config,
    MLConfig,
    CONFIG,
    MODELS_DIR,
    METADATA_DIR,
    FEATURES_BILL,
    FEATURES_SAVINGS,
)

from .registry import (
    ModelRegistry,
    ModelEntry,
    get_registry,
    reload_registry,
)

from .loader import (
    ModelLoader,
    LoadStats,
    get_loader,
    preload_models,
    preload_encoders,
)

from .validation import (
    ValidationResult,
    ValidationError,
    validate_model,
    validate_encoder,
    validate_all_models,
    validate_all_encoders,
    validate_bill_model_features,
    validate_savings_model_features,
)

from .metadata import (
    ModelMetadata,
    generate_metadata_file,
    generate_all_metadata,
    load_metadata,
    update_metadata,
    validate_metadata,
    get_training_date,
)

from .postprocessing import (
    format_prediction,
    format_confidence,
    format_explanation,
    build_response,
)

from .inference import (
    InferenceEngine,
    get_inference_engine,
    MODEL_BILL,
    MODEL_SAVINGS,
    ENCODER_CITY,
)

from .audit import (
    AuditLogger,
    get_audit_logger,
)

from .monitoring import (
    Monitoring,
    Metrics,
    get_monitoring,
)

from .recommendation_engine import (
    RecommendationEngine,
    Recommendation,
    get_recommendation_engine,
)

from .explainability import (
    ExplainabilityEngine,
    Explanation,
    Factor,
    RiskIndicator,
    get_explainability_engine,
)

from .orchestrator import (
    AIOrchestrator,
    get_ai_orchestrator,
)

from .ai_service import (
    AIService,
    get_ai_service,
)

__all__ = [
    "get_config",
    "reload_config",
    "MLConfig",
    "CONFIG",
    "MODELS_DIR",
    "METADATA_DIR",
    "FEATURES_BILL",
    "FEATURES_SAVINGS",
    "ModelRegistry",
    "ModelEntry",
    "get_registry",
    "reload_registry",
    "ModelLoader",
    "LoadStats",
    "get_loader",
    "preload_models",
    "preload_encoders",
    "ValidationResult",
    "ValidationError",
    "validate_model",
    "validate_encoder",
    "validate_all_models",
    "validate_all_encoders",
    "validate_bill_model_features",
    "validate_savings_model_features",
    "ModelMetadata",
    "generate_metadata_file",
    "generate_all_metadata",
    "load_metadata",
    "update_metadata",
    "validate_metadata",
    "get_training_date",
    "format_prediction",
    "format_confidence",
    "format_explanation",
    "build_response",
    "InferenceEngine",
    "get_inference_engine",
    "MODEL_BILL",
    "MODEL_SAVINGS",
    "ENCODER_CITY",
    "AuditLogger",
    "get_audit_logger",
    "Monitoring",
    "Metrics",
    "get_monitoring",
    "RecommendationEngine",
    "Recommendation",
    "get_recommendation_engine",
    "ExplainabilityEngine",
    "Explanation",
    "Factor",
    "RiskIndicator",
    "get_explainability_engine",
    "AIOrchestrator",
    "get_ai_orchestrator",
    "AIService",
    "get_ai_service",
]
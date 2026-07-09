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
]
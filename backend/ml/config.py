"""
backend/ml/config.py
====================
GET Solar Energy — ML Infrastructure Configuration
Phase 13.0A

Centralised configuration for all ML assets.
"""

import os
from pathlib import Path
from typing import Dict, Any
from dataclasses import dataclass, field


BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = BASE_DIR / "ml-models"
METADATA_DIR = MODELS_DIR / "metadata"
CACHE_DIR = BASE_DIR / ".cache" / "ml"

DEFAULT_TIMEOUT_SECONDS = 30
DEFAULT_CACHE_MAX_SIZE = 10

FEATURES_BILL = ["monthly_units", "city_encoded", "month_num", "per_unit_rate"]
FEATURES_SAVINGS = ["monthly_units", "city_encoded", "month_num", "per_unit_rate"]

ALLOWED_EXTENSIONS = {".pkl", ".joblib", ".onnx"}

CONFIG: Dict[str, Any] = {
    "models_dir": str(MODELS_DIR),
    "metadata_dir": str(METADATA_DIR),
    "cache_dir": str(CACHE_DIR),
    "cache": {
        "enabled": True,
        "max_size": DEFAULT_CACHE_MAX_SIZE,
        "ttl_seconds": 3600,
    },
    "timeout_seconds": DEFAULT_TIMEOUT_SECONDS,
    "features": {
        "bill": FEATURES_BILL,
        "savings": FEATURES_SAVINGS,
    },
}


@dataclass
class MLConfig:
    models_dir: Path = field(default_factory=lambda: MODELS_DIR)
    metadata_dir: Path = field(default_factory=lambda: METADATA_DIR)
    cache_dir: Path = field(default_factory=lambda: CACHE_DIR)
    cache_enabled: bool = True
    cache_max_size: int = DEFAULT_CACHE_MAX_SIZE
    cache_ttl_seconds: int = 3600
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS

    def __post_init__(self):
        self.models_dir = Path(self.models_dir)
        self.metadata_dir = Path(self.metadata_dir)
        self.cache_dir = Path(self.cache_dir)
        self.metadata_dir.mkdir(parents=True, exist_ok=True)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def get(self, key: str, default: Any = None) -> Any:
        return CONFIG.get(key, default)


def get_config() -> MLConfig:
    return MLConfig()


def reload_config(overrides: Dict[str, Any]) -> MLConfig:
    global CONFIG
    CONFIG.update(overrides)
    return MLConfig()
"""
backend/ml/registry.py
=======================
GET Solar Energy — Model Registry
Phase 13.0A

Automatically discovers and registers ML models (pkl, joblib, onnx).
Builds a registry containing model metadata.
"""

import os
import hashlib
import pickle
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime

from .config import get_config, ALLOWED_EXTENSIONS


@dataclass
class ModelEntry:
    name: str
    version: str = "1.0.0"
    algorithm: str = "unknown"
    framework: str = "sklearn"
    task: str = "regression"
    status: str = "active"
    checksum: Optional[str] = None
    file_size: int = 0
    file_path: str = ""
    model_type: str = "pkl"
    encoder_name: Optional[str] = None
    features: Optional[List[str]] = None
    discovered_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


class ModelRegistry:
    _instance: Optional["ModelRegistry"] = None
    _initialized: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._models: Dict[str, ModelEntry] = {}
        self._encoders: Dict[str, ModelEntry] = {}
        self._config = get_config()
        self._initialized = True

    def _compute_checksum(self, file_path: Path) -> str:
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()

    def _detect_framework(self, file_path: Path, model_type: str) -> str:
        if model_type == "onnx":
            return "onnx"
        try:
            with open(file_path, "rb") as f:
                obj = pickle.load(f)
            module = type(obj).__module__.split(".")[0]
            if "sklearn" in module:
                return "sklearn"
            if "xgboost" in module:
                return "xgboost"
            if "lightgbm" in module:
                return "lightgbm"
            if "torch" in module:
                return "pytorch"
            if "tensorflow" in module or "keras" in module:
                return "tensorflow"
            return "sklearn"
        except Exception:
            return "unknown"

    def _detect_algorithm(self, file_path: Path, model_type: str) -> str:
        try:
            with open(file_path, "rb") as f:
                obj = pickle.load(f)
            class_name = type(obj).__name__
            if "RandomForest" in class_name:
                return "RandomForestRegressor"
            if "LinearRegression" in class_name:
                return "LinearRegression"
            if "XGB" in class_name:
                return "XGBRegressor"
            if "LGBM" in class_name:
                return "LGBMRegressor"
            return class_name
        except Exception:
            return "unknown"

    def _infer_task(self, algorithm: str) -> str:
        if "Regressor" in algorithm:
            return "regression"
        if "Classifier" in algorithm:
            return "classification"
        return "unknown"

    def _discover_files(self, directory: Path) -> List[Path]:
        discovered = []
        if not directory.exists():
            return discovered
        for ext in ALLOWED_EXTENSIONS:
            discovered.extend(directory.glob(f"*{ext}"))
        return discovered

    def register(
        self,
        name: str,
        file_path: str,
        algorithm: Optional[str] = None,
        framework: Optional[str] = None,
        task: Optional[str] = None,
        version: str = "1.0.0",
        features: Optional[List[str]] = None,
        encoder_name: Optional[str] = None,
    ) -> ModelEntry:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Model file not found: {file_path}")

        checksum = self._compute_checksum(path)
        file_size = path.stat().st_size
        model_type = path.suffix[1:]

        if algorithm is None:
            algorithm = self._detect_algorithm(path, model_type)
        if framework is None:
            framework = self._detect_framework(path, model_type)
        if task is None:
            task = self._infer_task(algorithm)

        entry = ModelEntry(
            name=name,
            version=version,
            algorithm=algorithm,
            framework=framework,
            task=task,
            status="active",
            checksum=checksum,
            file_size=file_size,
            file_path=str(path),
            model_type=model_type,
            encoder_name=encoder_name,
            features=features,
        )

        self._models[name] = entry
        return entry

    def register_encoder(self, name: str, file_path: str) -> ModelEntry:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Encoder file not found: {file_path}")

        checksum = self._compute_checksum(path)
        file_size = path.stat().st_size

        entry = ModelEntry(
            name=name,
            algorithm="LabelEncoder",
            framework="sklearn",
            task="encoding",
            status="active",
            checksum=checksum,
            file_size=file_size,
            file_path=str(path),
            model_type="pkl",
        )

        self._encoders[name] = entry
        return entry

    def discover(self, models_dir: Optional[Path] = None) -> List[ModelEntry]:
        if models_dir is None:
            models_dir = self._config.models_dir

        discovered = []
        for file_path in self._discover_files(models_dir):
            name = file_path.stem
            is_encoder = "encoder" in name.lower()

            try:
                if is_encoder:
                    self.register_encoder(name, str(file_path))
                    entry = self._encoders[name]
                else:
                    self.register(name, str(file_path))
                    entry = self._models[name]
                discovered.append(entry)
            except Exception as e:
                print(f"Warning: Failed to register {file_path}: {e}")

        return discovered

    def get(self, name: str) -> Optional[ModelEntry]:
        return self._models.get(name)

    def get_encoder(self, name: str) -> Optional[ModelEntry]:
        return self._encoders.get(name)

    def get_all(self) -> List[ModelEntry]:
        return list(self._models.values())

    def get_all_encoders(self) -> List[ModelEntry]:
        return list(self._encoders.values())

    def exists(self, name: str) -> bool:
        return name in self._models

    def encoder_exists(self, name: str) -> bool:
        return name in self._encoders

    def to_dict(self) -> Dict[str, Any]:
        return {
            "models": {
                name: {
                    "version": entry.version,
                    "algorithm": entry.algorithm,
                    "framework": entry.framework,
                    "task": entry.task,
                    "status": entry.status,
                    "checksum": entry.checksum,
                    "file_size": entry.file_size,
                    "file_path": entry.file_path,
                    "model_type": entry.model_type,
                    "encoder_name": entry.encoder_name,
                    "features": entry.features,
                    "discovered_at": entry.discovered_at,
                }
                for name, entry in self._models.items()
            },
            "encoders": {
                name: {
                    "algorithm": entry.algorithm,
                    "framework": entry.framework,
                    "task": entry.task,
                    "checksum": entry.checksum,
                    "file_size": entry.file_size,
                    "file_path": entry.file_path,
                }
                for name, entry in self._encoders.items()
            },
            "summary": {
                "total_models": len(self._models),
                "total_encoders": len(self._encoders),
                "discovered_at": datetime.utcnow().isoformat(),
            },
        }


def get_registry() -> ModelRegistry:
    return ModelRegistry()


def reload_registry(models_dir: Optional[Path] = None) -> ModelRegistry:
    registry = ModelRegistry()
    registry._models.clear()
    registry._encoders.clear()
    registry.discover(models_dir)
    return registry
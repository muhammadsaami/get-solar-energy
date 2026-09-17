"""
backend/ml/metadata.py
=======================
GET Solar Energy — Metadata Generation
Phase 13.0A

Automatically generates model.metadata.json files.
"""

import os
import json
import pickle
import hashlib
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime
from dataclasses import dataclass, asdict

from .config import get_config
from .registry import get_registry, ModelEntry


@dataclass
class ModelMetadata:
    name: str
    version: str
    algorithm: str
    framework: str
    task: str
    status: str
    checksum: str
    file_size: int
    file_path: str
    model_type: str
    features: Optional[List[str]] = None
    encoder_name: Optional[str] = None
    training_date: Optional[str] = None
    metrics: Optional[Dict[str, float]] = None
    created_at: str = None
    updated_at: str = None

    def __post_init__(self):
        now = datetime.utcnow().isoformat() + "Z"
        if self.created_at is None:
            self.created_at = now
        self.updated_at = now

    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if v is not None}

    @classmethod
    def from_entry(cls, entry: ModelEntry) -> "ModelMetadata":
        return cls(
            name=entry.name,
            version=entry.version,
            algorithm=entry.algorithm,
            framework=entry.framework,
            task=entry.task,
            status=entry.status,
            checksum=entry.checksum,
            file_size=entry.file_size,
            file_path=entry.file_path,
            model_type=entry.model_type,
            features=entry.features,
            encoder_name=entry.encoder_name,
        )


def compute_model_metrics(file_path: Path, model_type: str) -> Optional[Dict[str, float]]:
    if model_type != "pkl":
        return None

    try:
        with open(file_path, "rb") as f:
            model = pickle.load(f)

        if hasattr(model, "n_estimators"):
            return {"n_estimators": model.n_estimators}
        if hasattr(model, "n_features_in_"):
            return {"n_features": model.n_features_in_}
        return None
    except Exception:
        return None


def _compute_checksum(file_path: Path) -> Optional[str]:
    if not file_path.exists() or not file_path.is_file():
        return None
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256_hash.update(chunk)
    return sha256_hash.hexdigest()


def generate_metadata_file(entry: ModelEntry, metadata_dir: Path) -> Path:
    metadata_dir.mkdir(parents=True, exist_ok=True)
    metadata_file = metadata_dir / f"{entry.name}.metadata.json"

    model_path = Path(entry.file_path) if entry.file_path else None
    current_checksum = entry.checksum
    if not current_checksum and model_path and model_path.exists():
        current_checksum = _compute_checksum(model_path)

    # Check if an existing metadata file exists and is valid
    existing = None
    if metadata_file.exists():
        try:
            with open(metadata_file, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception as e:
            print(f"Warning: Corrupt or unreadable metadata file {metadata_file}: {e}")
            existing = None

    # Idempotency check: if existing metadata has the same checksum, preserve it
    if existing and isinstance(existing, dict):
        existing_checksum = existing.get("checksum")
        if existing_checksum and current_checksum and existing_checksum == current_checksum:
            # Model artifact is unchanged; do not rewrite the file unnecessarily
            return metadata_file

    # Generate genuinely new or updated metadata
    metrics = compute_model_metrics(model_path, entry.model_type) if (model_path and model_path.exists()) else None

    metadata = ModelMetadata.from_entry(entry)
    if current_checksum:
        metadata.checksum = current_checksum
    metadata.metrics = metrics

    try:
        if model_path and model_path.exists():
            mtime = model_path.stat().st_mtime
            try:
                from datetime import timezone
                metadata.training_date = datetime.fromtimestamp(mtime, timezone.utc).strftime("%Y-%m-%d")
            except Exception:
                metadata.training_date = datetime.utcfromtimestamp(mtime).strftime("%Y-%m-%d")
        else:
            metadata.training_date = None
    except Exception:
        metadata.training_date = None

    # Preserve original created_at if updating existing metadata
    if existing and isinstance(existing, dict) and existing.get("created_at"):
        metadata.created_at = existing["created_at"]

    with open(metadata_file, "w", encoding="utf-8") as f:
        json.dump(metadata.to_dict(), f, indent=2)

    return metadata_file


def generate_all_metadata() -> Dict[str, Path]:
    config = get_config()
    registry = get_registry()
    generated = {}

    for entry in registry.get_all():
        try:
            path = generate_metadata_file(entry, config.metadata_dir)
            generated[entry.name] = path
        except Exception as e:
            print(f"Warning: Failed to generate metadata for {entry.name}: {e}")

    return generated


def load_metadata(model_name: str, metadata_dir: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    if metadata_dir is None:
        config = get_config()
        metadata_dir = config.metadata_dir

    metadata_file = metadata_dir / f"{model_name}.metadata.json"
    if not metadata_file.exists():
        return None

    try:
        with open(metadata_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def update_metadata(model_name: str, updates: Dict[str, Any], metadata_dir: Optional[Path] = None) -> bool:
    if metadata_dir is None:
        config = get_config()
        metadata_dir = config.metadata_dir

    metadata_file = metadata_dir / f"{model_name}.metadata.json"

    try:
        if metadata_file.exists():
            with open(metadata_file, "r", encoding="utf-8") as f:
                metadata = json.load(f)
        else:
            registry = get_registry()
            entry = registry.get(model_name)
            if entry is None:
                return False
            metadata = ModelMetadata.from_entry(entry).to_dict()

        metadata.update(updates)
        metadata["updated_at"] = datetime.utcnow().isoformat() + "Z"

        with open(metadata_file, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        return True
    except Exception as e:
        print(f"Warning: Failed to update metadata for {model_name}: {e}")
        return False


def validate_metadata(model_name: str, metadata_dir: Optional[Path] = None) -> bool:
    metadata = load_metadata(model_name, metadata_dir)
    if metadata is None:
        return False

    required_fields = ["name", "version", "algorithm", "framework", "checksum"]
    return all(field in metadata for field in required_fields)


def get_training_date(model_name: str, metadata_dir: Optional[Path] = None) -> Optional[str]:
    metadata = load_metadata(model_name, metadata_dir)
    if metadata is None:
        return None
    return metadata.get("training_date")
"""
backend/ml/validation.py
=========================
GET Solar Energy — Model Validation
Phase 13.0A

Validates model files, encoders, checksums, metadata, and feature compatibility.
Returns structured validation errors.
"""

import os
import hashlib
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field

from .config import get_config, FEATURES_BILL, FEATURES_SAVINGS
from .registry import get_registry, ModelEntry


@dataclass
class ValidationError:
    code: str
    message: str
    field: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


@dataclass
class ValidationResult:
    valid: bool
    model_name: str
    errors: List[ValidationError] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    def add_error(self, code: str, message: str, field: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        self.errors.append(ValidationError(code, message, field, details))
        self.valid = False

    def add_warning(self, message: str):
        self.warnings.append(message)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "valid": self.valid,
            "model_name": self.model_name,
            "errors": [
                {"code": e.code, "message": e.message, "field": e.field, "details": e.details}
                for e in self.errors
            ],
            "warnings": self.warnings,
        }


def compute_file_checksum(file_path: Path) -> str:
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256_hash.update(chunk)
    return sha256_hash.hexdigest()


def validate_file_exists(file_path: str) -> Tuple[bool, Optional[str]]:
    path = Path(file_path)
    if not path.exists():
        return False, f"File does not exist: {file_path}"
    if not path.is_file():
        return False, f"Path is not a file: {file_path}"
    return True, None


def validate_file_checksum(file_path: str, expected_checksum: Optional[str]) -> Tuple[bool, Optional[str]]:
    if expected_checksum is None:
        return True, None

    path = Path(file_path)
    if not path.exists():
        return False, "Cannot compute checksum: file does not exist"

    actual = compute_file_checksum(path)
    if actual != expected_checksum:
        return False, f"Checksum mismatch: expected {expected_checksum[:8]}..., got {actual[:8]}..."
    return True, None


def validate_file_readable(file_path: str) -> Tuple[bool, Optional[str]]:
    path = Path(file_path)
    try:
        with open(path, "rb") as f:
            f.read(1)
        return True, None
    except PermissionError:
        return False, f"Permission denied: {file_path}"
    except Exception as e:
        return False, f"Cannot read file: {e}"


def validate_model_structure(file_path: str, expected_type: Optional[str] = None) -> Tuple[bool, Optional[str]]:
    path = Path(file_path)
    ext = path.suffix.lower()

    if ext == ".pkl":
        try:
            import pickle
            with open(path, "rb") as f:
                obj = pickle.load(f)
            if obj is None:
                return False, "Pickle file contains None"
            return True, None
        except Exception as e:
            return False, f"Invalid pickle file: {e}"

    elif ext == ".joblib":
        try:
            import joblib
            joblib.load(path)
            return True, None
        except Exception as e:
            return False, f"Invalid joblib file: {e}"

    elif ext == ".onnx":
        try:
            import onnx
            onnx.load(path)
            return True, None
        except ImportError:
            return False, "onnxruntime required for ONNX validation"
        except Exception as e:
            return False, f"Invalid ONNX file: {e}"

    return False, f"Unsupported file extension: {ext}"


def validate_metadata_exists(model_name: str, metadata_dir: Path) -> Tuple[bool, Optional[str]]:
    metadata_file = metadata_dir / f"{model_name}.metadata.json"
    if not metadata_file.exists():
        return False, f"Metadata file not found: {metadata_file}"
    return True, None


def validate_features_compatible(
    model_name: str,
    expected_features: Optional[List[str]],
    actual_features: Optional[List[str]]
) -> Tuple[bool, Optional[str]]:
    if expected_features is None or actual_features is None:
        return True, None

    missing = set(expected_features) - set(actual_features)
    extra = set(actual_features) - set(expected_features)

    if missing:
        return False, f"Missing features: {list(missing)}"
    if extra:
        return True, f"Extra features (ignored): {list(extra)}"
    return True, None


def validate_model(model_name: str, metadata_dir: Optional[Path] = None) -> ValidationResult:
    result = ValidationResult(valid=True, model_name=model_name)
    config = get_config()

    if metadata_dir is None:
        metadata_dir = config.metadata_dir

    registry = get_registry()
    entry = registry.get(model_name)

    if entry is None:
        result.add_error("MODEL_NOT_FOUND", f"Model not registered: {model_name}")
        return result

    exists_ok, exists_msg = validate_file_exists(entry.file_path)
    if not exists_ok:
        result.add_error("FILE_NOT_FOUND", exists_msg, field="file_path")
        return result

    readable_ok, readable_msg = validate_file_readable(entry.file_path)
    if not readable_ok:
        result.add_error("FILE_NOT_READABLE", readable_msg, field="file_path")

    checksum_ok, checksum_msg = validate_file_checksum(entry.file_path, entry.checksum)
    if not checksum_ok:
        result.add_error("CHECKSUM_MISMATCH", checksum_msg, field="checksum")

    structure_ok, structure_msg = validate_model_structure(entry.file_path)
    if not structure_ok:
        result.add_error("INVALID_STRUCTURE", structure_msg, field="file")

    metadata_ok, metadata_msg = validate_metadata_exists(model_name, metadata_dir)
    if not metadata_ok:
        result.add_warning(metadata_msg)

    return result


def validate_encoder(encoder_name: str) -> ValidationResult:
    result = ValidationResult(valid=True, model_name=encoder_name)
    registry = get_registry()
    entry = registry.get_encoder(encoder_name)

    if entry is None:
        result.add_error("ENCODER_NOT_FOUND", f"Encoder not registered: {encoder_name}")
        return result

    exists_ok, exists_msg = validate_file_exists(entry.file_path)
    if not exists_ok:
        result.add_error("FILE_NOT_FOUND", exists_msg, field="file_path")
        return result

    readable_ok, readable_msg = validate_file_readable(entry.file_path)
    if not readable_ok:
        result.add_error("FILE_NOT_READABLE", readable_msg, field="file_path")

    structure_ok, structure_msg = validate_model_structure(entry.file_path)
    if not structure_ok:
        result.add_error("INVALID_STRUCTURE", structure_msg, field="file")

    return result


def validate_all_models() -> Dict[str, ValidationResult]:
    registry = get_registry()
    results = {}
    for entry in registry.get_all():
        results[entry.name] = validate_model(entry.name)
    return results


def validate_all_encoders() -> Dict[str, ValidationResult]:
    registry = get_registry()
    results = {}
    for entry in registry.get_all_encoders():
        results[entry.name] = validate_encoder(entry.name)
    return results


def validate_bill_model_features(features: List[str]) -> Tuple[bool, Optional[str]]:
    return validate_features_compatible("bill_model", FEATURES_BILL, features)


def validate_savings_model_features(features: List[str]) -> Tuple[bool, Optional[str]]:
    return validate_features_compatible("savings_model", FEATURES_SAVINGS, features)
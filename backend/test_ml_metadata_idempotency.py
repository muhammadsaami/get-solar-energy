"""
backend/test_ml_metadata_idempotency.py
======================================
Tests verifying idempotency of ML model metadata generation:
- TEST A: Existing metadata + unchanged model preserves timestamps and avoids rewrites.
- TEST B: Missing metadata is generated correctly on first run.
- TEST C: Model content/checksum change triggers genuine regeneration.
- TEST D: Valid existing metadata fields are preserved when checksum matches.

All tests operate offline in isolated temporary directories.
"""

import json
import time
import pickle
import hashlib
from pathlib import Path
from backend.ml.registry import ModelEntry
from backend.ml.metadata import generate_metadata_file, _compute_checksum


class DummyModel:
    """Minimal estimator stub for offline testing."""
    def __init__(self, n_estimators=50):
        self.n_estimators = n_estimators


def _write_dummy_model(file_path: Path, n_estimators: int = 50) -> str:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "wb") as f:
        pickle.dump(DummyModel(n_estimators=n_estimators), f)
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def test_b_new_metadata_generation(tmp_path: Path):
    """TEST B: Missing metadata is generated correctly."""
    model_file = tmp_path / "models" / "test_model.pkl"
    checksum = _write_dummy_model(model_file, n_estimators=100)
    meta_dir = tmp_path / "metadata"

    entry = ModelEntry(
        name="test_model",
        version="1.0.0",
        algorithm="DummyEstimator",
        framework="sklearn",
        task="regression",
        status="active",
        checksum=checksum,
        file_size=model_file.stat().st_size,
        file_path=str(model_file),
        model_type="pkl",
    )

    out_file = generate_metadata_file(entry, meta_dir)
    assert out_file.exists()

    with open(out_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["name"] == "test_model"
    assert data["checksum"] == checksum
    assert data["version"] == "1.0.0"
    assert "training_date" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert data.get("metrics") == {"n_estimators": 100}


def test_a_existing_metadata_unchanged_model_idempotency(tmp_path: Path):
    """TEST A: Existing metadata + unchanged model does not rewrite or alter timestamps."""
    model_file = tmp_path / "models" / "test_model.pkl"
    checksum = _write_dummy_model(model_file, n_estimators=42)
    meta_dir = tmp_path / "metadata"

    entry = ModelEntry(
        name="test_model",
        version="1.0.0",
        algorithm="DummyEstimator",
        framework="sklearn",
        task="regression",
        status="active",
        checksum=checksum,
        file_size=model_file.stat().st_size,
        file_path=str(model_file),
        model_type="pkl",
    )

    # First generation
    out_file = generate_metadata_file(entry, meta_dir)
    with open(out_file, "r", encoding="utf-8") as f:
        first_content = json.load(f)

    first_mtime = out_file.stat().st_mtime_ns

    # Small delay to ensure any timestamp change would be detectable
    time.sleep(0.05)

    # Second generation with same model & checksum
    out_file_second = generate_metadata_file(entry, meta_dir)
    assert out_file_second == out_file

    # Verify file was NOT rewritten
    second_mtime = out_file_second.stat().st_mtime_ns
    assert first_mtime == second_mtime, "Metadata file should not be rewritten when checksum matches"

    with open(out_file_second, "r", encoding="utf-8") as f:
        second_content = json.load(f)

    assert first_content["created_at"] == second_content["created_at"]
    assert first_content["updated_at"] == second_content["updated_at"]
    assert first_content["training_date"] == second_content["training_date"]
    assert first_content["checksum"] == second_content["checksum"]


def test_c_model_change_detection(tmp_path: Path):
    """TEST C: Model content change triggers genuine regeneration."""
    model_file = tmp_path / "models" / "test_model.pkl"
    checksum1 = _write_dummy_model(model_file, n_estimators=10)
    meta_dir = tmp_path / "metadata"

    entry1 = ModelEntry(
        name="test_model",
        version="1.0.0",
        algorithm="DummyEstimator",
        framework="sklearn",
        task="regression",
        status="active",
        checksum=checksum1,
        file_size=model_file.stat().st_size,
        file_path=str(model_file),
        model_type="pkl",
    )

    out_file = generate_metadata_file(entry1, meta_dir)
    with open(out_file, "r", encoding="utf-8") as f:
        initial_data = json.load(f)
    assert initial_data["checksum"] == checksum1
    initial_created_at = initial_data["created_at"]

    # Sleep slightly so timestamps advance
    time.sleep(0.05)

    # Modify the model file content (simulating new training run)
    checksum2 = _write_dummy_model(model_file, n_estimators=99)
    assert checksum1 != checksum2

    entry2 = ModelEntry(
        name="test_model",
        version="1.0.0",
        algorithm="DummyEstimator",
        framework="sklearn",
        task="regression",
        status="active",
        checksum=checksum2,
        file_size=model_file.stat().st_size,
        file_path=str(model_file),
        model_type="pkl",
    )

    generate_metadata_file(entry2, meta_dir)

    with open(out_file, "r", encoding="utf-8") as f:
        regenerated_data = json.load(f)

    assert regenerated_data["checksum"] == checksum2
    assert regenerated_data["metrics"] == {"n_estimators": 99}
    # Original created_at is preserved
    assert regenerated_data["created_at"] == initial_created_at


def test_d_existing_metadata_custom_fields_preserved(tmp_path: Path):
    """TEST D: Valid existing metadata fields are preserved when checksum matches."""
    model_file = tmp_path / "models" / "test_model.pkl"
    checksum = _write_dummy_model(model_file, n_estimators=25)
    meta_dir = tmp_path / "metadata"

    # Pre-populate metadata file with custom field and specific historical timestamps
    meta_dir.mkdir(parents=True, exist_ok=True)
    custom_metadata = {
        "name": "test_model",
        "version": "1.0.0",
        "algorithm": "DummyEstimator",
        "framework": "sklearn",
        "task": "regression",
        "status": "active",
        "checksum": checksum,
        "file_size": model_file.stat().st_size,
        "file_path": str(model_file),
        "model_type": "pkl",
        "training_date": "2026-08-04",
        "created_at": "2026-09-02T17:06:00.010070Z",
        "updated_at": "2026-09-02T17:06:00.010070Z",
        "custom_notes": "Preserve this note",
        "metrics": {"n_estimators": 25}
    }
    target_file = meta_dir / "test_model.metadata.json"
    with open(target_file, "w", encoding="utf-8") as f:
        json.dump(custom_metadata, f, indent=2)

    entry = ModelEntry(
        name="test_model",
        version="1.0.0",
        algorithm="DummyEstimator",
        framework="sklearn",
        task="regression",
        status="active",
        checksum=checksum,
        file_size=model_file.stat().st_size,
        file_path=str(model_file),
        model_type="pkl",
    )

    result_file = generate_metadata_file(entry, meta_dir)
    assert result_file == target_file

    with open(result_file, "r", encoding="utf-8") as f:
        read_back = json.load(f)

    assert read_back["custom_notes"] == "Preserve this note"
    assert read_back["training_date"] == "2026-08-04"
    assert read_back["created_at"] == "2026-09-02T17:06:00.010070Z"
    assert read_back["updated_at"] == "2026-09-02T17:06:00.010070Z"
    assert read_back["checksum"] == checksum

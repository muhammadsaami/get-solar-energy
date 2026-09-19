"""
backend/test_ml_version_consistency.py
======================================
Focused offline tests verifying scikit-learn version consistency across all
persisted production ML artifacts:
- Confirms zero InconsistentVersionWarning emitted during artifact deserialization
- Confirms runtime version matches scikit-learn 1.9.0
- Validates model inference smoke test on canonical inputs
- Validates registry and metadata checksum synchronization
"""

import pickle
import warnings
import hashlib
from pathlib import Path
import pandas as pd
import pytest
import sklearn
from sklearn.exceptions import InconsistentVersionWarning

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "ml-models"
METADATA_DIR = MODELS_DIR / "metadata"

PRODUCTION_ARTIFACTS = [
    "bill_model.pkl",
    "savings_model.pkl",
    "city_encoder.pkl",
]


def _sha256(file_path: Path) -> str:
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def test_runtime_sklearn_version_is_1_9_0():
    """Verify runtime scikit-learn version is 1.9.0."""
    assert sklearn.__version__ == "1.9.0", (
        f"Expected scikit-learn==1.9.0, but found {sklearn.__version__}"
    )


def test_production_artifacts_load_without_inconsistent_version_warning():
    """
    Load every production ML artifact and assert that scikit-learn's
    InconsistentVersionWarning is NEVER emitted.
    """
    for artifact_name in PRODUCTION_ARTIFACTS:
        artifact_path = MODELS_DIR / artifact_name
        assert artifact_path.exists(), f"Missing production artifact: {artifact_path}"

        with warnings.catch_warnings(record=True) as captured:
            warnings.simplefilter("always")
            with open(artifact_path, "rb") as f:
                model_obj = pickle.load(f)

            # Filter specifically for InconsistentVersionWarning
            version_warnings = [
                w for w in captured
                if issubclass(w.category, InconsistentVersionWarning)
            ]

            assert len(version_warnings) == 0, (
                f"InconsistentVersionWarning detected when loading {artifact_name}: "
                f"{[str(w.message) for w in version_warnings]}"
            )
            assert model_obj is not None


def test_production_models_inference_smoke():
    """Verify end-to-end local prediction smoke test without warnings."""
    bill_path = MODELS_DIR / "bill_model.pkl"
    sav_path = MODELS_DIR / "savings_model.pkl"
    enc_path = MODELS_DIR / "city_encoder.pkl"

    with open(bill_path, "rb") as f:
        bill_model = pickle.load(f)
    with open(sav_path, "rb") as f:
        savings_model = pickle.load(f)
    with open(enc_path, "rb") as f:
        city_encoder = pickle.load(f)

    city_encoded = city_encoder.transform(["Lucknow"])[0]
    sample_df = pd.DataFrame([{
        "monthly_units": 300,
        "city_encoded": city_encoded,
        "month_num": 5,
        "per_unit_rate": 7.0
    }])

    pred_bill = bill_model.predict(sample_df)[0]
    pred_savings = savings_model.predict(sample_df)[0]

    assert isinstance(pred_bill, (int, float))
    assert isinstance(pred_savings, (int, float))
    assert pred_bill > 0, f"Predicted bill must be positive, got {pred_bill}"
    assert pred_savings > 0, f"Predicted savings must be positive, got {pred_savings}"
    # Verify deterministic expected values for canonical sample (300 units, May, 7.0/unit)
    assert round(pred_bill) == 2041
    assert round(pred_savings) == 1724


def test_metadata_checksums_match_current_artifacts():
    """Verify model metadata files record accurate SHA-256 checksums."""
    import json

    for model_name in ["bill_model", "savings_model"]:
        model_path = MODELS_DIR / f"{model_name}.pkl"
        meta_path = METADATA_DIR / f"{model_name}.metadata.json"

        assert model_path.exists(), f"Model file missing: {model_path}"
        assert meta_path.exists(), f"Metadata file missing: {meta_path}"

        actual_checksum = _sha256(model_path)
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

        assert meta.get("checksum") == actual_checksum, (
            f"Checksum mismatch for {model_name}: "
            f"metadata={meta.get('checksum')}, actual={actual_checksum}"
        )

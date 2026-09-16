"""
backend/mlops/model_versioning.py
==================================
GET Solar Energy — Semantic Model Versioning
Phase 13.0E.3

Responsibilities:
  - Semantic version parsing and comparison
  - Version history per model (current, previous, rollback target)
  - Deployment date, training date, metrics per version
  - Metadata comparison between versions
  - Version history persisted via Repository

Never retrains. Never loads models directly.
"""

import re
from dataclasses import dataclass, asdict, field
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime

from .repository import get_repository, Repository


@dataclass
class VersionRecord:
    version: str
    model_name: str
    training_date: Optional[str] = None
    deployment_date: Optional[str] = None
    status: str = "registered"
    metrics: Optional[Dict[str, float]] = None
    rollback_target: Optional[str] = None
    algorithm: Optional[str] = None
    framework: Optional[str] = None
    checksum: Optional[str] = None
    notes: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if v is not None}

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "VersionRecord":
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


# ── Semantic Version Helpers ────────────────────────────────────────────

_SEMVER_RE = re.compile(r"^(\d+)\.(\d+)\.(\d+)(?:-([\w.]+))?(?:\+([\w.]+))?$")


def parse_version(version: str) -> Tuple[int, int, int, Optional[str], Optional[str]]:
    """
    Parse a semver string into (major, minor, patch, pre_release, build).
    Raises ValueError if invalid.
    """
    m = _SEMVER_RE.match(version.strip())
    if not m:
        raise ValueError(f"Invalid semver: {version}")
    return (
        int(m.group(1)),
        int(m.group(2)),
        int(m.group(3)),
        m.group(4),
        m.group(5),
    )


def compare_versions(a: str, b: str) -> int:
    """
    Compare two semver strings.
    Returns -1 if a < b, 0 if equal, 1 if a > b.
    """
    pa = parse_version(a)
    pb = parse_version(b)

    for i in range(3):
        if pa[i] < pb[i]:
            return -1
        if pa[i] > pb[i]:
            return 1

    if pa[3] is None and pb[3] is not None:
        return 1
    if pa[3] is not None and pb[3] is None:
        return -1
    if pa[3] is not None and pb[3] is not None:
        if pa[3] < pb[3]:
            return -1
        if pa[3] > pb[3]:
            return 1

    return 0


def is_newer(version: str, than: str) -> bool:
    return compare_versions(version, than) > 0


def bump_version(version: str, bump: str = "patch") -> str:
    """Bump a semver string. bump: 'major', 'minor', or 'patch'."""
    major, minor, patch, _, _ = parse_version(version)
    if bump == "major":
        return f"{major + 1}.0.0"
    elif bump == "minor":
        return f"{major}.{minor + 1}.0"
    else:
        return f"{major}.{minor}.{patch + 1}"


def initial_version() -> str:
    return "1.0.0"


# ── Versioning Service ──────────────────────────────────────────────────

class VersioningService:
    """
    Manages version history per model, persisted via Repository.
    """

    _instance: Optional["VersioningService"] = None

    def __new__(cls) -> "VersioningService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._repository: Repository = get_repository()
        self._initialized = True

    def _history_key(self, model_name: str) -> str:
        return f"version_history_{model_name}"

    def get_history(self, model_name: str) -> List[Dict[str, Any]]:
        """Return all version records for a model, oldest first."""
        meta = self._repository.read_model_metadata(model_name) or {}
        history = meta.get("version_history", [])
        return history

    def get_current_version(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Return the current (latest) version record."""
        history = self.get_history(model_name)
        return history[-1] if history else None

    def get_previous_version(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Return the version before current."""
        history = self.get_history(model_name)
        return history[-2] if len(history) >= 2 else None

    def get_rollback_target(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Return the version marked as rollback target, or the previous version."""
        history = self.get_history(model_name)
        for v in reversed(history):
            if v.get("rollback_target"):
                return v
        return self.get_previous_version(model_name)

    def add_version(
        self,
        model_name: str,
        version: str,
        training_date: Optional[str] = None,
        algorithm: Optional[str] = None,
        framework: Optional[str] = None,
        checksum: Optional[str] = None,
        metrics: Optional[Dict[str, float]] = None,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Add a new version record to the model's history."""
        record = VersionRecord(
            version=version,
            model_name=model_name,
            training_date=training_date,
            algorithm=algorithm,
            framework=framework,
            checksum=checksum,
            metrics=metrics,
            notes=notes,
        )

        meta = self._repository.read_model_metadata(model_name) or {}
        if "name" not in meta:
            meta["name"] = model_name

        history = meta.get("version_history", [])

        # If there's a previous current, mark it as previous
        if history:
            history[-1]["is_current"] = False
            record.rollback_target = False

        record_dict = record.to_dict()
        record_dict["is_current"] = True
        if not history:
            record_dict["rollback_target"] = True
        history.append(record_dict)

        meta["version_history"] = history
        meta["current_version"] = version
        if len(history) >= 2:
            meta["previous_version"] = history[-2]["version"]
        else:
            meta["previous_version"] = None

        self._repository.write_model_metadata(model_name, meta)
        return record_dict

    def update_version_status(
        self,
        model_name: str,
        version: str,
        status: str,
    ) -> bool:
        """Update the status of a specific version record."""
        meta = self._repository.read_model_metadata(model_name) or {}
        history = meta.get("version_history", [])

        for v in history:
            if v["version"] == version:
                v["status"] = status
                self._repository.write_model_metadata(model_name, meta)
                return True
        return False

    def update_version_deployment(
        self,
        model_name: str,
        version: str,
    ) -> bool:
        """Mark a version as deployed."""
        meta = self._repository.read_model_metadata(model_name) or {}
        history = meta.get("version_history", [])

        for v in history:
            if v["version"] == version:
                v["deployment_date"] = datetime.utcnow().isoformat() + "Z"
                v["status"] = "deployed"
                self._repository.write_model_metadata(model_name, meta)
                return True
        return False

    def compare_versions_metadata(
        self,
        model_name: str,
        version_a: str,
        version_b: str,
    ) -> Dict[str, Any]:
        """Compare two version records for a model."""
        history = self.get_history(model_name)
        va = next((v for v in history if v["version"] == version_a), None)
        vb = next((v for v in history if v["version"] == version_b), None)

        if va is None or vb is None:
            return {"error": "Version not found", "found_a": va is not None, "found_b": vb is not None}

        diffs = {}
        all_keys = set(va.keys()) | set(vb.keys())
        for key in all_keys:
            if key in ("created_at", "is_current"):
                continue
            a_val = va.get(key)
            b_val = vb.get(key)
            if a_val != b_val:
                diffs[key] = {"from": a_val, "to": b_val}

        return {
            "model_name": model_name,
            "version_a": version_a,
            "version_b": version_b,
            "changed": len(diffs) > 0,
            "diffs": diffs,
        }

    def seed_from_registry(self, model_name: str, registry_entry) -> Optional[Dict[str, Any]]:
        """Seed version history from the existing registry entry if none exists."""
        existing = self.get_history(model_name)
        if existing:
            return None

        from ml.metadata import load_metadata
        meta = load_metadata(model_name)
        training_date = meta.get("training_date") if meta else None

        return self.add_version(
            model_name=model_name,
            version=registry_entry.version,
            training_date=training_date,
            algorithm=registry_entry.algorithm,
            framework=registry_entry.framework,
            checksum=registry_entry.checksum,
            notes="Seeded from ML registry",
        )


def get_versioning_service() -> VersioningService:
    return VersioningService()

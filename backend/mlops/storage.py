"""
backend/mlops/storage.py
========================
GET Solar Energy — MLOps Storage Layer
Phase 13.0E.1

Abstract persistence backend with a local JSON implementation.
Swappable for SQLite / PostgreSQL / Cloud Storage without changing
any manager or repository code.
"""

import json
import os
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime

from ml.config import MODELS_DIR


MLOPS_DIR = MODELS_DIR / "mlops"


class StorageBackend(ABC):
    """Abstract storage interface for all MLOps persistence."""

    @abstractmethod
    def read(self, collection: str, key: str) -> Optional[Dict[str, Any]]:
        ...

    @abstractmethod
    def write(self, collection: str, key: str, data: Dict[str, Any]) -> None:
        ...

    @abstractmethod
    def delete(self, collection: str, key: str) -> bool:
        ...

    @abstractmethod
    def list_keys(self, collection: str) -> List[str]:
        ...

    @abstractmethod
    def list_all(self, collection: str) -> List[Dict[str, Any]]:
        ...

    @abstractmethod
    def append(self, collection: str, entry: Dict[str, Any]) -> None:
        ...

    @abstractmethod
    def read_append_log(self, collection: str, limit: int = 100) -> List[Dict[str, Any]]:
        ...


class LocalJSONStorage(StorageBackend):
    """
    Local filesystem storage using JSON files.

    Collections are stored as:
      - Keyed collections:  <mlops_dir>/<collection>/<key>.json
      - Append-only logs:   <mlops_dir>/<collection>.jsonl
    """

    _instance: Optional["LocalJSONStorage"] = None

    def __new__(cls) -> "LocalJSONStorage":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._base = MLOPS_DIR
        self._base.mkdir(parents=True, exist_ok=True)
        self._initialized = True

    def _collection_dir(self, collection: str) -> Path:
        d = self._base / collection
        d.mkdir(parents=True, exist_ok=True)
        return d

    def _key_path(self, collection: str, key: str) -> Path:
        safe_key = key.replace("/", "_").replace("\\", "_")
        return self._collection_dir(collection) / f"{safe_key}.json"

    def _log_path(self, collection: str) -> Path:
        return self._base / f"{collection}.jsonl"

    def read(self, collection: str, key: str) -> Optional[Dict[str, Any]]:
        path = self._key_path(collection, key)
        if not path.exists():
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def write(self, collection: str, key: str, data: Dict[str, Any]) -> None:
        path = self._key_path(collection, key)
        data["_updated_at"] = datetime.utcnow().isoformat() + "Z"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)

    def delete(self, collection: str, key: str) -> bool:
        path = self._key_path(collection, key)
        if path.exists():
            path.unlink()
            return True
        return False

    def list_keys(self, collection: str) -> List[str]:
        d = self._collection_dir(collection)
        return [p.stem for p in d.glob("*.json")]

    def list_all(self, collection: str) -> List[Dict[str, Any]]:
        results = []
        for key in self.list_keys(collection):
            data = self.read(collection, key)
            if data is not None:
                results.append(data)
        return results

    def append(self, collection: str, entry: Dict[str, Any]) -> None:
        entry["_appended_at"] = datetime.utcnow().isoformat() + "Z"
        path = self._log_path(collection)
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, default=str) + "\n")

    def read_append_log(self, collection: str, limit: int = 100) -> List[Dict[str, Any]]:
        path = self._log_path(collection)
        if not path.exists():
            return []
        out = []
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    out.append(json.loads(line))
                except Exception:
                    continue
        return out[-limit:]


def get_storage() -> StorageBackend:
    return LocalJSONStorage()

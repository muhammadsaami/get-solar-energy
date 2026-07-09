"""
backend/ml/loader.py
====================
GET Solar Energy — Model Loader with Singleton Cache
Phase 13.0A

Singleton model cache with hit/miss tracking.
Never loads the same model twice.
"""

import os
import pickle
import time
from pathlib import Path
from typing import Dict, Optional, Any, Callable
from dataclasses import dataclass, field
from datetime import datetime

from .config import get_config
from .registry import get_registry, ModelEntry


@dataclass
class LoadStats:
    cache_hits: int = 0
    cache_misses: int = 0
    total_load_time_ms: float = 0.0
    model_load_times: Dict[str, float] = field(default_factory=dict)

    def record_hit(self, name: str):
        self.cache_hits += 1

    def record_miss(self, name: str, load_time_ms: float):
        self.cache_misses += 1
        self.total_load_time_ms += load_time_ms
        self.model_load_times[name] = load_time_ms

    def hit_rate(self) -> float:
        total = self.cache_hits + self.cache_misses
        return self.cache_hits / total if total > 0 else 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "hit_rate": round(self.hit_rate(), 4),
            "total_load_time_ms": round(self.total_load_time_ms, 2),
            "model_load_times": {k: round(v, 2) for k, v in self.model_load_times.items()},
        }


class ModelLoader:
    _instance: Optional["ModelLoader"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._cache: Dict[str, Any] = {}
        self._entry_cache: Dict[str, ModelEntry] = {}
        self._stats = LoadStats()
        self._config = get_config()
        self._registry = get_registry()
        self._initialized = True

    def _load_pkl(self, file_path: Path) -> Any:
        with open(file_path, "rb") as f:
            return pickle.load(f)

    def _load_joblib(self, file_path: Path) -> Any:
        import joblib
        return joblib.load(file_path)

    def _load_onnx(self, file_path: Path) -> Any:
        try:
            import onnx
            return onnx.load(str(file_path))
        except ImportError:
            raise ImportError("onnxruntime is required for ONNX models: pip install onnxruntime")

    def _load_model(self, entry: ModelEntry) -> Any:
        path = Path(entry.file_path)
        load_func = {
            "pkl": self._load_pkl,
            "joblib": self._load_joblib,
            "onnx": self._load_onnx,
        }.get(entry.model_type)

        if load_func is None:
            raise ValueError(f"Unsupported model type: {entry.model_type}")

        return load_func(path)

    def load(self, name: str, force_reload: bool = False) -> Any:
        if not force_reload and name in self._cache:
            self._stats.record_hit(name)
            return self._cache[name]

        entry = self._registry.get(name)
        if entry is None:
            raise ValueError(f"Model not found in registry: {name}")

        start_time = time.perf_counter()
        model = self._load_model(entry)
        load_time_ms = (time.perf_counter() - start_time) * 1000

        self._cache[name] = model
        self._entry_cache[name] = entry
        self._stats.record_miss(name, load_time_ms)

        return model

    def load_encoder(self, name: str, force_reload: bool = False) -> Any:
        cache_key = f"encoder:{name}"
        if not force_reload and cache_key in self._cache:
            self._stats.record_hit(cache_key)
            return self._cache[cache_key]

        entry = self._registry.get_encoder(name)
        if entry is None:
            raise ValueError(f"Encoder not found in registry: {name}")

        start_time = time.perf_counter()
        encoder = self._load_model(entry)
        load_time_ms = (time.perf_counter() - start_time) * 1000

        self._cache[cache_key] = encoder
        self._entry_cache[cache_key] = entry
        self._stats.record_miss(cache_key, load_time_ms)

        return encoder

    def preload_all(self) -> Dict[str, Any]:
        loaded = {}
        for entry in self._registry.get_all():
            try:
                model = self.load(entry.name)
                loaded[entry.name] = model
            except Exception as e:
                print(f"Warning: Failed to preload {entry.name}: {e}")
        return loaded

    def preload_encoders(self) -> Dict[str, Any]:
        loaded = {}
        for entry in self._registry.get_all_encoders():
            try:
                encoder = self.load_encoder(entry.name)
                loaded[entry.name] = encoder
            except Exception as e:
                print(f"Warning: Failed to preload encoder {entry.name}: {e}")
        return loaded

    def get_cached(self, name: str) -> Optional[Any]:
        return self._cache.get(name)

    def get_cached_entry(self, name: str) -> Optional[ModelEntry]:
        return self._entry_cache.get(name)

    def is_loaded(self, name: str) -> bool:
        return name in self._cache

    def unload(self, name: str) -> bool:
        if name in self._cache:
            del self._cache[name]
            return True
        return False

    def clear_cache(self) -> None:
        self._cache.clear()
        self._entry_cache.clear()

    def get_stats(self) -> LoadStats:
        return self._stats

    def get_stats_dict(self) -> Dict[str, Any]:
        return self._stats.to_dict()


def get_loader() -> ModelLoader:
    return ModelLoader()


def preload_models() -> Dict[str, Any]:
    loader = get_loader()
    return loader.preload_all()


def preload_encoders() -> Dict[str, Any]:
    loader = get_loader()
    return loader.preload_encoders()
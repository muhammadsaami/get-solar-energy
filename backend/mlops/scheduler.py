"""
backend/mlops/scheduler.py
===========================
GET Solar Energy — Scheduler Abstraction
Phase 13.0E.8

Responsibilities:
  - SchedulerInterface ABC
  - APSchedulerScheduler (guarded import)
  - ManualScheduler (fallback when APScheduler unavailable)
  - Daily health checks
  - Metadata refresh
  - Metric aggregation
  - Drift scans
  - Model validation

No retraining jobs.
Business logic never imports APScheduler directly.
"""

import logging
from abc import ABC, abstractmethod
from typing import Any, Callable, Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


# ── Scheduler Interface ─────────────────────────────────────────────────

class SchedulerInterface(ABC):
    """Abstract scheduler interface for swappable backends."""

    @abstractmethod
    def start(self) -> None:
        ...

    @abstractmethod
    def stop(self) -> None:
        ...

    @abstractmethod
    def add_interval_job(
        self,
        func: Callable,
        job_id: str,
        seconds: Optional[int] = None,
        minutes: Optional[int] = None,
        hours: Optional[int] = None,
    ) -> None:
        ...

    @abstractmethod
    def add_cron_job(
        self,
        func: Callable,
        job_id: str,
        hour: int = 0,
        minute: int = 0,
    ) -> None:
        ...

    @abstractmethod
    def remove_job(self, job_id: str) -> bool:
        ...

    @abstractmethod
    def get_jobs(self) -> List[Dict[str, Any]]:
        ...

    @abstractmethod
    def is_running(self) -> bool:
        ...


# ── APScheduler Implementation (guarded) ────────────────────────────────

class APSchedulerScheduler(SchedulerInterface):
    """APScheduler-backed scheduler. Only instantiated if APScheduler is available."""

    def __init__(self) -> None:
        try:
            from apscheduler.schedulers.background import BackgroundScheduler
            self._scheduler = BackgroundScheduler()
            self._running = False
        except ImportError:
            raise ImportError("APScheduler is required: pip install apscheduler")

    def start(self) -> None:
        if not self._running:
            self._scheduler.start()
            self._running = True
            logger.info("APScheduler started")

    def stop(self) -> None:
        if self._running:
            self._scheduler.shutdown(wait=False)
            self._running = False
            logger.info("APScheduler stopped")

    def add_interval_job(
        self,
        func: Callable,
        job_id: str,
        seconds: Optional[int] = None,
        minutes: Optional[int] = None,
        hours: Optional[int] = None,
    ) -> None:
        kwargs = {"id": job_id, "replace_existing": True}
        if seconds:
            kwargs["seconds"] = seconds
        if minutes:
            kwargs["minutes"] = minutes
        if hours:
            kwargs["hours"] = hours
        self._scheduler.add_job(func, "interval", **kwargs)
        logger.info(f"Added interval job: {job_id}")

    def add_cron_job(
        self,
        func: Callable,
        job_id: str,
        hour: int = 0,
        minute: int = 0,
    ) -> None:
        self._scheduler.add_job(
            func, "cron", id=job_id, replace_existing=True,
            hour=hour, minute=minute,
        )
        logger.info(f"Added cron job: {job_id} (daily at {hour:02d}:{minute:02d})")

    def remove_job(self, job_id: str) -> bool:
        try:
            self._scheduler.remove_job(job_id)
            return True
        except Exception:
            return False

    def get_jobs(self) -> List[Dict[str, Any]]:
        jobs = []
        for job in self._scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": str(job.next_run_time) if job.next_run_time else None,
            })
        return jobs

    def is_running(self) -> bool:
        return self._running


# ── Manual Scheduler (fallback) ─────────────────────────────────────────

class ManualScheduler(SchedulerInterface):
    """
    Manual scheduler fallback when APScheduler is unavailable.
    Stores job definitions; jobs must be invoked manually.
    """

    def __init__(self) -> None:
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._running = False

    def start(self) -> None:
        self._running = True
        logger.info("ManualScheduler started (no auto-execution)")

    def stop(self) -> None:
        self._running = False
        logger.info("ManualScheduler stopped")

    def add_interval_job(
        self,
        func: Callable,
        job_id: str,
        seconds: Optional[int] = None,
        minutes: Optional[int] = None,
        hours: Optional[int] = None,
    ) -> None:
        self._jobs[job_id] = {
            "func": func,
            "interval_seconds": seconds or (minutes or 0) * 60 + (hours or 0) * 3600,
            "type": "interval",
        }
        logger.info(f"Registered manual interval job: {job_id}")

    def add_cron_job(
        self,
        func: Callable,
        job_id: str,
        hour: int = 0,
        minute: int = 0,
    ) -> None:
        self._jobs[job_id] = {
            "func": func,
            "hour": hour,
            "minute": minute,
            "type": "cron",
        }
        logger.info(f"Registered manual cron job: {job_id} (daily at {hour:02d}:{minute:02d})")

    def remove_job(self, job_id: str) -> bool:
        if job_id in self._jobs:
            del self._jobs[job_id]
            return True
        return False

    def get_jobs(self) -> List[Dict[str, Any]]:
        return [{"id": k, "type": v.get("type"), "interval_seconds": v.get("interval_seconds")} for k, v in self._jobs.items()]

    def is_running(self) -> bool:
        return self._running

    def run_job(self, job_id: str) -> Any:
        """Manually execute a registered job."""
        job = self._jobs.get(job_id)
        if job is None:
            raise ValueError(f"Job not found: {job_id}")
        logger.info(f"Manually running job: {job_id}")
        return job["func"]()

    def run_all(self) -> Dict[str, Any]:
        """Manually execute all registered jobs."""
        results = {}
        for job_id in self._jobs:
            try:
                self.run_job(job_id)
                results[job_id] = "success"
            except Exception as e:
                results[job_id] = f"error: {e}"
        return results


# ── Job Definitions ─────────────────────────────────────────────────────

def _daily_health_check() -> Dict[str, Any]:
    """Job: daily health snapshot."""
    from .health_monitor import get_health_monitor
    hm = get_health_monitor()
    return hm.snapshot()

def _metadata_refresh() -> Dict[str, Any]:
    """Job: refresh metadata from registry."""
    from ml.registry import get_registry
    from ml.metadata import generate_all_metadata
    generate_all_metadata()
    return {"status": "metadata_refreshed"}

def _metric_aggregation() -> Dict[str, Any]:
    """Job: aggregate daily metrics."""
    from .metrics_collector import get_metrics_collector
    mc = get_metrics_collector()
    return mc.collect()

def _drift_scan() -> Dict[str, Any]:
    """Job: run drift detection scan."""
    from .drift_detection import get_drift_detector
    dd = get_drift_detector()
    return dd.analyze()

def _model_validation() -> Dict[str, Any]:
    """Job: validate all registered models."""
    from ml.validation import validate_all_models
    results = validate_all_models()
    return {name: r.to_dict() for name, r in results.items()}


# ── Factory ─────────────────────────────────────────────────────────────

_scheduler_instance: Optional[SchedulerInterface] = None


def get_scheduler() -> SchedulerInterface:
    """Get the scheduler instance. Creates APScheduler or Manual fallback."""
    global _scheduler_instance
    if _scheduler_instance is not None:
        return _scheduler_instance

    try:
        _scheduler_instance = APSchedulerScheduler()
        logger.info("Using APScheduler backend")
    except ImportError:
        _scheduler_instance = ManualScheduler()
        logger.info("Using ManualScheduler fallback (APScheduler not available)")

    return _scheduler_instance


def start_scheduler() -> SchedulerInterface:
    """Start the scheduler with default MLOps jobs. No retraining jobs."""
    scheduler = get_scheduler()
    scheduler.start()

    # Register jobs (no retraining)
    scheduler.add_interval_job(_daily_health_check, "mlops_health_check", hours=1)
    scheduler.add_interval_job(_metric_aggregation, "mlops_metrics", minutes=30)
    scheduler.add_cron_job(_metadata_refresh, "mlops_metadata_refresh", hour=2, minute=0)
    scheduler.add_cron_job(_drift_scan, "mlops_drift_scan", hour=3, minute=0)
    scheduler.add_cron_job(_model_validation, "mlops_model_validation", hour=4, minute=0)

    logger.info("MLOps scheduler started with default jobs")
    return scheduler

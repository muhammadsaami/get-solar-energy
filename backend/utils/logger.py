"""
backend/utils/logger.py
========================
GET Solar Energy — Centralised Structured Logging Utility
Phase 12.4A+++ Production Excellence

Provides a single, consistent logging interface for every CRM module.
All log records are emitted in a structured format with consistent fields:
  timestamp | level | module | event | details

Usage:
    from utils.logger import get_logger
    logger = get_logger(__name__)
    logger.info("Customer updated", extra={"customer_id": 5, "field": "status"})
"""

import logging
import sys
from datetime import datetime
from typing import Optional


class CRMFormatter(logging.Formatter):
    """
    Custom structured formatter that writes JSON-style key=value log lines.
    Compatible with log aggregators (Loki, CloudWatch, Papertrail).
    """

    LEVEL_EMOJI = {
        "DEBUG":    "🔍",
        "INFO":     "✅",
        "WARNING":  "⚠️ ",
        "ERROR":    "❌",
        "CRITICAL": "🚨",
    }

    def format(self, record: logging.LogRecord) -> str:
        emoji = self.LEVEL_EMOJI.get(record.levelname, "  ")
        ts    = datetime.utcfromtimestamp(record.created).strftime("%Y-%m-%dT%H:%M:%SZ")
        base  = f"{ts} {emoji} [{record.levelname}] [{record.name}] {record.getMessage()}"

        # Append structured extras (exclude standard LogRecord fields)
        standard = {
            "name", "msg", "args", "levelname", "levelno", "pathname",
            "filename", "module", "exc_info", "exc_text", "stack_info",
            "lineno", "funcName", "created", "msecs", "relativeCreated",
            "thread", "threadName", "processName", "process", "message",
            "taskName",
        }
        extras = {k: v for k, v in record.__dict__.items() if k not in standard}
        if extras:
            pairs = " | ".join(f"{k}={v!r}" for k, v in extras.items())
            base = f"{base} | {pairs}"

        if record.exc_info:
            base = base + "\n" + self.formatException(record.exc_info)

        return base


def _build_logger(name: str) -> logging.Logger:
    """
    Build and configure a logger instance for the given module name.
    Logger is only configured once (idempotent).
    """
    logger = logging.getLogger(name)

    if logger.handlers:
        # Already configured — return cached instance
        return logger

    logger.setLevel(logging.DEBUG)
    logger.propagate = False

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG)
    handler.setFormatter(CRMFormatter())
    logger.addHandler(handler)

    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Public factory function.  Always call this at module level:

        logger = get_logger(__name__)

    Args:
        name: typically ``__name__`` of the calling module.

    Returns:
        Configured :class:`logging.Logger` instance.
    """
    return _build_logger(name)


# ---------------------------------------------------------------------------
# Convenience helpers — used by routes for concise event logging
# ---------------------------------------------------------------------------

def log_api_request(logger: logging.Logger, method: str, path: str, params: Optional[dict] = None) -> None:
    """Log the start of an API request."""
    logger.info("API request received", extra={
        "http_method": method,
        "path": path,
        "params": str(params or {}),
    })


def log_api_response(logger: logging.Logger, method: str, path: str, status: int, duration_ms: Optional[float] = None) -> None:
    """Log the completion of an API request."""
    logger.info("API response sent", extra={
        "http_method": method,
        "path": path,
        "status_code": status,
        "duration_ms": duration_ms,
    })


def log_crm_event(logger: logging.Logger, event: str, customer_id: Optional[int] = None, user: str = "System", **kwargs) -> None:
    """Log a significant CRM business event."""
    reserved_keys = {"name", "msg", "args", "levelname", "levelno", "pathname", "filename", "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName", "created", "msecs", "relativeCreated", "thread", "threadName", "processName", "process"}
    extra = {
        "customer_id": customer_id,
        "triggered_by": user,
    }
    for k, v in kwargs.items():
        if k in reserved_keys:
            extra[f"crm_{k}"] = v
        else:
            extra[k] = v
    logger.info(f"CRM event: {event}", extra=extra)


def log_db_error(logger: logging.Logger, operation: str, error: Exception, **kwargs) -> None:
    """Log a database-layer error with context."""
    logger.error(f"Database error during {operation}: {error}", extra={
        "operation": operation,
        "error_type": type(error).__name__,
        **kwargs,
    }, exc_info=True)


def log_automation(logger: logging.Logger, trigger: str, customer_id: int, result: str) -> None:
    """Log an automation engine execution."""
    logger.info(f"Automation triggered: {trigger}", extra={
        "customer_id": customer_id,
        "automation_result": result,
    })


def log_migration(logger: logging.Logger, migration_name: str, action: str) -> None:
    """Log a database migration action."""
    logger.info(f"Migration {action}: {migration_name}", extra={
        "migration": migration_name,
        "action": action,
    })

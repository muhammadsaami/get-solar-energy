"""
backend/crm_audit.py
====================
GET Solar Energy — CRM Dedicated Audit Trail
Phase 12.4A+++ Production Excellence

Maintains an immutable record of every critical business operation.
Separate from the customer-facing timeline (crm_timeline) which
records domain events — the audit log records WHO changed WHAT and WHY.

Schema: crm_audit_log
─────────────────────
  id            INTEGER PK
  action        VARCHAR   — e.g. "customer.status.updated"
  module        VARCHAR   — e.g. "CRM", "Proposal", "SiteSurvey"
  entity_type   VARCHAR   — e.g. "Customer", "Task", "Meeting"
  entity_id     INTEGER   — FK to the affected record
  user          VARCHAR   — salesperson / "System"
  old_value     VARCHAR   — JSON-serialised previous state
  new_value     VARCHAR   — JSON-serialised new state
  reason        VARCHAR   — optional human-readable rationale
  ip_address    VARCHAR   — future: populated from request context
  created_at    DATETIME  — server timestamp (UTC)

Usage:
    from crm_audit import record_audit
    record_audit(db, action="customer.status.updated",
                 module="CRM", entity_type="Customer", entity_id=5,
                 user="Salman", old_value={"status": "New Lead"},
                 new_value={"status": "Qualified"})
"""

import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from database_sqlite import BaseSqlite
from utils.logger import get_logger

logger = get_logger(__name__)


class CRMAuditLogModel(BaseSqlite):
    """Immutable audit log record — never update, only insert."""

    __tablename__ = "crm_audit_log"

    id          = Column(Integer, primary_key=True, index=True)
    action      = Column(String,  nullable=False, index=True)
    module      = Column(String,  nullable=False, index=True)
    entity_type = Column(String,  nullable=False)
    entity_id   = Column(Integer, nullable=True,  index=True)
    user        = Column(String,  nullable=False, default="System")
    old_value   = Column(Text,    nullable=True)
    new_value   = Column(Text,    nullable=True)
    reason      = Column(String,  nullable=True)
    ip_address  = Column(String,  nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), index=True)


def record_audit(
    db: Session,
    *,
    action: str,
    module: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    user: str = "System",
    old_value: Optional[Dict[str, Any]] = None,
    new_value: Optional[Dict[str, Any]] = None,
    reason: Optional[str] = None,
    ip_address: Optional[str] = None,
    auto_commit: bool = True,
) -> CRMAuditLogModel:
    """
    Insert a single immutable audit record.

    Args:
        db:          SQLAlchemy session.
        action:      Dot-notation action string, e.g. "customer.status.updated".
        module:      Originating module (CRM, Proposal, etc.).
        entity_type: Human-readable entity type (Customer, Task, Meeting, etc.).
        entity_id:   Primary key of the affected entity.
        user:        Who triggered the action.
        old_value:   Previous state as a plain dict (will be JSON-serialised).
        new_value:   New state as a plain dict (will be JSON-serialised).
        reason:      Optional human-readable explanation.
        ip_address:  Request origin (optional, for future auth middleware).
        auto_commit: Commit immediately (default True).

    Returns:
        The newly created :class:`CRMAuditLogModel` instance.
    """
    record = CRMAuditLogModel(
        action=action,
        module=module,
        entity_type=entity_type,
        entity_id=entity_id,
        user=user,
        old_value=json.dumps(old_value) if old_value else None,
        new_value=json.dumps(new_value) if new_value else None,
        reason=reason,
        ip_address=ip_address,
    )
    db.add(record)
    if auto_commit:
        db.commit()
        db.refresh(record)

    logger.info(
        "Audit record created",
        extra={
            "audit_action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "user": user,
        },
    )
    return record

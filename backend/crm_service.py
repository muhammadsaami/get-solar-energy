"""
backend/crm_service.py
=======================
GET Solar Energy — CRM Service Layer (CRUD + Event Logging)
Phase 12.4A+++ Production Excellence

Responsibilities:
  • Task, Meeting, Follow-up CRUD operations
  • Timeline event creation and customer.last_activity updates
  • All database writes are atomic per operation

Every write function:
  1. Validates entity existence
  2. Applies changes
  3. Commits the transaction
  4. Emits a structured log entry
  5. (Optionally) creates a timeline event
"""

from datetime import datetime
from sqlalchemy.orm import Session

from database_sqlite import CustomerModel
from crm_models import (
    CRMActivityTimelineModel,
    CRMTaskModel,
    CRMFollowUpModel,
    CRMMeetingModel,
)
from crm_scoring import calculate_lead_score, calculate_health_score
from utils.logger import get_logger, log_crm_event

logger = get_logger(__name__)


# ─── Internal Helpers ──────────────────────────────────────────────────────────

def _get_customer(db: Session, customer_id: int) -> CustomerModel | None:
    """Return customer or None (no exception)."""
    return db.query(CustomerModel).filter(CustomerModel.id == customer_id).first()


def _customer_salesperson(customer: CustomerModel | None) -> str:
    return (customer.salesperson or "System") if customer else "System"


# ─── Timeline ─────────────────────────────────────────────────────────────────

def add_timeline_event(
    db: Session,
    customer_id: int,
    event_type: str,
    user: str = "System",
    status: str | None = None,
    notes: str | None = None,
    module: str = "CRM",
) -> CRMActivityTimelineModel:
    """
    Create an immutable timeline event and update ``customer.last_activity``.

    Args:
        db:          SQLAlchemy session.
        customer_id: ID of the related customer.
        event_type:  Short event description, e.g. "Task Created".
        user:        Who triggered the event.
        status:      Optional status annotation.
        notes:       Optional free-text notes.
        module:      Originating module (CRM, Proposal, etc.).

    Returns:
        The newly persisted :class:`CRMActivityTimelineModel`.
    """
    if not customer_id:
        logger.warning("add_timeline_event called with empty customer_id; skipping")
        return None  # type: ignore[return-value]

    evt = CRMActivityTimelineModel(
        customer_id=customer_id,
        event_type=event_type,
        user=user,
        module=module,
        status=status,
        notes=notes,
    )
    db.add(evt)
    db.flush()   # get evt.id without a full commit

    # Stamp last_activity on the customer record
    customer = _get_customer(db, customer_id)
    if customer:
        customer.last_activity = datetime.now().isoformat()
        db.add(customer)

    db.commit()

    log_crm_event(
        logger,
        event=event_type,
        customer_id=customer_id,
        user=user,
        module=module,
    )
    return evt


# ─── Tasks ────────────────────────────────────────────────────────────────────

def get_tasks(db: Session, customer_id: int | None = None) -> list[CRMTaskModel]:
    """Return all tasks, optionally filtered by customer."""
    query = db.query(CRMTaskModel)
    if customer_id:
        query = query.filter(CRMTaskModel.customer_id == customer_id)
    return query.order_by(CRMTaskModel.due_date.asc()).all()


def create_task(db: Session, data: dict) -> CRMTaskModel:
    """Insert a new task and emit a timeline event if associated with a customer."""
    task = CRMTaskModel(**data)
    db.add(task)
    db.commit()
    db.refresh(task)

    logger.info("Task created", extra={"task_id": task.id, "title": task.title, "customer_id": task.customer_id})

    if task.customer_id:
        add_timeline_event(
            db,
            customer_id=task.customer_id,
            event_type="Task Created",
            user=task.assigned_to or "System",
            status=task.status,
            notes=f"Task: {task.title} (Priority: {task.priority})",
            module="CRM",
        )
    return task


def update_task(db: Session, task_id: int, data: dict) -> CRMTaskModel | None:
    """Apply a partial update to an existing task."""
    task = db.query(CRMTaskModel).filter(CRMTaskModel.id == task_id).first()
    if not task:
        logger.warning("update_task: task not found", extra={"task_id": task_id})
        return None

    old_status = task.status
    for key, val in data.items():
        if val is not None:
            setattr(task, key, val)

    db.commit()
    db.refresh(task)

    logger.info(
        "Task updated",
        extra={"task_id": task_id, "old_status": old_status, "new_status": task.status},
    )

    if task.customer_id and old_status != task.status:
        event = "Task Completed" if task.status == "Completed" else "Task Updated"
        add_timeline_event(
            db,
            customer_id=task.customer_id,
            event_type=event,
            user=task.assigned_to or "System",
            status=task.status,
            notes=f"Task: {task.title} moved from {old_status} to {task.status}",
            module="CRM",
        )
    return task


def delete_task(db: Session, task_id: int) -> bool:
    """Delete a task.  Returns True on success, False if not found."""
    task = db.query(CRMTaskModel).filter(CRMTaskModel.id == task_id).first()
    if not task:
        logger.warning("delete_task: task not found", extra={"task_id": task_id})
        return False
    db.delete(task)
    db.commit()
    logger.info("Task deleted", extra={"task_id": task_id})
    return True


# ─── Meetings ─────────────────────────────────────────────────────────────────

def get_meetings(db: Session, customer_id: int | None = None) -> list[CRMMeetingModel]:
    """Return all meetings, optionally filtered by customer."""
    query = db.query(CRMMeetingModel)
    if customer_id:
        query = query.filter(CRMMeetingModel.customer_id == customer_id)
    return query.order_by(
        CRMMeetingModel.scheduled_date.asc(),
        CRMMeetingModel.scheduled_time.asc(),
    ).all()


def create_meeting(db: Session, data: dict) -> CRMMeetingModel:
    """Insert a new meeting and emit a timeline event."""
    meeting = CRMMeetingModel(**data)
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    logger.info(
        "Meeting created",
        extra={"meeting_id": meeting.id, "title": meeting.title, "customer_id": meeting.customer_id},
    )

    add_timeline_event(
        db,
        customer_id=meeting.customer_id,
        event_type="Meeting Scheduled",
        user=meeting.assigned_to or "System",
        status="Scheduled",
        notes=f"Meeting: {meeting.title} ({meeting.meeting_type}) on {meeting.scheduled_date} at {meeting.scheduled_time}",
        module="CRM",
    )
    return meeting


def update_meeting(db: Session, meeting_id: int, data: dict) -> CRMMeetingModel | None:
    """Apply a partial update to an existing meeting."""
    meeting = db.query(CRMMeetingModel).filter(CRMMeetingModel.id == meeting_id).first()
    if not meeting:
        logger.warning("update_meeting: meeting not found", extra={"meeting_id": meeting_id})
        return None

    old_outcome = meeting.outcome
    for key, val in data.items():
        if val is not None:
            setattr(meeting, key, val)

    db.commit()
    db.refresh(meeting)

    logger.info(
        "Meeting updated",
        extra={"meeting_id": meeting_id, "outcome": meeting.outcome},
    )

    if old_outcome != meeting.outcome and meeting.outcome:
        add_timeline_event(
            db,
            customer_id=meeting.customer_id,
            event_type="Meeting Completed",
            user=meeting.assigned_to or "System",
            status="Completed",
            notes=(
                f"Meeting: {meeting.title} ended with outcome: {meeting.outcome}. "
                f"Next Action: {meeting.next_action or 'None'}"
            ),
            module="CRM",
        )
    return meeting


def delete_meeting(db: Session, meeting_id: int) -> bool:
    """Delete a meeting.  Returns True on success, False if not found."""
    meeting = db.query(CRMMeetingModel).filter(CRMMeetingModel.id == meeting_id).first()
    if not meeting:
        logger.warning("delete_meeting: meeting not found", extra={"meeting_id": meeting_id})
        return False
    db.delete(meeting)
    db.commit()
    logger.info("Meeting deleted", extra={"meeting_id": meeting_id})
    return True


# ─── Follow-ups ───────────────────────────────────────────────────────────────

def get_followups(db: Session, customer_id: int | None = None) -> list[CRMFollowUpModel]:
    """Return all follow-ups, optionally filtered by customer."""
    query = db.query(CRMFollowUpModel)
    if customer_id:
        query = query.filter(CRMFollowUpModel.customer_id == customer_id)
    return query.order_by(CRMFollowUpModel.due_date.asc()).all()


def create_followup(db: Session, data: dict) -> CRMFollowUpModel:
    """Insert a new follow-up and emit a timeline event."""
    followup = CRMFollowUpModel(**data)
    db.add(followup)
    db.commit()
    db.refresh(followup)

    customer   = _get_customer(db, followup.customer_id)
    salesperson = _customer_salesperson(customer)

    logger.info(
        "Follow-up created",
        extra={"followup_id": followup.id, "customer_id": followup.customer_id},
    )

    add_timeline_event(
        db,
        customer_id=followup.customer_id,
        event_type="Follow-up Created",
        user=salesperson,
        status=followup.status,
        notes=f"Follow-up: {followup.title} (Due: {followup.due_date}, Priority: {followup.priority})",
        module="CRM",
    )
    return followup


def update_followup(db: Session, followup_id: int, data: dict) -> CRMFollowUpModel | None:
    """Apply a partial update to a follow-up."""
    followup = db.query(CRMFollowUpModel).filter(CRMFollowUpModel.id == followup_id).first()
    if not followup:
        logger.warning("update_followup: followup not found", extra={"followup_id": followup_id})
        return None

    old_status = followup.status
    for key, val in data.items():
        if val is not None:
            setattr(followup, key, val)

    db.commit()
    db.refresh(followup)

    logger.info(
        "Follow-up updated",
        extra={"followup_id": followup_id, "old_status": old_status, "new_status": followup.status},
    )

    if old_status != followup.status:
        customer    = _get_customer(db, followup.customer_id)
        salesperson = _customer_salesperson(customer)
        event = "Follow-up Completed" if followup.status == "Completed" else "Follow-up Updated"
        add_timeline_event(
            db,
            customer_id=followup.customer_id,
            event_type=event,
            user=salesperson,
            status=followup.status,
            notes=f"Follow-up: {followup.title} moved from {old_status} to {followup.status}",
            module="CRM",
        )
    return followup


def delete_followup(db: Session, followup_id: int) -> bool:
    """Delete a follow-up.  Returns True on success, False if not found."""
    followup = db.query(CRMFollowUpModel).filter(CRMFollowUpModel.id == followup_id).first()
    if not followup:
        logger.warning("delete_followup: followup not found", extra={"followup_id": followup_id})
        return False
    db.delete(followup)
    db.commit()
    logger.info("Follow-up deleted", extra={"followup_id": followup_id})
    return True

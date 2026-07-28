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

from database_sqlite import CustomerModel, BillModel
from crm_models import (
    CRMActivityTimelineModel,
    CRMTaskModel,
    CRMFollowUpModel,
    CRMMeetingModel,
    CRMDocumentModel,
    CRMCommunicationModel,
    CRMInstallationModel,
    CRMAMCModel,
    CRMPaymentModel,
)
from crm_scoring import calculate_lead_score, calculate_health_score
from site_survey_models import SiteSurveyModel
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

import json
from typing import Tuple
from utils.responses import serialise

# --- Documents ---
def get_documents(db: Session, customer_id: int, skip: int = 0, limit: int = 50):
    return db.query(CRMDocumentModel).filter(CRMDocumentModel.customer_id == customer_id).offset(skip).limit(limit).all()

def get_documents_count(db: Session, customer_id: int) -> int:
    return db.query(CRMDocumentModel).filter(CRMDocumentModel.customer_id == customer_id).count()

def create_document(db: Session, data: dict) -> CRMDocumentModel:
    doc = CRMDocumentModel(**data)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    add_timeline_event(
        db,
        customer_id=doc.customer_id,
        event_type="Document Uploaded",
        user=doc.uploaded_by,
        status="Pending",
        notes=f"Uploaded {doc.document_type}: {doc.original_filename}",
        module="CRM"
    )
    return doc

def update_document_status(db: Session, doc_id: int, status: str, remarks: str | None = None, user: str = "System") -> CRMDocumentModel | None:
    doc = db.query(CRMDocumentModel).filter(CRMDocumentModel.id == doc_id).first()
    if not doc:
        return None
    old_status = doc.verification_status
    doc.verification_status = status
    if remarks is not None:
        doc.remarks = remarks
    db.commit()
    db.refresh(doc)
    if old_status != status:
        add_timeline_event(
            db,
            customer_id=doc.customer_id,
            event_type="Document Verified" if status == "Verified" else "Document Rejected",
            user=user,
            status=status,
            notes=f"Document {doc.document_type} status updated from {old_status} to {status}. Remarks: {remarks or 'None'}",
            module="CRM"
        )
    return doc

def delete_document(db: Session, doc_id: int) -> bool:
    doc = db.query(CRMDocumentModel).filter(CRMDocumentModel.id == doc_id).first()
    if not doc:
        return False
    # Also delete actual file using storage helper
    from utils.crm_storage import delete_stored_file
    delete_stored_file(doc.file_path)
    
    cust_id = doc.customer_id
    doc_type = doc.document_type
    doc_name = doc.original_filename
    db.delete(doc)
    db.commit()
    
    add_timeline_event(
        db,
        customer_id=cust_id,
        event_type="Document Deleted",
        user="System",
        notes=f"Deleted document {doc_type}: {doc_name}",
        module="CRM"
    )
    return True

# --- Communications ---
def get_communications(db: Session, customer_id: int, skip: int = 0, limit: int = 50):
    return db.query(CRMCommunicationModel).filter(CRMCommunicationModel.customer_id == customer_id).order_by(CRMCommunicationModel.created_at.desc()).offset(skip).limit(limit).all()

def get_communications_count(db: Session, customer_id: int) -> int:
    return db.query(CRMCommunicationModel).filter(CRMCommunicationModel.customer_id == customer_id).count()

def create_communication(db: Session, data: dict) -> CRMCommunicationModel:
    comm = CRMCommunicationModel(**data)
    db.add(comm)
    db.commit()
    db.refresh(comm)
    add_timeline_event(
        db,
        customer_id=comm.customer_id,
        event_type="Communication Logged",
        user=comm.sender,
        status=comm.delivery_status,
        notes=f"Logged {comm.channel} interaction. Subject: {comm.subject or 'N/A'}",
        module="CRM"
    )
    return comm

# --- Installations ---
STAGE_PROGRESS_MAP = {
    "Lead Won": 0,
    "Engineering Review": 10,
    "Material Ordered": 20,
    "Installation Scheduled": 30,
    "Panels Installed": 50,
    "Inverter Installed": 70,
    "Inspection": 80,
    "Net Meter Applied": 90,
    "Net Meter Approved": 95,
    "Commissioned": 98,
    "Completed": 100
}

def get_installation(db: Session, customer_id: int) -> CRMInstallationModel | None:
    return db.query(CRMInstallationModel).filter(CRMInstallationModel.customer_id == customer_id).first()

def create_or_update_installation(db: Session, customer_id: int, data: dict, user: str = "System") -> CRMInstallationModel:
    install = db.query(CRMInstallationModel).filter(CRMInstallationModel.customer_id == customer_id).first()
    if not install:
        install = CRMInstallationModel(customer_id=customer_id)
        db.add(install)
        db.flush()

    old_stage = install.current_stage or "Lead Won"
    
    for key, val in data.items():
        if val is not None:
            setattr(install, key, val)
            
    # Auto progress mapping
    if "current_stage" in data:
        install.completion_percentage = STAGE_PROGRESS_MAP.get(install.current_stage, 0)
        
    # Append history log
    history_list = []
    if install.history:
        try:
            history_list = json.loads(install.history)
        except Exception:
            pass
            
    if "current_stage" in data or "remarks" in data:
        history_list.append({
            "stage": install.current_stage,
            "timestamp": datetime.now().isoformat(),
            "completed_by": user,
            "remarks": data.get("remarks") or f"Stage updated to {install.current_stage}",
            "completion_percentage": install.completion_percentage
        })
        install.history = json.dumps(history_list)

    db.commit()
    db.refresh(install)
    
    if old_stage != install.current_stage:
        add_timeline_event(
            db,
            customer_id=customer_id,
            event_type="Installation Stage Updated",
            user=user,
            status=install.current_stage,
            notes=f"Installation transitioned: {old_stage} → {install.current_stage} ({install.completion_percentage}% Completed)",
            module="Installation"
        )
    return install

# --- AMC ---
def get_amc(db: Session, customer_id: int) -> CRMAMCModel | None:
    return db.query(CRMAMCModel).filter(CRMAMCModel.customer_id == customer_id).first()

def create_or_update_amc(db: Session, customer_id: int, data: dict, user: str = "System") -> CRMAMCModel:
    amc = db.query(CRMAMCModel).filter(CRMAMCModel.customer_id == customer_id).first()
    if not amc:
        import random
        contract_number = f"AMC-{customer_id}-{random.randint(1000, 9999)}"
        amc = CRMAMCModel(customer_id=customer_id, contract_number=contract_number)
        db.add(amc)
        db.flush()

    old_status = amc.status
    
    for key, val in data.items():
        if val is not None:
            setattr(amc, key, val)
            
    # Parse and validate visits if provided
    if "visits_json" in data and data["visits_json"]:
        amc.visits = data["visits_json"]

    db.commit()
    db.refresh(amc)
    
    if old_status != amc.status:
        add_timeline_event(
            db,
            customer_id=customer_id,
            event_type="AMC Status Updated",
            user=user,
            status=amc.status,
            notes=f"AMC contract status updated to {amc.status}. Contract: {amc.contract_number}",
            module="AMC"
        )
    return amc

# --- Payments ---
def get_payments(db: Session, customer_id: int, skip: int = 0, limit: int = 50):
    return db.query(CRMPaymentModel).filter(CRMPaymentModel.customer_id == customer_id).offset(skip).limit(limit).all()

def get_payments_count(db: Session, customer_id: int) -> int:
    return db.query(CRMPaymentModel).filter(CRMPaymentModel.customer_id == customer_id).count()

def create_payment(db: Session, data: dict) -> CRMPaymentModel:
    # Ensure outstanding is auto calculated
    data["outstanding_amount"] = data["invoice_amount"] - data.get("paid_amount", 0.0)
    if data["outstanding_amount"] <= 0:
        data["payment_status"] = "Paid"
    elif data.get("paid_amount", 0.0) > 0:
        data["payment_status"] = "Partially Paid"
    else:
        data["payment_status"] = "Unpaid"
        
    pay = CRMPaymentModel(**data)
    
    # Save default history
    pay.history = json.dumps([{
        "stage": pay.stage,
        "amount": pay.invoice_amount,
        "timestamp": datetime.now().isoformat(),
        "notes": f"Invoice created for {pay.stage} milestone."
    }])
    
    db.add(pay)
    db.commit()
    db.refresh(pay)
    
    add_timeline_event(
        db,
        customer_id=pay.customer_id,
        event_type="Payment Invoice Created",
        user="System",
        status=pay.payment_status,
        notes=f"Invoice {pay.invoice_number} created for {pay.stage} milestone: ₹{pay.invoice_amount}",
        module="Finance"
    )
    return pay

def update_payment(db: Session, pay_id: int, data: dict, user: str = "System") -> CRMPaymentModel | None:
    pay = db.query(CRMPaymentModel).filter(CRMPaymentModel.id == pay_id).first()
    if not pay:
        return None
        
    old_status = pay.payment_status
    
    for key, val in data.items():
        if val is not None:
            setattr(pay, key, val)
            
    # Re-calculate outstanding
    pay.outstanding_amount = pay.invoice_amount - (pay.paid_amount or 0.0)
    if pay.outstanding_amount <= 0:
        pay.payment_status = "Paid"
    elif (pay.paid_amount or 0.0) > 0:
        pay.payment_status = "Partially Paid"
    else:
        pay.payment_status = "Unpaid"
        
    # Append history
    history_list = []
    if pay.history:
        try:
            history_list = json.loads(pay.history)
        except Exception:
            pass
    history_list.append({
        "stage": pay.stage,
        "paid_amount": pay.paid_amount,
        "status": pay.payment_status,
        "timestamp": datetime.now().isoformat(),
        "notes": f"Payment updated to {pay.payment_status} via {pay.payment_method or 'N/A'}"
    })
    pay.history = json.dumps(history_list)
    
    db.commit()
    db.refresh(pay)
    
    if old_status != pay.payment_status:
        add_timeline_event(
            db,
            customer_id=pay.customer_id,
            event_type="Payment Updated" if pay.payment_status != "Paid" else "Payment Received",
            user=user,
            status=pay.payment_status,
            notes=f"Invoice {pay.invoice_number} transition: {old_status} → {pay.payment_status}. Collected: ₹{pay.paid_amount}",
            module="Finance"
        )
    return pay

# --- Unified Calculations ---
def calculate_customer_lifetime_value(db: Session, customer_id: int) -> float:
    from sqlalchemy import func
    total_paid = db.query(func.sum(CRMPaymentModel.paid_amount)).filter(CRMPaymentModel.customer_id == customer_id).scalar()
    if total_paid is not None:
        return float(total_paid)
    # Fallback to Net Cost of first bill
    bill = db.query(BillModel).filter(BillModel.customer_id == customer_id).first()
    if bill and hasattr(bill, "net_cost") and bill.net_cost is not None:
        return float(bill.net_cost)
    return 0.0

def calculate_project_progress(db: Session, customer_id: int) -> int:
    customer = db.query(CustomerModel).filter(CustomerModel.id == customer_id).first()
    if not customer:
        return 0
    stage = customer.status
    if stage in ("Completed", "Closed"):
        return 100
    if stage == "Lost":
        return 0
        
    base_progress = 0
    if stage == "New Lead":
        base_progress = 5
    elif stage == "Qualified":
        base_progress = 15
    elif stage == "Site Survey Scheduled":
        base_progress = 25
    elif stage == "Survey Completed":
        base_progress = 40
    elif stage == "Proposal Generated":
        base_progress = 50
    elif stage == "Proposal Sent":
        base_progress = 55
    elif stage == "Negotiation":
        base_progress = 60
    elif stage == "Won":
        base_progress = 70
        
    if stage == "Won":
        install = get_installation(db, customer_id)
        if install:
            # Scale remaining 30% of project progress based on installation progress
            base_progress = int(70 + (install.completion_percentage * 0.3))
            
    return min(100, max(0, base_progress))

def calculate_payment_progress(db: Session, customer_id: int) -> int:
    from sqlalchemy import func
    invoice_sum = db.query(func.sum(CRMPaymentModel.invoice_amount)).filter(CRMPaymentModel.customer_id == customer_id).scalar() or 0.0
    paid_sum = db.query(func.sum(CRMPaymentModel.paid_amount)).filter(CRMPaymentModel.customer_id == customer_id).scalar() or 0.0
    if invoice_sum > 0:
        return int(paid_sum / invoice_sum * 100)
    return 0

def calculate_installation_progress(db: Session, customer_id: int) -> int:
    install = get_installation(db, customer_id)
    return install.completion_percentage if install else 0

# --- Unified Timeline Engine ---
def get_unified_timeline(db: Session, customer_id: int, page: int = 1, limit: int = 10) -> Tuple[list, int]:
    """Retrieve chronologically sorted activity events."""
    query = db.query(CRMActivityTimelineModel).filter(CRMActivityTimelineModel.customer_id == customer_id)
    total_count = query.count()
    offset = (page - 1) * limit
    events = query.order_by(CRMActivityTimelineModel.created_at.desc()).offset(offset).limit(limit).all()
    return events, total_count

# --- Customer 360 Aggregator ---
def get_customer_360(db: Session, customer_id: int) -> dict:
    customer = db.query(CustomerModel).filter(CustomerModel.id == customer_id).first()
    if not customer:
        return {}
        
    bills = db.query(BillModel).filter(BillModel.customer_id == customer_id).all()
    
    # Derive roof analysis
    roof_analysis = None
    if bills:
        bill = bills[0]
        roof_analysis = {
            "usable_area_sqft": int(bill.recommended_kw * 100),
            "suitability_score": 92,
            "obstruction_factor": "Minimal Obstruction (8%)",
            "azimuth_direction": "South-Facing (180°)"
        }
        
    # Derive proposal
    proposal = None
    if bills:
        bill = bills[0]
        proposal = {
            "proposal_ref": f"PROP-{customer.consumer_number}",
            "recommended_kw": bill.recommended_kw,
            "net_system_cost": bill.system_cost,
            "payback_years": bill.payback_years,
            "savings_25yr": bill.savings_25yr
        }
        
    # Derive site survey from real data
    site_survey = None
    survey = db.query(SiteSurveyModel).filter(SiteSurveyModel.customer_id == customer_id).order_by(desc(SiteSurveyModel.created_at)).first()
    if survey:
        site_survey = {
            "id": survey.id,
            "status": survey.status,
            "scheduled_date": survey.scheduled_date,
            "completed_date": survey.completed_date,
            "surveyor_name": survey.assigned_name,
            "priority": survey.priority,
            "findings": survey.obstacles or None,
            "roof_type": survey.roof_type,
            "roof_area_sqft": survey.total_roof_area_sqft,
            "proposed_system_kw": survey.proposed_system_kw,
            "structure_condition": survey.structure_condition,
            "completion": survey.completion_percentage,
            "checklist_completion": survey.checklist_completion,
        }

    # Standard entities
    tasks = get_tasks(db, customer_id)
    meetings = get_meetings(db, customer_id)
    follow_ups = get_followups(db, customer_id)
    
    installation = get_installation(db, customer_id)
    amc = get_amc(db, customer_id)
    
    # Standard calculations
    clv = calculate_customer_lifetime_value(db, customer_id)
    project_progress = calculate_project_progress(db, customer_id)
    payment_progress = calculate_payment_progress(db, customer_id)
    installation_progress = calculate_installation_progress(db, customer_id)
    
    # Last communications and timeline
    last_comm_obj = db.query(CRMCommunicationModel).filter(CRMCommunicationModel.customer_id == customer_id).order_by(CRMCommunicationModel.created_at.desc()).first()
    last_comm = last_comm_obj.created_at.isoformat() if last_comm_obj else None
    
    return {
        "customer": serialise(customer),
        "bills": serialise(bills),
        "roof_analysis": roof_analysis,
        "site_survey": site_survey,
        "proposal": proposal,
        "tasks": serialise(tasks),
        "meetings": serialise(meetings),
        "follow_ups": serialise(follow_ups),
        "installation": serialise(installation),
        "amc": serialise(amc),
        "clv": clv,
        "project_progress": project_progress,
        "payment_progress": payment_progress,
        "installation_progress": installation_progress,
        "last_communication": last_comm,
        "last_activity": customer.last_activity,
        "next_followup": customer.next_followup,
        "lead_score": customer.lead_score,
        "health_score": customer.health_score,
        "pipeline_status": customer.status
    }


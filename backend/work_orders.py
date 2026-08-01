"""
Phase 3 - Work Order Management
Technician views their assigned jobs, updates status, adds notes, uploads
photos/documents/signature, manages a completion checklist, and marks the
job complete. Completing a work order auto-generates an Earning record.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from database import get_db
from technician_models import WorkOrder, JobPosting, Technician, Earning
from work_order_extras_models import WorkOrderNote, WorkOrderAttachment, WorkOrderChecklistItem
from technician_auth import get_current_technician
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/technician/work-orders", tags=["Work Orders"])

VALID_STATUSES = ["Assigned", "In Progress", "Completed", "Verified"]


class WorkOrderStatusUpdate(BaseModel):
    status: str
    notes: str = None
    proof_photo_url: str = None


class NoteCreate(BaseModel):
    note: str


class AttachmentCreate(BaseModel):
    file_url: str   # returned by POST /api/upload


class ChecklistItemsCreate(BaseModel):
    items: List[str]


def _get_owned_work_order(work_order_id: int, db: Session, current_technician: Technician) -> WorkOrder:
    work_order = db.query(WorkOrder).filter(
        WorkOrder.id == work_order_id,
        WorkOrder.technician_id == current_technician.id
    ).first()
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found.")
    return work_order


@router.get("/")
def list_my_work_orders(db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    orders = db.query(WorkOrder).filter(
        WorkOrder.technician_id == current_technician.id
    ).order_by(WorkOrder.assigned_at.desc()).all()

    result = []
    for wo in orders:
        job = db.query(JobPosting).filter(JobPosting.id == wo.job_id).first()
        result.append({
            "id": wo.id,
            "job_title": job.title if job else "N/A",
            "job_type": job.job_type if job else "N/A",
            "city": job.city if job else "N/A",
            "budget": job.budget if job else None,
            "status": wo.status,
            "assigned_at": wo.assigned_at.isoformat(),
            "completed_at": wo.completed_at.isoformat() if wo.completed_at else None
        })
    return {"success": True, "work_orders": result}


@router.get("/{work_order_id}")
def get_work_order_detail(work_order_id: int, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    wo = _get_owned_work_order(work_order_id, db, current_technician)
    job = db.query(JobPosting).filter(JobPosting.id == wo.job_id).first()

    notes = db.query(WorkOrderNote).filter(WorkOrderNote.work_order_id == wo.id).order_by(WorkOrderNote.created_at.desc()).all()
    attachments = db.query(WorkOrderAttachment).filter(WorkOrderAttachment.work_order_id == wo.id).all()
    checklist = db.query(WorkOrderChecklistItem).filter(WorkOrderChecklistItem.work_order_id == wo.id).all()

    return {
        "success": True,
        "work_order": {
            "id": wo.id,
            "status": wo.status,
            "notes": wo.notes,
            "assigned_at": wo.assigned_at.isoformat(),
            "started_at": wo.started_at.isoformat() if wo.started_at else None,
            "completed_at": wo.completed_at.isoformat() if wo.completed_at else None,
            "job": {
                "id": job.id, "title": job.title, "description": job.description,
                "job_type": job.job_type, "city": job.city, "budget": job.budget
            } if job else None,
            "notes_log": [{"id": n.id, "note": n.note, "created_at": n.created_at.isoformat()} for n in notes],
            "photos": [a.file_url for a in attachments if a.file_type == "photo"],
            "documents": [a.file_url for a in attachments if a.file_type == "document"],
            "signature": next((a.file_url for a in attachments if a.file_type == "signature"), None),
            "checklist": [
                {"id": c.id, "item_text": c.item_text, "is_checked": c.is_checked,
                 "checked_at": c.checked_at.isoformat() if c.checked_at else None}
                for c in checklist
            ]
        }
    }


@router.patch("/{work_order_id}/status")
def update_work_order_status(
    work_order_id: int,
    data: WorkOrderStatusUpdate,
    db: Session = Depends(get_db),
    current_technician: Technician = Depends(get_current_technician)
):
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(VALID_STATUSES)}")

    work_order = _get_owned_work_order(work_order_id, db, current_technician)

    if data.status == "Completed" and not (data.proof_photo_url or work_order.proof_photo_url):
        raise HTTPException(status_code=400, detail="A completion proof photo is required before marking this job as completed.")

    work_order.status = data.status
    if data.notes:
        work_order.notes = data.notes
    if data.proof_photo_url:
        work_order.proof_photo_url = data.proof_photo_url

    if data.status == "In Progress" and not work_order.started_at:
        work_order.started_at = datetime.utcnow()

    if data.status == "Completed":
        work_order.completed_at = datetime.utcnow()
        job = db.query(JobPosting).filter(JobPosting.id == work_order.job_id).first()
        if job:
            job.status = "Completed"
            existing_earning = db.query(Earning).filter(Earning.work_order_id == work_order.id).first()
            if not existing_earning and job.budget:
                earning = Earning(
                    technician_id=current_technician.id,
                    work_order_id=work_order.id,
                    amount=job.budget,
                    payout_status="Pending"
                )
                db.add(earning)
                logger.info("Earning of Rs.%s created for technician %s (work order %s)",
                            job.budget, current_technician.email, work_order.id)

    db.commit()
    return {"success": True, "message": f"Work order status updated to '{data.status}'."}


@router.post("/{work_order_id}/notes")
def add_note(work_order_id: int, data: NoteCreate, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    wo = _get_owned_work_order(work_order_id, db, current_technician)
    note = WorkOrderNote(work_order_id=wo.id, note=data.note)
    db.add(note)
    db.commit()
    db.refresh(note)
    return {"success": True, "message": "Note added.", "note": {"id": note.id, "note": note.note, "created_at": note.created_at.isoformat()}}


@router.post("/{work_order_id}/photos")
def add_photo(work_order_id: int, data: AttachmentCreate, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    wo = _get_owned_work_order(work_order_id, db, current_technician)
    attachment = WorkOrderAttachment(work_order_id=wo.id, file_url=data.file_url, file_type="photo")
    db.add(attachment)
    db.commit()
    return {"success": True, "message": "Photo attached to work order."}


@router.post("/{work_order_id}/documents")
def add_document(work_order_id: int, data: AttachmentCreate, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    wo = _get_owned_work_order(work_order_id, db, current_technician)
    attachment = WorkOrderAttachment(work_order_id=wo.id, file_url=data.file_url, file_type="document")
    db.add(attachment)
    db.commit()
    return {"success": True, "message": "Document attached to work order."}


@router.post("/{work_order_id}/signature")
def add_signature(work_order_id: int, data: AttachmentCreate, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    wo = _get_owned_work_order(work_order_id, db, current_technician)
    existing = db.query(WorkOrderAttachment).filter(
        WorkOrderAttachment.work_order_id == wo.id, WorkOrderAttachment.file_type == "signature"
    ).first()
    if existing:
        existing.file_url = data.file_url
    else:
        db.add(WorkOrderAttachment(work_order_id=wo.id, file_url=data.file_url, file_type="signature"))
    db.commit()
    return {"success": True, "message": "Customer signature captured."}


@router.post("/{work_order_id}/checklist")
def add_checklist_items(work_order_id: int, data: ChecklistItemsCreate, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    wo = _get_owned_work_order(work_order_id, db, current_technician)
    created = []
    for text in data.items:
        item = WorkOrderChecklistItem(work_order_id=wo.id, item_text=text)
        db.add(item)
        created.append(item)
    db.commit()
    return {"success": True, "message": f"{len(created)} checklist item(s) added."}


@router.patch("/{work_order_id}/checklist/{item_id}/toggle")
def toggle_checklist_item(work_order_id: int, item_id: int, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    wo = _get_owned_work_order(work_order_id, db, current_technician)
    item = db.query(WorkOrderChecklistItem).filter(
        WorkOrderChecklistItem.id == item_id, WorkOrderChecklistItem.work_order_id == wo.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found.")
    item.is_checked = not item.is_checked
    item.checked_at = datetime.utcnow() if item.is_checked else None
    db.commit()
    return {"success": True, "is_checked": item.is_checked}


@router.post("/{work_order_id}/complete")
def complete_work_order(work_order_id: int, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    """Dedicated completion endpoint: validates a photo + signature exist before completing."""
    wo = _get_owned_work_order(work_order_id, db, current_technician)

    if wo.status == "Completed":
        raise HTTPException(status_code=400, detail="This work order is already marked completed.")

    has_photo = db.query(WorkOrderAttachment).filter(
        WorkOrderAttachment.work_order_id == wo.id, WorkOrderAttachment.file_type == "photo"
    ).first() is not None
    has_signature = db.query(WorkOrderAttachment).filter(
        WorkOrderAttachment.work_order_id == wo.id, WorkOrderAttachment.file_type == "signature"
    ).first() is not None

    if not has_photo:
        raise HTTPException(status_code=400, detail="At least one completion photo is required.")
    if not has_signature:
        raise HTTPException(status_code=400, detail="Customer signature is required to complete this work order.")

    incomplete_items = db.query(WorkOrderChecklistItem).filter(
        WorkOrderChecklistItem.work_order_id == wo.id, WorkOrderChecklistItem.is_checked == False
    ).count()
    if incomplete_items > 0:
        raise HTTPException(status_code=400, detail=f"{incomplete_items} checklist item(s) are still unchecked.")

    wo.status = "Completed"
    wo.completed_at = datetime.utcnow()

    job = db.query(JobPosting).filter(JobPosting.id == wo.job_id).first()
    if job:
        job.status = "Completed"
        existing_earning = db.query(Earning).filter(Earning.work_order_id == wo.id).first()
        if not existing_earning and job.budget:
            db.add(Earning(
                technician_id=current_technician.id,
                work_order_id=wo.id,
                amount=job.budget,
                payout_status="Pending"
            ))
            logger.info("Earning of Rs.%s created for technician %s (work order %s)",
                        job.budget, current_technician.email, wo.id)

    db.commit()
    return {"success": True, "message": "Work order marked as completed."}
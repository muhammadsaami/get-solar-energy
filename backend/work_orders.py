"""
Technician views their assigned jobs and updates status through the lifecycle:
Assigned -> In Progress -> Completed (requires proof photo).
Completing a work order auto-generates an Earning record from the job's budget.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from technician_models import WorkOrder, JobPosting, Technician, Earning
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
            "notes": wo.notes,
            "proof_photo_url": wo.proof_photo_url,
            "assigned_at": wo.assigned_at.isoformat(),
            "completed_at": wo.completed_at.isoformat() if wo.completed_at else None
        })
    return {"success": True, "work_orders": result}


@router.patch("/{work_order_id}/status")
def update_work_order_status(
    work_order_id: int,
    data: WorkOrderStatusUpdate,
    db: Session = Depends(get_db),
    current_technician: Technician = Depends(get_current_technician)
):
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(VALID_STATUSES)}")

    work_order = db.query(WorkOrder).filter(
        WorkOrder.id == work_order_id,
        WorkOrder.technician_id == current_technician.id
    ).first()
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found.")

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
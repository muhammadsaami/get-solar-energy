"""
Phase 3 (extension) - Technician Dashboard
A single aggregated endpoint so the frontend doesn't need to fire 6+ separate
calls on page load. Pulls from tables that already exist (training, jobs,
work orders, earnings, certifications). Notification and performance/rating
sections return empty placeholders for now — they'll populate automatically
once the Notifications and Performance modules are built (same DB, no
frontend changes needed later).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from technician_models import (
    Technician, TrainingModule, TechnicianTrainingProgress, Certification,
    JobPosting, WorkOrder, Earning
)
from technician_auth import get_current_technician
from datetime import datetime

router = APIRouter(prefix="/api/technician", tags=["Technician Dashboard"])


@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    tech = current_technician

    # ── Training progress ──────────────────────────────────────────────
    total_modules = db.query(TrainingModule).filter(TrainingModule.is_active == True).count()
    passed_modules = db.query(TechnicianTrainingProgress).filter(
        TechnicianTrainingProgress.technician_id == tech.id,
        TechnicianTrainingProgress.status == "Passed"
    ).count()
    completion_pct = round((passed_modules / total_modules) * 100) if total_modules > 0 else 0
    certifications_count = db.query(Certification).filter(Certification.technician_id == tech.id).count()

    # ── Work orders ─────────────────────────────────────────────────────
    all_work_orders = db.query(WorkOrder).filter(WorkOrder.technician_id == tech.id).all()
    completed_orders = [wo for wo in all_work_orders if wo.status == "Completed"]
    active_orders = [wo for wo in all_work_orders if wo.status in ("Assigned", "In Progress")]

    today = datetime.utcnow().date()
    todays_schedule = []
    for wo in active_orders:
        job = db.query(JobPosting).filter(JobPosting.id == wo.job_id).first()
        todays_schedule.append({
            "work_order_id": wo.id,
            "job_title": job.title if job else "N/A",
            "job_type": job.job_type if job else "N/A",
            "city": job.city if job else "N/A",
            "status": wo.status,
            "assigned_at": wo.assigned_at.isoformat()
        })

    upcoming_work_orders = sorted(todays_schedule, key=lambda x: x["assigned_at"])[:5]

    # ── Earnings ────────────────────────────────────────────────────────
    earnings = db.query(Earning).filter(Earning.technician_id == tech.id).all()
    total_earned = sum(e.amount for e in earnings)
    total_pending = sum(e.amount for e in earnings if e.payout_status == "Pending")
    total_paid = sum(e.amount for e in earnings if e.payout_status == "Paid")

    # ── KPI summary ─────────────────────────────────────────────────────
    kpi_summary = {
        "jobs_completed": len(completed_orders),
        "jobs_in_progress": len(active_orders),
        "total_earned": total_earned,
        "certifications_earned": certifications_count,
        "training_completion_pct": completion_pct
    }

    return {
        "success": True,
        "profile": {
            "id": tech.id,
            "name": tech.name,
            "email": tech.email,
            "city": tech.city,
            "skill_level": tech.skill_level,
            "kyc_status": tech.kyc_status
        },
        "kpi_summary": kpi_summary,
        "todays_schedule": todays_schedule,
        "upcoming_work_orders": upcoming_work_orders,
        "training_progress": {
            "completion_pct": completion_pct,
            "modules_passed": passed_modules,
            "total_modules": total_modules,
            "certifications_earned": certifications_count
        },
        "earnings_summary": {
            "total_earned": total_earned,
            "total_pending": total_pending,
            "total_paid": total_paid
        },
        # Placeholders — populate once these modules are built:
        "notifications": {"unread_count": 0, "recent": []},
        "performance_summary": {"average_rating": None, "total_ratings": 0, "badges": []}
    }
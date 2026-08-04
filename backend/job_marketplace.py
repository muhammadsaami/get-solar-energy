"""
Phase 3 - Job Marketplace
Vendors post jobs -> technicians browse/apply -> vendor accepts an applicant
-> a WorkOrder is created automatically for the accepted technician.

NOTE: /post, /{job_id}/applications and /applications/{id}/accept currently
take vendor_email as a plain field / have no vendor auth guard. Once your
Phase 2 vendor_auth.py exposes a get_current_vendor() dependency, swap these
open endpoints to use it (same pattern as get_current_technician below) so
only the vendor who owns the job can view applicants / accept them.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from technician_models import JobPosting, JobApplication, WorkOrder, Technician
from technician_auth import get_current_technician
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/jobs", tags=["Job Marketplace"])

# Separate router for technician-facing job endpoints — different URL prefix
# ("/api/technician/jobs/...") than the main job marketplace routes above.
technician_jobs_router = APIRouter(prefix="/api/technician/jobs", tags=["Job Marketplace"])


class JobPostRequest(BaseModel):
    vendor_email: str
    title: str
    description: str = None
    job_type: str          # Installation, AMC, Repair, Inspection
    city: str
    budget: float = None
    required_skill_level: str = "Level 1"


class ApplicationStatusUpdate(BaseModel):
    status: str   # "Withdrawn" is the main technician-facing use case


@router.post("/post")
def post_job(data: JobPostRequest, db: Session = Depends(get_db)):
    job = JobPosting(
        vendor_email=data.vendor_email,
        title=data.title,
        description=data.description,
        job_type=data.job_type,
        city=data.city,
        budget=data.budget,
        required_skill_level=data.required_skill_level,
        status="Open"
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    logger.info("Job posted: %s by %s", job.title, data.vendor_email)
    return {"success": True, "message": "Job posted successfully!", "job_id": job.id}


@router.get("/open")
def list_open_jobs(
    city: str = None,
    job_type: str = None,
    db: Session = Depends(get_db),
    current_technician: Technician = Depends(get_current_technician)
):
    query = db.query(JobPosting).filter(JobPosting.status == "Open")
    if city:
        query = query.filter(JobPosting.city == city)
    if job_type:
        query = query.filter(JobPosting.job_type == job_type)
    jobs = query.order_by(JobPosting.created_at.desc()).all()

    already_applied_ids = {
        a.job_id for a in db.query(JobApplication).filter(
            JobApplication.technician_id == current_technician.id
        ).all()
    }

    return {
        "success": True,
        "jobs": [
            {
                "id": j.id,
                "title": j.title,
                "description": j.description,
                "job_type": j.job_type,
                "city": j.city,
                "budget": j.budget,
                "required_skill_level": j.required_skill_level,
                "already_applied": j.id in already_applied_ids,
                "posted_at": j.created_at.isoformat()
            } for j in jobs
        ]
    }


@router.get("/{job_id}")
def get_job_detail(job_id: int, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    my_application = db.query(JobApplication).filter(
        JobApplication.job_id == job_id, JobApplication.technician_id == current_technician.id
    ).first()

    return {
        "success": True,
        "job": {
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "job_type": job.job_type,
            "city": job.city,
            "budget": job.budget,
            "required_skill_level": job.required_skill_level,
            "status": job.status,
            "posted_at": job.created_at.isoformat(),
            "my_application_status": my_application.status if my_application else None
        }
    }


@router.post("/{job_id}/apply")
def apply_to_job(job_id: int, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.status != "Open":
        raise HTTPException(status_code=400, detail="This job is no longer open for applications.")

    existing = db.query(JobApplication).filter(
        JobApplication.job_id == job_id,
        JobApplication.technician_id == current_technician.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied to this job.")

    application = JobApplication(job_id=job_id, technician_id=current_technician.id, status="Applied")
    db.add(application)
    db.commit()
    logger.info("Technician %s applied to job %s", current_technician.email, job_id)

    return {"success": True, "message": "Application submitted successfully!"}


@router.get("/{job_id}/applications")
def list_applications(job_id: int, db: Session = Depends(get_db)):
    applications = db.query(JobApplication).filter(JobApplication.job_id == job_id).all()
    result = []
    for a in applications:
        tech = db.query(Technician).filter(Technician.id == a.technician_id).first()
        result.append({
            "application_id": a.id,
            "technician_id": tech.id,
            "technician_name": tech.name,
            "skill_level": tech.skill_level,
            "city": tech.city,
            "status": a.status,
            "applied_at": a.applied_at.isoformat()
        })
    return {"success": True, "applications": result}


@router.post("/applications/{application_id}/accept")
def accept_application(application_id: int, db: Session = Depends(get_db)):
    application = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    job = db.query(JobPosting).filter(JobPosting.id == application.job_id).first()
    if job.status != "Open":
        raise HTTPException(status_code=400, detail="Job is no longer open.")

    application.status = "Accepted"
    job.status = "Assigned"

    other_apps = db.query(JobApplication).filter(
        JobApplication.job_id == job.id,
        JobApplication.id != application_id
    ).all()
    for a in other_apps:
        a.status = "Rejected"

    work_order = WorkOrder(
        job_id=job.id,
        technician_id=application.technician_id,
        status="Assigned"
    )
    db.add(work_order)
    db.commit()
    db.refresh(work_order)
    logger.info("Job %s assigned via application %s -> work_order %s", job.id, application_id, work_order.id)

    return {"success": True, "message": "Technician assigned successfully!", "work_order_id": work_order.id}


# ── Technician-facing application management ──────────────────────────────

@technician_jobs_router.get("/applied")
def list_my_applied_jobs(db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    """Jobs the technician has applied to but that aren't finished yet."""
    applications = db.query(JobApplication).filter(
        JobApplication.technician_id == current_technician.id,
        JobApplication.status.in_(["Applied", "Accepted"])
    ).order_by(JobApplication.applied_at.desc()).all()

    result = []
    for a in applications:
        job = db.query(JobPosting).filter(JobPosting.id == a.job_id).first()
        result.append({
            "application_id": a.id,
            "job_id": job.id if job else None,
            "job_title": job.title if job else "N/A",
            "job_type": job.job_type if job else "N/A",
            "city": job.city if job else "N/A",
            "application_status": a.status,
            "job_status": job.status if job else "N/A",
            "applied_at": a.applied_at.isoformat()
        })
    return {"success": True, "applied_jobs": result}


@technician_jobs_router.get("/history")
def list_my_job_history(db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    """Jobs that reached a final state (rejected, withdrawn) or whose job posting is completed."""
    applications = db.query(JobApplication).filter(
        JobApplication.technician_id == current_technician.id
    ).order_by(JobApplication.applied_at.desc()).all()

    result = []
    for a in applications:
        job = db.query(JobPosting).filter(JobPosting.id == a.job_id).first()
        is_history = a.status in ("Rejected", "Withdrawn") or (job and job.status == "Completed")
        if is_history:
            result.append({
                "application_id": a.id,
                "job_id": job.id if job else None,
                "job_title": job.title if job else "N/A",
                "job_type": job.job_type if job else "N/A",
                "city": job.city if job else "N/A",
                "application_status": a.status,
                "job_status": job.status if job else "N/A",
                "applied_at": a.applied_at.isoformat()
            })
    return {"success": True, "history": result}


@router.patch("/application/{application_id}")
def update_application_status(
    application_id: int,
    data: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_technician: Technician = Depends(get_current_technician)
):
    application = db.query(JobApplication).filter(
        JobApplication.id == application_id,
        JobApplication.technician_id == current_technician.id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")
    if application.status == "Accepted":
        raise HTTPException(status_code=400, detail="This application has already been accepted and cannot be changed here.")

    application.status = data.status
    db.commit()
    return {"success": True, "message": f"Application status updated to '{data.status}'."}


@router.delete("/application/{application_id}")
def delete_application(application_id: int, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    application = db.query(JobApplication).filter(
        JobApplication.id == application_id,
        JobApplication.technician_id == current_technician.id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")
    if application.status == "Accepted":
        raise HTTPException(status_code=400, detail="This application has already been accepted and cannot be withdrawn.")

    db.delete(application)
    db.commit()
    return {"success": True, "message": "Application withdrawn successfully."}
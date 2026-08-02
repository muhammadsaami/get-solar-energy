"""
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


class JobPostRequest(BaseModel):
    vendor_email: str
    title: str
    description: str = None
    job_type: str          # Installation, AMC, Repair, Inspection
    city: str
    budget: float = None
    required_skill_level: str = "Level 1"


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
    # Auto-seed initial demo work orders if table is empty
    if db.query(JobPosting).count() == 0:
        seed_jobs = [
            JobPosting(vendor_email="vendor1@getsolar.in", title="Solar Rooftop Installation Specialist 5kW", description="Rooftop array mounting, DC isolation, and string wiring for residential villa.", job_type="Installation", city="Mumbai", budget=15000.0, required_skill_level="Level 1", status="Open"),
            JobPosting(vendor_email="vendor2@getsolar.in", title="High-Voltage Commercial Solar Panel Mounting", description="100kW industrial array rail alignment and structural clamping.", job_type="Installation", city="Delhi NCR", budget=28000.0, required_skill_level="Level 2", status="Open"),
            JobPosting(vendor_email="vendor1@getsolar.in", title="Annual Maintenance Contract (AMC) Diagnostic Audit", description="Preventive AMC servicing, thermal camera hotspot scanning, and IV curve tracing.", job_type="AMC", city="Mumbai", budget=8500.0, required_skill_level="Level 1", status="Open"),
            JobPosting(vendor_email="vendor3@getsolar.in", title="Hybrid Inverter & Storage Microgrid Integration", description="Commissioning 20kWh lithium battery storage with hybrid smart inverter.", job_type="Repair", city="Bengaluru", budget=18500.0, required_skill_level="Level 2", status="Open"),
            JobPosting(vendor_email="vendor2@getsolar.in", title="DISCOM Net-Metering Compliance & Inspection", description="Verification audit of transformer isolation and bidirectional meter sync.", job_type="Inspection", city="Pune", budget=12000.0, required_skill_level="Level 2", status="Open"),
        ]
        db.add_all(seed_jobs)
        db.commit()

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
                "posted_at": j.created_at.isoformat() if j.created_at else None
            } for j in jobs
        ]
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
        raise HTTPException(status_code=400, detail="You have already applied for this job.")

    application = JobApplication(
        job_id=job_id,
        technician_id=current_technician.id
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    logger.info("Technician %s applied for job %s", current_technician.email, job_id)
    return {"success": True, "message": "Application submitted successfully!", "application_id": application.id}
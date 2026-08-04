"""
Phase 3 (extension) - Technician Performance, Ratings, Skills, Badges

NOTE: POST /ratings/{work_order_id} has no vendor/customer auth gate yet since
Phase 2 vendor auth doesn't exist — same caveat as job_marketplace.py's open
endpoints. Swap for a proper get_current_vendor()/customer dependency later.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from technician_models import Technician, WorkOrder
from performance_models import Rating, TechnicianSkill, TechnicianBadge
from technician_auth import get_current_technician

router = APIRouter(prefix="/api/technician", tags=["Performance & Ratings"])

BADGE_RULES = [
    {"name": "First Job Completed", "min_jobs": 1},
    {"name": "5 Jobs Milestone", "min_jobs": 5},
    {"name": "10 Jobs Milestone", "min_jobs": 10},
    {"name": "25 Jobs Milestone", "min_jobs": 25},
]


class RatingCreate(BaseModel):
    rating: int   # 1-5
    review_text: str = None
    rated_by_email: str = None


class SkillCreate(BaseModel):
    skill_name: str


def _award_missing_badges(db: Session, technician: Technician):
    completed_jobs = db.query(WorkOrder).filter(
        WorkOrder.technician_id == technician.id, WorkOrder.status == "Completed"
    ).count()

    existing_badge_names = {
        b.badge_name for b in db.query(TechnicianBadge).filter(TechnicianBadge.technician_id == technician.id).all()
    }

    for rule in BADGE_RULES:
        if completed_jobs >= rule["min_jobs"] and rule["name"] not in existing_badge_names:
            db.add(TechnicianBadge(technician_id=technician.id, badge_name=rule["name"]))

    ratings = db.query(Rating).filter(Rating.technician_id == technician.id).all()
    if len(ratings) >= 3:
        avg_rating = sum(r.rating for r in ratings) / len(ratings)
        if avg_rating >= 4.5 and "Top Rated" not in existing_badge_names:
            db.add(TechnicianBadge(technician_id=technician.id, badge_name="Top Rated"))

    db.commit()


@router.get("/performance")
def get_performance(db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    _award_missing_badges(db, current_technician)

    completed_jobs = db.query(WorkOrder).filter(
        WorkOrder.technician_id == current_technician.id, WorkOrder.status == "Completed"
    ).count()
    ratings = db.query(Rating).filter(Rating.technician_id == current_technician.id).all()
    avg_rating = round(sum(r.rating for r in ratings) / len(ratings), 2) if ratings else None
    badges_count = db.query(TechnicianBadge).filter(TechnicianBadge.technician_id == current_technician.id).count()

    return {
        "success": True,
        "jobs_completed": completed_jobs,
        "average_rating": avg_rating,
        "total_ratings": len(ratings),
        "badges_earned": badges_count,
        "skill_level": current_technician.skill_level,
        "kyc_status": current_technician.kyc_status
    }


@router.get("/ratings")
def get_ratings(db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    ratings = db.query(Rating).filter(
        Rating.technician_id == current_technician.id
    ).order_by(Rating.created_at.desc()).all()
    return {
        "success": True,
        "ratings": [
            {
                "id": r.id, "work_order_id": r.work_order_id, "rating": r.rating,
                "review_text": r.review_text, "created_at": r.created_at.isoformat()
            } for r in ratings
        ]
    }


@router.post("/ratings/{work_order_id}")
def submit_rating(work_order_id: int, data: RatingCreate, db: Session = Depends(get_db)):
    if not (1 <= data.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5.")

    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found.")

    existing = db.query(Rating).filter(Rating.work_order_id == work_order_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="This work order has already been rated.")

    rating = Rating(
        technician_id=work_order.technician_id,
        work_order_id=work_order_id,
        rating=data.rating,
        review_text=data.review_text,
        rated_by_email=data.rated_by_email
    )
    db.add(rating)
    db.commit()
    return {"success": True, "message": "Rating submitted successfully!"}


@router.get("/skills")
def get_skills(db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    skills = db.query(TechnicianSkill).filter(TechnicianSkill.technician_id == current_technician.id).all()
    return {"success": True, "skills": [{"id": s.id, "skill_name": s.skill_name} for s in skills]}


@router.post("/skills")
def add_skill(data: SkillCreate, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    existing = db.query(TechnicianSkill).filter(
        TechnicianSkill.technician_id == current_technician.id,
        TechnicianSkill.skill_name == data.skill_name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="This skill is already added.")

    skill = TechnicianSkill(technician_id=current_technician.id, skill_name=data.skill_name)
    db.add(skill)
    db.commit()
    return {"success": True, "message": "Skill added successfully."}


@router.get("/badges")
def get_badges(db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    _award_missing_badges(db, current_technician)
    badges = db.query(TechnicianBadge).filter(TechnicianBadge.technician_id == current_technician.id).all()
    return {
        "success": True,
        "badges": [{"badge_name": b.badge_name, "awarded_at": b.awarded_at.isoformat()} for b in badges]
    }
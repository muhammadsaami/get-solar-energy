"""
Phase 3 - Training Portal & Certification System
Technicians go through Level 1 / Level 2 modules -> pass quiz (>= passing_score)
-> once all modules of a level are passed, a Certification is auto-issued.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from technician_models import (
    TrainingModule, TrainingQuizQuestion, TechnicianTrainingProgress,
    Certification, Technician
)
from technician_auth import get_current_technician
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/technician/training", tags=["Technician Training"])


class QuizSubmission(BaseModel):
    module_id: int
    answers: dict   # { "<question_id>": "A" }


@router.get("/modules")
def list_modules(db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    modules = db.query(TrainingModule).filter(TrainingModule.is_active == True).order_by(TrainingModule.order_index).all()
    result = []
    for m in modules:
        progress = db.query(TechnicianTrainingProgress).filter(
            TechnicianTrainingProgress.technician_id == current_technician.id,
            TechnicianTrainingProgress.module_id == m.id
        ).first()
        result.append({
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "level": m.level,
            "content_url": m.content_url,
            "status": progress.status if progress else "Not Started",
            "score": progress.score if progress else None
        })
    return {"success": True, "modules": result}


@router.get("/modules/{module_id}/quiz")
def get_quiz(module_id: int, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    questions = db.query(TrainingQuizQuestion).filter(TrainingQuizQuestion.module_id == module_id).all()
    if not questions:
        raise HTTPException(status_code=404, detail="No quiz found for this module.")
    return {
        "success": True,
        "questions": [
            {
                "id": q.id,
                "question": q.question,
                "options": {"A": q.option_a, "B": q.option_b, "C": q.option_c, "D": q.option_d}
            } for q in questions
        ]
    }


@router.post("/quiz/submit")
def submit_quiz(data: QuizSubmission, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    module = db.query(TrainingModule).filter(TrainingModule.id == data.module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found.")

    questions = db.query(TrainingQuizQuestion).filter(TrainingQuizQuestion.module_id == data.module_id).all()
    if not questions:
        raise HTTPException(status_code=404, detail="No quiz found for this module.")

    correct_count = 0
    for q in questions:
        submitted_answer = data.answers.get(str(q.id))
        if submitted_answer and submitted_answer.upper() == q.correct_option.upper():
            correct_count += 1

    score = round((correct_count / len(questions)) * 100)
    passed = score >= module.passing_score

    progress = db.query(TechnicianTrainingProgress).filter(
        TechnicianTrainingProgress.technician_id == current_technician.id,
        TechnicianTrainingProgress.module_id == data.module_id
    ).first()

    if not progress:
        progress = TechnicianTrainingProgress(
            technician_id=current_technician.id,
            module_id=data.module_id,
            attempts=0
        )
        db.add(progress)

    progress.attempts += 1
    progress.score = score
    progress.status = "Passed" if passed else "Failed"
    progress.completed_at = datetime.utcnow() if passed else None
    db.commit()

    if passed:
        _check_and_issue_certification(db, current_technician, module.level)

    return {
        "success": True,
        "score": score,
        "passed": passed,
        "passing_score": module.passing_score,
        "message": "Congratulations, you passed!" if passed else
                   f"You scored {score}%. Minimum required is {module.passing_score}%. Please retake the quiz."
    }


def _check_and_issue_certification(db: Session, technician: Technician, level: str):
    """Issues a certification once every active module in this level is passed."""
    level_modules = db.query(TrainingModule).filter(
        TrainingModule.level == level, TrainingModule.is_active == True
    ).all()
    level_module_ids = [m.id for m in level_modules]
    if not level_module_ids:
        return

    passed_count = db.query(TechnicianTrainingProgress).filter(
        TechnicianTrainingProgress.technician_id == technician.id,
        TechnicianTrainingProgress.module_id.in_(level_module_ids),
        TechnicianTrainingProgress.status == "Passed"
    ).count()

    if passed_count < len(level_module_ids):
        return

    existing_cert = db.query(Certification).filter(
        Certification.technician_id == technician.id,
        Certification.level == level
    ).first()
    if existing_cert:
        return

    cert = Certification(
        technician_id=technician.id,
        level=level,
        badge_name=f"GET Solar Certified Technician - {level}",
        certificate_number=f"GSE-{level.replace(' ', '')}-{uuid.uuid4().hex[:8].upper()}",
        valid_till=None
    )
    db.add(cert)
    technician.skill_level = level
    db.commit()
    logger.info("Certification issued to %s for %s", technician.email, level)


@router.get("/certifications")
def get_certifications(db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    certs = db.query(Certification).filter(Certification.technician_id == current_technician.id).all()
    return {
        "success": True,
        "certifications": [
            {
                "level": c.level,
                "badge_name": c.badge_name,
                "certificate_number": c.certificate_number,
                "issued_at": c.issued_at.isoformat()
            } for c in certs
        ]
    }
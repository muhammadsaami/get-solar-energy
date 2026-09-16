import json
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database_sqlite import get_sqlite_db
from site_survey_models import SiteSurveyModel, SiteSurveyPhotoModel
from crm_service import add_timeline_event
from crm_audit import record_audit
from utils.responses import serialise
from utils.logger import get_logger

logger = get_logger(__name__)

VALID_TRANSITIONS = {
    "scheduled": ["assigned", "cancelled"],
    "assigned": ["traveling", "cancelled"],
    "traveling": ["on_site", "cancelled"],
    "on_site": ["uploading", "cancelled"],
    "uploading": ["ai_analysis", "cancelled"],
    "ai_analysis": ["review", "cancelled"],
    "review": ["approved", "changes_requested", "cancelled"],
    "changes_requested": ["on_site", "cancelled"],
    "approved": ["proposal_ready", "cancelled"],
    "proposal_ready": ["cancelled"],
    "cancelled": [],
}

CHECKLIST_DEFAULTS = [
    {"id": "roof_accessible", "label": "Roof accessible", "done": False},
    {"id": "roof_safe", "label": "Roof safe for walking", "done": False},
    {"id": "panel_location", "label": "Panel location verified", "done": False},
    {"id": "electrical_panel", "label": "Electrical panel inspected", "done": False},
    {"id": "meter_confirmed", "label": "Meter confirmed", "done": False},
    {"id": "ground_clearance", "label": "Ground clearance adequate", "done": False},
    {"id": "tree_shading", "label": "Tree shading checked", "done": False},
    {"id": "obstacles_documented", "label": "Obstacles documented", "done": False},
    {"id": "safety_equipment", "label": "Safety equipment verified", "done": False},
    {"id": "engineer_signature", "label": "Engineer signature obtained", "done": False},
]


def _validate_transition(current: str, next_status: str) -> None:
    allowed = VALID_TRANSITIONS.get(current, [])
    if next_status not in allowed:
        raise ValueError(f"Invalid status transition: {current} -> {next_status}")


def create_survey(db: Session, data: dict, user: str = "System") -> SiteSurveyModel:
    survey = SiteSurveyModel(
        customer_id=data.get("customer_id"),
        customer_name=data.get("customer_name", "Unknown"),
        assigned_to=data.get("assigned_to"),
        assigned_name=data.get("assigned_name"),
        status="scheduled",
        priority=data.get("priority", "normal"),
        scheduled_date=data.get("scheduled_date"),
        city=data.get("city"),
        roof_type=data.get("roof_type"),
        roof_age_years=data.get("roof_age_years"),
        total_roof_area_sqft=data.get("total_roof_area_sqft"),
        shading_present=data.get("shading_present", False),
        shading_details=data.get("shading_details"),
        obstacles=data.get("obstacles"),
        electrical_panel_distance_m=data.get("electrical_panel_distance_m"),
        structure_condition=data.get("structure_condition"),
        proposed_system_kw=data.get("proposed_system_kw"),
        checklist_items=json.dumps(CHECKLIST_DEFAULTS),
        checklist_completion=0,
        completion_percentage=0,
    )
    db.add(survey)
    db.commit()
    db.refresh(survey)
    logger.info("Survey created", extra={"survey_id": survey.id, "customer": survey.customer_name})

    if survey.customer_id:
        add_timeline_event(db, survey.customer_id, "Site Survey Scheduled", user=user, module="SiteSurvey", notes=f"Survey #{survey.id} created for {survey.customer_name}")
        record_audit(db, action="survey.created", module="SiteSurvey", entity_type="SiteSurvey", entity_id=survey.id, user=user, new_value={"status": "scheduled", "customer_name": survey.customer_name})

    return survey


def get_survey(db: Session, survey_id: int) -> Optional[SiteSurveyModel]:
    return db.query(SiteSurveyModel).filter(SiteSurveyModel.id == survey_id).first()


def get_surveys(
    db: Session,
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    customer_id: Optional[int] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_desc: bool = True,
    page: int = 1,
    limit: int = 20,
):
    query = db.query(SiteSurveyModel)

    if status:
        query = query.filter(SiteSurveyModel.status == status)
    if assigned_to:
        query = query.filter(SiteSurveyModel.assigned_to == assigned_to)
    if customer_id:
        query = query.filter(SiteSurveyModel.customer_id == customer_id)
    if search:
        term = f"%{search}%"
        query = query.filter(
            SiteSurveyModel.customer_name.ilike(term) |
            SiteSurveyModel.city.ilike(term) |
            SiteSurveyModel.assigned_name.ilike(term)
        )

    total = query.count()

    sort_col = getattr(SiteSurveyModel, sort_by, SiteSurveyModel.created_at)
    order_fn = desc if sort_desc else lambda c: c
    query = query.order_by(order_fn(sort_col))

    surveys = query.offset((page - 1) * limit).limit(limit).all()

    return surveys, total


def update_survey(db: Session, survey_id: int, data: dict) -> Optional[SiteSurveyModel]:
    survey = get_survey(db, survey_id)
    if not survey:
        return None

    allowed_fields = {
        "customer_name", "city", "roof_type", "roof_age_years",
        "total_roof_area_sqft", "shading_present", "shading_details",
        "obstacles", "electrical_panel_distance_m", "structure_condition",
        "proposed_system_kw", "surveyor_notes", "customer_notes",
        "scheduled_date", "priority", "assigned_to", "assigned_name",
        "usable_area_sqft", "area_required_sqft", "feasibility_score",
        "feasibility_status", "mounting_structure_type",
        "cable_run_estimate_meters", "estimated_additional_cost_rs",
        "site_assessment_summary", "identified_risks", "recommendations",
        "shading_impact_note", "checklist_items", "checklist_completion",
        "completion_percentage", "report_generated", "report_url",
    }

    for key, value in data.items():
        if key in allowed_fields:
            if isinstance(value, list):
                value = json.dumps(value)
            setattr(survey, key, value)

    db.commit()
    db.refresh(survey)
    logger.info("Survey updated", extra={"survey_id": survey_id})
    return survey


def update_survey_status(db: Session, survey_id: int, new_status: str, user: str = "System") -> Optional[SiteSurveyModel]:
    survey = get_survey(db, survey_id)
    if not survey:
        return None

    old_status = survey.status
    _validate_transition(survey.status, new_status)
    survey.status = new_status

    if new_status == "approved":
        survey.completed_date = datetime.now().strftime("%Y-%m-%d")
        survey.completion_percentage = 100
    elif new_status == "review":
        survey.completion_percentage = 90
    elif new_status == "uploading":
        survey.completion_percentage = 60
    elif new_status == "on_site":
        survey.completion_percentage = 30

    db.commit()
    db.refresh(survey)
    logger.info("Survey status changed", extra={"survey_id": survey_id, "status": new_status})

    event_label = new_status.replace("_", " ").title()
    if survey.customer_id:
        add_timeline_event(db, survey.customer_id, f"Site Survey: {event_label}", user=user, module="SiteSurvey", status=new_status, notes=f"Survey #{survey_id} moved from {old_status} to {new_status}")
        record_audit(db, action=f"survey.status.{new_status}", module="SiteSurvey", entity_type="SiteSurvey", entity_id=survey_id, user=user, old_value={"status": old_status}, new_value={"status": new_status})

    return survey


def assign_surveyor(db: Session, survey_id: int, assigned_to: str, assigned_name: str, user: str = "System") -> Optional[SiteSurveyModel]:
    survey = get_survey(db, survey_id)
    if not survey:
        return None
    old_assigned = survey.assigned_name
    survey.assigned_to = assigned_to
    survey.assigned_name = assigned_name
    if survey.status == "scheduled":
        survey.status = "assigned"
    db.commit()
    db.refresh(survey)
    logger.info("Survey assigned", extra={"survey_id": survey_id, "assigned_to": assigned_to})
    if survey.customer_id:
        add_timeline_event(db, survey.customer_id, "Surveyor Assigned", user=user, module="SiteSurvey", notes=f"Survey #{survey_id} assigned to {assigned_name}")
        record_audit(db, action="survey.assigned", module="SiteSurvey", entity_type="SiteSurvey", entity_id=survey_id, user=user, old_value={"assigned_name": old_assigned}, new_value={"assigned_name": assigned_name})
    return survey


def delete_survey(db: Session, survey_id: int, user: str = "System") -> bool:
    survey = get_survey(db, survey_id)
    if not survey:
        return False
    customer_id = survey.customer_id
    customer_name = survey.customer_name
    db.delete(survey)
    db.commit()
    logger.info("Survey deleted", extra={"survey_id": survey_id})
    if customer_id:
        add_timeline_event(db, customer_id, "Site Survey Cancelled", user=user, module="SiteSurvey", notes=f"Survey #{survey_id} for {customer_name} was cancelled")
        record_audit(db, action="survey.deleted", module="SiteSurvey", entity_type="SiteSurvey", entity_id=survey_id, user=user, old_value={"customer_name": customer_name})
    return True


def add_photo(db: Session, survey_id: int, data: dict) -> Optional[SiteSurveyPhotoModel]:
    survey = get_survey(db, survey_id)
    if not survey:
        return None
    photo = SiteSurveyPhotoModel(
        survey_id=survey_id,
        uploaded_by=data.get("uploaded_by"),
        file_name=data.get("file_name", "photo"),
        file_path=data.get("file_path", ""),
        caption=data.get("caption"),
        photo_category=data.get("photo_category", "other"),
        gps_lat=data.get("gps_lat"),
        gps_lng=data.get("gps_lng"),
        timestamp=data.get("timestamp"),
        file_size=data.get("file_size"),
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


def get_photos(db: Session, survey_id: int):
    return db.query(SiteSurveyPhotoModel).filter(
        SiteSurveyPhotoModel.survey_id == survey_id
    ).order_by(desc(SiteSurveyPhotoModel.created_at)).all()


def delete_photo(db: Session, photo_id: int) -> bool:
    photo = db.query(SiteSurveyPhotoModel).filter(SiteSurveyPhotoModel.id == photo_id).first()
    if not photo:
        return False
    db.delete(photo)
    db.commit()
    return True


def get_dashboard_stats(db: Session, user_email: Optional[str] = None, is_admin: bool = False):
    query = db.query(SiteSurveyModel)
    if not is_admin:
        query = query.filter(SiteSurveyModel.assigned_to == user_email)

    total = query.count()
    scheduled = query.filter(SiteSurveyModel.status == "scheduled").count()
    assigned_q = query.filter(SiteSurveyModel.status == "assigned").count()
    traveling = query.filter(SiteSurveyModel.status == "traveling").count()
    on_site = query.filter(SiteSurveyModel.status == "on_site").count()
    uploading = query.filter(SiteSurveyModel.status == "uploading").count()
    ai_analysis = query.filter(SiteSurveyModel.status == "ai_analysis").count()
    review = query.filter(SiteSurveyModel.status == "review").count()
    approved = query.filter(SiteSurveyModel.status == "approved").count()
    cancelled = query.filter(SiteSurveyModel.status == "cancelled").count()
    proposal_ready = query.filter(SiteSurveyModel.status == "proposal_ready").count()

    pending_review = review
    today_count = query.filter(SiteSurveyModel.scheduled_date == datetime.now().strftime("%Y-%m-%d")).count()

    completed_surveys = query.filter(
        SiteSurveyModel.status.in_(["approved", "proposal_ready"])
    ).count()

    avg_feasibility = 0
    if completed_surveys > 0:
        result = db.query(SiteSurveyModel.feasibility_score).filter(
            SiteSurveyModel.feasibility_score.isnot(None),
            SiteSurveyModel.status.in_(["approved", "proposal_ready"])
        ).all()
        scores = [r[0] for r in result if r[0] is not None]
        avg_feasibility = round(sum(scores) / len(scores), 1) if scores else 0

    completion_rate = round((completed_surveys / total * 100), 1) if total > 0 else 0

    return {
        "total": total,
        "scheduled": scheduled,
        "assigned": assigned_q,
        "traveling": traveling,
        "on_site": on_site,
        "uploading": uploading,
        "ai_analysis": ai_analysis,
        "review": review,
        "approved": approved,
        "cancelled": cancelled,
        "proposal_ready": proposal_ready,
        "pending_review": pending_review,
        "today_count": today_count,
        "completed_surveys": completed_surveys,
        "avg_feasibility_score": avg_feasibility,
        "completion_rate": completion_rate,
    }


def update_checklist(db: Session, survey_id: int, checklist: list) -> Optional[SiteSurveyModel]:
    survey = get_survey(db, survey_id)
    if not survey:
        return None
    done_count = sum(1 for item in checklist if item.get("done"))
    completion = round((done_count / len(checklist)) * 100) if checklist else 0
    survey.checklist_items = json.dumps(checklist)
    survey.checklist_completion = completion
    db.commit()
    db.refresh(survey)
    return survey


def to_dict(survey: SiteSurveyModel) -> dict:
    result = serialise(survey)
    if result and "checklist_items" in result and isinstance(result["checklist_items"], str):
        try:
            result["checklist_items"] = json.loads(result["checklist_items"])
        except (json.JSONDecodeError, TypeError):
            result["checklist_items"] = []
    if result and "identified_risks" in result and isinstance(result["identified_risks"], str):
        try:
            result["identified_risks"] = json.loads(result["identified_risks"])
        except (json.JSONDecodeError, TypeError):
            result["identified_risks"] = []
    if result and "recommendations" in result and isinstance(result["recommendations"], str):
        try:
            result["recommendations"] = json.loads(result["recommendations"])
        except (json.JSONDecodeError, TypeError):
            result["recommendations"] = []
    return result

import json
import re
import logging
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func, Integer

from project_models import ProjectModel
from database_sqlite import BaseSqlite

logger = logging.getLogger(__name__)

_JSON_FIELDS = frozenset({
    "notes", "tasks", "activities", "documents",
    "risk_flags", "stage_start_dates", "stage_completion_dates"
})

_DATE_FIELDS = frozenset({"start_date", "target_date", "completed_date"})

def _next_display_id(db: Session) -> str:
    max_num = db.query(
        sql_func.max(
            sql_func.cast(
                sql_func.substr(ProjectModel.display_id, 5, 10),
                Integer
            )
        )
    ).scalar()
    next_num = (max_num or 0) + 1
    return f"PRJ-{next_num:03d}"


def _parse_date(val) -> Optional[date]:
    if val is None:
        return None
    if isinstance(val, date):
        return val
    if isinstance(val, str):
        val = val.strip()
        if not val:
            return None
        for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%fZ"):
            try:
                return datetime.strptime(val, fmt).date()
            except (ValueError, TypeError):
                continue
    return None


def _serialize_date(val) -> Optional[str]:
    if val is None:
        return None
    if isinstance(val, date):
        return val.isoformat()
    if isinstance(val, datetime):
        return val.date().isoformat()
    if isinstance(val, str):
        return val
    return None


def _to_frontend_dict(project: ProjectModel) -> Dict[str, Any]:
    """Convert snake_case DB model to camelCase frontend dict."""
    result = {}
    mapping = {
        "display_id": "id",
        "title": "title",
        "project_type": "projectType",
        "description": "description",
        "customer_name": "customerName",
        "customer_email": "customerEmail",
        "customer_phone": "customerPhone",
        "address": "address",
        "city": "city",
        "state": "state",
        "pincode": "pincode",
        "status": "status",
        "progress": "progress",
        "priority": "priority",
        "start_date": "startDate",
        "target_date": "targetDate",
        "completed_date": "completedDate",
        "assigned_engineer": "assignedEngineer",
        "assigned_team": "assignedTeam",
        "solar_system_size": "solarSystemSize",
        "panel_count": "panelCount",
        "panel_capacity": "panelCapacity",
        "inverter_model": "inverterModel",
        "battery_model": "batteryModel",
        "total_budget": "totalBudget",
        "project_value": "projectValue",
        "currency": "currency",
        "budget_variance": "budgetVariance",
        "timeline_variance": "timelineVariance",
        "health_score": "healthScore",
        "quality_score": "qualityScore",
        "safety_score": "safetyScore",
        "notes": "notes",
        "tasks": "tasks",
        "activities": "activities",
        "documents": "documents",
        "risk_flags": "riskFlags",
        "stage_start_dates": "stageStartDates",
        "stage_completion_dates": "stageCompletionDates",
        "created_at": "createdAt",
        "updated_at": "updatedAt",
    }

    for col in project.__table__.columns:
        col_name = col.name
        frontend_key = mapping.get(col_name, col_name)
        val = getattr(project, col_name)

        if col_name in _JSON_FIELDS:
            if isinstance(val, str) and val:
                try:
                    val = json.loads(val)
                except (json.JSONDecodeError, TypeError):
                    val = [] if col_name in ("notes", "tasks", "activities", "documents", "risk_flags") else {}
            elif val is None:
                val = [] if col_name in ("notes", "tasks", "activities", "documents", "risk_flags") else {}
        elif col_name in _DATE_FIELDS:
            val = _serialize_date(val)
        elif col_name == "id":
            continue
        elif col_name in ("created_at", "updated_at"):
            val = val.isoformat() if hasattr(val, "isoformat") else str(val) if val else None
        elif frontend_key == "id":
            result["id"] = val
            continue

        result[frontend_key] = val

    return result


def _from_frontend_dict(data: dict) -> dict:
    """Convert camelCase frontend fields to snake_case DB columns."""
    rev_mapping = {
        "id": "display_id",
        "projectType": "project_type",
        "customerName": "customer_name",
        "customerEmail": "customer_email",
        "customerPhone": "customer_phone",
        "assignedEngineer": "assigned_engineer",
        "assignedTeam": "assigned_team",
        "solarSystemSize": "solar_system_size",
        "panelCount": "panel_count",
        "panelCapacity": "panel_capacity",
        "inverterModel": "inverter_model",
        "batteryModel": "battery_model",
        "totalBudget": "total_budget",
        "projectValue": "project_value",
        "budgetVariance": "budget_variance",
        "timelineVariance": "timeline_variance",
        "healthScore": "health_score",
        "qualityScore": "quality_score",
        "safetyScore": "safety_score",
        "startDate": "start_date",
        "targetDate": "target_date",
        "completedDate": "completed_date",
        "riskFlags": "risk_flags",
        "stageStartDates": "stage_start_dates",
        "stageCompletionDates": "stage_completion_dates",
        "createdAt": "created_at",
        "updatedAt": "updated_at",
    }

    # Fields where the frontend name matches the DB name
    SAME_NAME = frozenset({
        "title", "description", "address", "city", "state", "pincode",
        "status", "progress", "priority", "currency",
        "notes", "tasks", "activities", "documents",
    })

    result = {}
    for key, val in data.items():
        if key in rev_mapping:
            db_key = rev_mapping[key]
        elif key in SAME_NAME:
            db_key = key
        else:
            continue

        if db_key in _JSON_FIELDS:
            if not isinstance(val, str):
                val = json.dumps(val, default=str)
        elif db_key in _DATE_FIELDS:
            parsed = _parse_date(val)
            if parsed is not None:
                val = parsed

        result[db_key] = val

    return result


def get_projects(
    db: Session,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    stage: Optional[str] = None
) -> List[ProjectModel]:
    query = db.query(ProjectModel)
    if status:
        query = query.filter(ProjectModel.status == status)
    if priority:
        query = query.filter(ProjectModel.priority == priority)
    if stage:
        query = query.filter(ProjectModel.status == stage)
    return query.order_by(ProjectModel.created_at.desc()).all()


def get_project(db: Session, project_id: str) -> Optional[ProjectModel]:
    return db.query(ProjectModel).filter(ProjectModel.display_id == project_id).first()


def create_project(db: Session, data: dict) -> ProjectModel:
    db_data = _from_frontend_dict(data)
    db_data["display_id"] = _next_display_id(db)

    if not db_data.get("title"):
        db_data["title"] = f"Project {db_data['display_id']}"

    for json_field in _JSON_FIELDS:
        if json_field not in db_data or db_data[json_field] is None:
            if json_field in ("stage_start_dates", "stage_completion_dates"):
                db_data[json_field] = "{}"
            else:
                db_data[json_field] = "[]"

    stage = db_data.get("status", "initiation")
    today_str = date.today().isoformat()
    try:
        stage_dates = json.loads(db_data.get("stage_start_dates", "{}"))
    except (json.JSONDecodeError, TypeError):
        stage_dates = {}
    if isinstance(stage_dates, dict) and stage not in stage_dates:
        stage_dates[stage] = today_str
        db_data["stage_start_dates"] = json.dumps(stage_dates)

    project = ProjectModel(**db_data)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(db: Session, project_id: str, data: dict) -> Optional[ProjectModel]:
    project = get_project(db, project_id)
    if not project:
        return None

    db_data = _from_frontend_dict(data)
    if not db_data:
        return project

    old_status = project.status

    for key, val in db_data.items():
        if val is not None and hasattr(project, key):
            setattr(project, key, val)

    new_status = project.status
    if new_status != old_status:
        _append_activity(project, old_status, new_status)

    db.commit()
    db.refresh(project)
    return project


def update_project_stage(db: Session, project_id: str, new_stage: str) -> Optional[ProjectModel]:
    project = get_project(db, project_id)
    if not project:
        return None

    old_status = project.status
    if old_status == new_stage:
        return project

    project.status = new_stage

    today_str = date.today().isoformat()
    try:
        stage_start = json.loads(project.stage_start_dates) if isinstance(project.stage_start_dates, str) else (project.stage_start_dates or {})
    except (json.JSONDecodeError, TypeError):
        stage_start = {}
    try:
        stage_completion = json.loads(project.stage_completion_dates) if isinstance(project.stage_completion_dates, str) else (project.stage_completion_dates or {})
    except (json.JSONDecodeError, TypeError):
        stage_completion = {}

    if old_status in stage_start and old_status not in stage_completion:
        stage_completion[old_status] = today_str

    if new_stage not in stage_start:
        stage_start[new_stage] = today_str

    project.stage_start_dates = json.dumps(stage_start)
    project.stage_completion_dates = json.dumps(stage_completion)

    _append_activity(project, old_status, new_stage)

    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: str) -> bool:
    project = get_project(db, project_id)
    if not project:
        return False
    db.delete(project)
    db.commit()
    return True


def get_project_metrics(db: Session) -> dict:
    projects = db.query(ProjectModel).all()
    total = len(projects)
    if total == 0:
        return {
            "total_projects": 0,
            "pipeline_value": 0,
            "avg_health_score": 0,
            "avg_progress": 0,
            "stage_counts": {},
            "project_type_counts": {},
        }

    pipeline_value = sum(p.project_value or 0 for p in projects)
    avg_health = sum(p.health_score or 0 for p in projects) / total
    avg_progress = sum(p.progress or 0 for p in projects) / total

    stage_counts = {}
    project_type_counts = {}
    for p in projects:
        s = p.status or "unknown"
        stage_counts[s] = stage_counts.get(s, 0) + 1
        t = p.project_type or "unknown"
        project_type_counts[t] = project_type_counts.get(t, 0) + 1

    return {
        "total_projects": total,
        "pipeline_value": pipeline_value,
        "avg_health_score": round(avg_health, 1),
        "avg_progress": round(avg_progress, 1),
        "stage_counts": stage_counts,
        "project_type_counts": project_type_counts,
    }


def _append_activity(project: ProjectModel, old_status: str, new_status: str) -> None:
    try:
        activities = json.loads(project.activities) if isinstance(project.activities, str) else (project.activities or [])
    except (json.JSONDecodeError, TypeError):
        activities = []

    if not isinstance(activities, list):
        activities = []

    activity_id = f"A-{project.display_id.replace('PRJ-', '')}-{len(activities)}"
    activities.append({
        "id": activity_id,
        "type": "stage_change",
        "message": f"Project moved from {old_status} to {new_status}",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S"),
        "user": "System",
    })

    project.activities = json.dumps(activities)

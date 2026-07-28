import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date, datetime

from database_sqlite import get_sqlite_db
from security import verify_token
from utils.responses import ok, server_error
from utils.logger import log_api_request, log_api_response
from site_survey_models import SiteSurveyModel
from services.project_service import get_projects, get_project_metrics, _to_frontend_dict
from project_models import ProjectModel
from crm_models import CRMTaskModel, CRMMeetingModel, CRMInstallationModel, CRMAMCModel

router = APIRouter(tags=["Vendor Portal"])
logger = logging.getLogger(__name__)


def _get_vendor_team(user_email: str) -> str:
    team = user_email.split('@')[0].replace('.', ' ').title()
    return team


@router.get("/api/vendor/dashboard")
def vendor_dashboard(
    user_email: str = Depends(verify_token),
    db: Session = Depends(get_sqlite_db),
):
    log_api_request(logger, "GET", "/api/vendor/dashboard")
    try:
        team = _get_vendor_team(user_email)
        projects = db.query(ProjectModel).filter(
            ProjectModel.assigned_team == team
        ).order_by(ProjectModel.created_at.desc()).all()

        project_list = [_to_frontend_dict(p) for p in projects]
        total = len(projects)
        active = [p for p in projects if p.status not in ("completed", "amc")]
        completed = [p for p in projects if p.status == "completed"]
        delayed = [p for p in projects if p.timeline_variance and p.timeline_variance > 0 and p.status not in ("completed", "amc")]

        tasks = db.query(CRMTaskModel).filter(
            CRMTaskModel.assigned_to.ilike(f"%{team}%")
        ).all()
        today_str = date.today().isoformat()
        todays_tasks = [t for t in tasks if t.due_date and t.due_date >= today_str and t.status != "Completed"]
        overdue_tasks = [t for t in tasks if t.due_date and t.due_date < today_str and t.status != "Completed"]

        meetings = db.query(CRMMeetingModel).filter(
            CRMMeetingModel.assigned_to.ilike(f"%{team}%"),
            CRMMeetingModel.scheduled_date >= today_str,
        ).order_by(CRMMeetingModel.scheduled_date).all()

        visits_today = [m for m in meetings if m.meeting_type == "Site Visit" and m.scheduled_date == today_str]
        visits_upcoming = [m for m in meetings if m.meeting_type == "Site Visit" and m.scheduled_date > today_str]

        installations = db.query(CRMInstallationModel).filter(
            CRMInstallationModel.assigned_engineer.ilike(f"%{team}%")
        ).all()
        active_installations = [i for i in installations if i.current_stage not in ("completed", "cancelled")]

        amc_records = db.query(CRMAMCModel).filter(
            CRMAMCModel.assigned_engineer.ilike(f"%{team}%")
        ).all()

        surveys = db.query(SiteSurveyModel).filter(
            SiteSurveyModel.assigned_name.ilike(f"%{team}%")
        ).all()
        surveys_today = [s for s in surveys if s.scheduled_date == today_str]
        surveys_pending = [s for s in surveys if s.status not in ("approved", "cancelled")]
        surveys_approved = [s for s in surveys if s.status == "approved"]
        surveys_on_site = [s for s in surveys if s.status == "on_site"]
        surveys_review = [s for s in surveys if s.status == "review"]

        score = round(sum(p.health_score or 80 for p in projects) / max(total, 1), 1)
        progress = round(sum(p.progress or 0 for p in active) / max(len(active), 1), 1) if active else 0

        return ok(data={
            "kpis": {
                "todaysJobs": len(visits_today) + len(todays_tasks),
                "activeInstallations": len(active_installations),
                "pendingSiteVisits": len(visits_upcoming) + len(visits_today),
                "overdueWorkOrders": len(overdue_tasks),
                "slaCompliance": round(len([p for p in active if (p.health_score or 80) >= 70]) / max(len(active), 1) * 100, 1) if active else 100,
                "escalatedIssues": len([t for t in overdue_tasks if t.priority == "critical"]),
                "amcVisitsThisWeek": len(amc_records),
                "completionRate": round(len(completed) / max(total, 1) * 100, 1) if total else 0,
                "totalProjects": total,
                "activeProjects": len(active),
                "delayedProjects": len(delayed),
                "avgHealthScore": score,
                "avgProgress": progress,
                "surveysToday": len(surveys_today),
                "surveysPending": len(surveys_pending),
                "surveysApproved": len(surveys_approved),
                "surveysOnSite": len(surveys_on_site),
                "surveysReview": len(surveys_review),
                "totalSurveys": len(surveys),
            },
            "projects": project_list,
            "todaysVisits": [{
                "id": m.id,
                "title": m.title,
                "customerId": m.customer_id,
                "scheduledDate": m.scheduled_date,
                "scheduledTime": m.scheduled_time,
                "meetingType": m.meeting_type,
                "outcome": m.outcome,
            } for m in visits_today],
            "upcomingVisits": [{
                "id": m.id,
                "title": m.title,
                "customerId": m.customer_id,
                "scheduledDate": m.scheduled_date,
                "scheduledTime": m.scheduled_time,
                "meetingType": m.meeting_type,
            } for m in visits_upcoming],
            "todaysTasks": [{
                "id": t.id,
                "title": t.title,
                "priority": t.priority,
                "dueDate": t.due_date,
                "status": t.status,
            } for t in todays_tasks],
            "overdueTasks": [{
                "id": t.id,
                "title": t.title,
                "priority": t.priority,
                "dueDate": t.due_date,
                "status": t.status,
                "overdueDays": (date.today() - datetime.strptime(t.due_date, "%Y-%m-%d").date()).days if t.due_date else 0,
            } for t in overdue_tasks],
            "surveys": [{
                "id": s.id,
                "customerName": s.customer_name,
                "customerId": s.customer_id,
                "status": s.status,
                "priority": s.priority,
                "scheduledDate": s.scheduled_date,
                "city": s.city,
                "roofType": s.roof_type,
                "proposedKw": s.proposed_system_kw,
                "completion": s.completion_percentage,
            } for s in surveys],
            "team": team,
        }, message="Vendor dashboard data retrieved")
    except Exception:
        logger.error("vendor_dashboard failed", exc_info=True)
        return server_error()


@router.get("/api/vendor/projects")
def vendor_projects(
    user_email: str = Depends(verify_token),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_sqlite_db),
):
    log_api_request(logger, "GET", "/api/vendor/projects")
    try:
        team = _get_vendor_team(user_email)
        query = db.query(ProjectModel).filter(ProjectModel.assigned_team == team)
        if status:
            query = query.filter(ProjectModel.status == status)
        if priority:
            query = query.filter(ProjectModel.priority == priority)
        if stage:
            query = query.filter(ProjectModel.status == stage)
        if search:
            pattern = f"%{search}%"
            query = query.filter(
                ProjectModel.title.ilike(pattern) |
                ProjectModel.customer_name.ilike(pattern) |
                ProjectModel.city.ilike(pattern)
            )
        projects = query.order_by(ProjectModel.created_at.desc()).all()
        data = [_to_frontend_dict(p) for p in projects]
        return ok(data=data, message=f"{len(data)} vendor projects retrieved")
    except Exception:
        logger.error("vendor_projects failed", exc_info=True)
        return server_error()


@router.get("/api/vendor/tasks")
def vendor_tasks(
    user_email: str = Depends(verify_token),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    db: Session = Depends(get_sqlite_db),
):
    log_api_request(logger, "GET", "/api/vendor/tasks")
    try:
        team = _get_vendor_team(user_email)
        query = db.query(CRMTaskModel).filter(CRMTaskModel.assigned_to.ilike(f"%{team}%"))
        if status:
            query = query.filter(CRMTaskModel.status == status)
        if priority:
            query = query.filter(CRMTaskModel.priority == priority)
        tasks = query.order_by(CRMTaskModel.created_at.desc()).all()
        return ok(data=[{
            "id": t.id,
            "title": t.title,
            "customerId": t.customer_id,
            "department": t.department,
            "assignedTo": t.assigned_to,
            "priority": t.priority,
            "dueDate": t.due_date,
            "status": t.status,
            "progress": t.progress,
            "notes": t.notes,
        } for t in tasks], message=f"{len(tasks)} vendor tasks retrieved")
    except Exception:
        logger.error("vendor_tasks failed", exc_info=True)
        return server_error()


@router.get("/api/vendor/alerts")
def vendor_alerts(
    user_email: str = Depends(verify_token),
    db: Session = Depends(get_sqlite_db),
):
    log_api_request(logger, "GET", "/api/vendor/alerts")
    try:
        team = _get_vendor_team(user_email)
        today_str = date.today().isoformat()
        alerts = []

        overdue_tasks = db.query(CRMTaskModel).filter(
            CRMTaskModel.assigned_to.ilike(f"%{team}%"),
            CRMTaskModel.due_date < today_str,
            CRMTaskModel.status != "Completed",
        ).all()
        for t in overdue_tasks:
            alerts.append({
                "type": "task_overdue",
                "severity": "critical" if t.priority == "critical" else "warning",
                "title": f"Task Overdue: {t.title}",
                "description": f"Due {t.due_date}. Priority: {t.priority}.",
                "taskId": t.id,
                "customerId": t.customer_id,
            })

        delayed_projects = db.query(ProjectModel).filter(
            ProjectModel.assigned_team == team,
            ProjectModel.timeline_variance > 0,
            ProjectModel.status.notin_(["completed", "amc"]),
        ).all()
        for p in delayed_projects:
            alerts.append({
                "type": "project_delayed",
                "severity": "warning",
                "title": f"Project Delayed: {p.title}",
                "description": f"{p.timeline_variance} day(s) behind. Current stage: {p.status}.",
                "projectId": p.display_id,
            })

        projects_low_health = db.query(ProjectModel).filter(
            ProjectModel.assigned_team == team,
            ProjectModel.health_score < 50,
        ).all()
        for p in projects_low_health:
            alerts.append({
                "type": "project_at_risk",
                "severity": "critical",
                "title": f"Project At Risk: {p.title}",
                "description": f"Health score: {p.health_score}. Immediate attention required.",
                "projectId": p.display_id,
            })

        return ok(data={
            "alerts": alerts,
            "total": len(alerts),
            "critical": len([a for a in alerts if a["severity"] == "critical"]),
        }, message=f"{len(alerts)} alert(s) found")
    except Exception:
        logger.error("vendor_alerts failed", exc_info=True)
        return server_error()

import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database_sqlite import get_sqlite_db
from security import verify_token
from utils.responses import ok, created, not_found, server_error, bad_request
from utils.logger import log_api_request, log_api_response
from services.project_service import (
    get_projects, get_project, create_project, update_project,
    update_project_stage, delete_project, get_project_metrics,
    _to_frontend_dict
)
from schemas.project import ProjectCreateSchema, ProjectUpdateSchema, ProjectStageSchema

router = APIRouter(tags=["Project Tracking"])
logger = logging.getLogger(__name__)


@router.get("/api/projects")
def list_projects(
    user_email: str = Depends(verify_token),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    page: Optional[int] = Query(None, ge=1),
    limit: Optional[int] = Query(None, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    db: Session = Depends(get_sqlite_db),
):
    log_api_request(logger, "GET", "/api/projects", {
        "status": status, "priority": priority, "stage": stage,
        "page": page, "limit": limit, "search": search, "sort_by": sort_by,
    })
    try:
        projects = get_projects(db, status=status, priority=priority, stage=stage)
        data = [_to_frontend_dict(p) for p in projects]
        return ok(data=data, message=f"{len(data)} projects retrieved")
    except Exception:
        logger.error("list_projects failed", exc_info=True)
        return server_error()


@router.get("/api/projects/metrics")
def project_metrics(
    user_email: str = Depends(verify_token),
    db: Session = Depends(get_sqlite_db),
):
    log_api_request(logger, "GET", "/api/projects/metrics")
    try:
        metrics = get_project_metrics(db)
        return ok(data=metrics, message="Project metrics retrieved")
    except Exception:
        logger.error("project_metrics failed", exc_info=True)
        return server_error()


@router.get("/api/projects/{project_id}")
def get_project_by_id(
    project_id: str,
    user_email: str = Depends(verify_token),
    db: Session = Depends(get_sqlite_db),
):
    log_api_request(logger, "GET", f"/api/projects/{project_id}")
    try:
        project = get_project(db, project_id)
        if not project:
            return not_found("Project", project_id)
        return ok(data=_to_frontend_dict(project), message="Project retrieved")
    except Exception:
        logger.error("get_project_by_id failed", exc_info=True)
        return server_error()


@router.post("/api/projects")
def create_project_endpoint(
    body: ProjectCreateSchema,
    user_email: str = Depends(verify_token),
    db: Session = Depends(get_sqlite_db),
):
    log_api_request(logger, "POST", "/api/projects")
    try:
        project = create_project(db, body.model_dump())
        return created(data=_to_frontend_dict(project), message="Project created")
    except Exception:
        logger.error("create_project failed", exc_info=True)
        return server_error()


@router.put("/api/projects/{project_id}")
def update_project_full(
    project_id: str,
    body: ProjectCreateSchema,
    user_email: str = Depends(verify_token),
    db: Session = Depends(get_sqlite_db),
):
    log_api_request(logger, "PUT", f"/api/projects/{project_id}")
    try:
        data = body.model_dump(exclude_unset=True)
        project = update_project(db, project_id, data)
        if not project:
            return not_found("Project", project_id)
        return ok(data=_to_frontend_dict(project), message="Project updated")
    except Exception:
        logger.error("update_project_full failed", exc_info=True)
        return server_error()


@router.patch("/api/projects/{project_id}")
def update_project_partial(
    project_id: str,
    body: ProjectUpdateSchema,
    user_email: str = Depends(verify_token),
    db: Session = Depends(get_sqlite_db),
):
    log_api_request(logger, "PATCH", f"/api/projects/{project_id}")
    try:
        data = body.model_dump(exclude_unset=True)
        if not data:
            return bad_request("No fields to update")
        project = update_project(db, project_id, data)
        if not project:
            return not_found("Project", project_id)
        return ok(data=_to_frontend_dict(project), message="Project updated")
    except Exception:
        logger.error("update_project_partial failed", exc_info=True)
        return server_error()


@router.patch("/api/projects/{project_id}/stage")
def update_project_stage_endpoint(
    project_id: str,
    body: ProjectStageSchema,
    user_email: str = Depends(verify_token),
    db: Session = Depends(get_sqlite_db),
):
    log_api_request(logger, "PATCH", f"/api/projects/{project_id}/stage", {"stage": body.stage})
    try:
        project = update_project_stage(db, project_id, body.stage)
        if not project:
            return not_found("Project", project_id)
        return ok(data=_to_frontend_dict(project), message=f"Stage updated to {body.stage}")
    except Exception:
        logger.error("update_project_stage failed", exc_info=True)
        return server_error()


@router.delete("/api/projects/{project_id}")
def delete_project_endpoint(
    project_id: str,
    user_email: str = Depends(verify_token),
    db: Session = Depends(get_sqlite_db),
):
    log_api_request(logger, "DELETE", f"/api/projects/{project_id}")
    try:
        deleted = delete_project(db, project_id)
        if not deleted:
            return not_found("Project", project_id)
        return ok(data=None, message="Project deleted")
    except Exception:
        logger.error("delete_project failed", exc_info=True)
        return server_error()

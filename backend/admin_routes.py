import logging
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from security import verify_token
from database_sqlite import get_sqlite_db
from admin_service import get_admin_dashboard, get_admin_activity, get_admin_health
from permissions import has_admin_access
from utils.responses import ok, server_error
from utils.logger import log_api_request

logger = logging.getLogger(__name__)
router = APIRouter(dependencies=[Depends(verify_token)])


def _require_admin(user_email: str):
    if not has_admin_access(user_email):
        raise HTTPException(status_code=403, detail="Admin access required")


@router.get("/api/admin/dashboard")
def admin_dashboard(
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token),
):
    log_api_request(logger, "GET", "/api/admin/dashboard")
    _require_admin(user_email)
    try:
        data = get_admin_dashboard(db)
        return ok(data=data, message="Admin dashboard data retrieved")
    except Exception as e:
        logger.error(f"Admin dashboard error: {e}", exc_info=True)
        return server_error()


@router.get("/api/admin/activity")
def admin_activity(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token),
):
    log_api_request(logger, "GET", "/api/admin/activity")
    _require_admin(user_email)
    try:
        data = get_admin_activity(db, limit)
        return ok(data=data, message="Admin activity retrieved")
    except Exception as e:
        logger.error(f"Admin activity error: {e}")
        return server_error()


@router.get("/api/admin/health")
def admin_health(
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token),
):
    log_api_request(logger, "GET", "/api/admin/health")
    _require_admin(user_email)
    try:
        data = get_admin_health(db)
        return ok(data=data, message="Platform health retrieved")
    except Exception as e:
        logger.error(f"Admin health error: {e}")
        return server_error()
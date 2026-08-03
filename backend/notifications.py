"""
Phase 3 (extension) - Notifications

NOTE: This module exposes list/read/read-all endpoints and a reusable
create_notification() helper — but nothing in job_marketplace.py or
work_orders.py calls that helper yet, so the list will stay empty until
those small hooks are added (e.g. "job accepted", "work order completed",
"certification earned"). That wiring is a quick follow-up, kept separate
here so already-tested files aren't touched again in this pass.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from technician_models import Technician
from notifications_models import TechnicianNotification
from technician_auth import get_current_technician

router = APIRouter(prefix="/api/technician/notifications", tags=["Notifications"])


def create_notification(db: Session, technician_id: int, title: str, message: str, notification_type: str = "system"):
    """Reusable helper — call this from other modules on key events
    (e.g. job accepted, work order completed, certification earned)."""
    db.add(TechnicianNotification(
        technician_id=technician_id, title=title, message=message, notification_type=notification_type
    ))
    db.commit()


@router.get("")
def list_notifications(db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    notifications = db.query(TechnicianNotification).filter(
        TechnicianNotification.technician_id == current_technician.id
    ).order_by(TechnicianNotification.created_at.desc()).all()

    unread_count = sum(1 for n in notifications if not n.is_read)

    return {
        "success": True,
        "unread_count": unread_count,
        "notifications": [
            {
                "id": n.id, "title": n.title, "message": n.message,
                "notification_type": n.notification_type, "is_read": n.is_read,
                "created_at": n.created_at.isoformat()
            } for n in notifications
        ]
    }


@router.patch("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    notification = db.query(TechnicianNotification).filter(
        TechnicianNotification.id == notification_id,
        TechnicianNotification.technician_id == current_technician.id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found.")

    notification.is_read = True
    db.commit()
    return {"success": True, "message": "Notification marked as read."}


@router.patch("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_technician: Technician = Depends(get_current_technician)):
    db.query(TechnicianNotification).filter(
        TechnicianNotification.technician_id == current_technician.id,
        TechnicianNotification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"success": True, "message": "All notifications marked as read."}
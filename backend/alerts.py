"""
Phase 4 - Alerts & Notifications
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from monitoring_models import SolarPlant, Alert
from customer_auth_helper import get_current_customer

router = APIRouter(prefix="/api/plants", tags=["Alerts"])


@router.get("/{plant_id}/alerts")
def list_alerts(plant_id: int, db: Session = Depends(get_db), current_customer: dict = Depends(get_current_customer)):
    plant = db.query(SolarPlant).filter(SolarPlant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found.")
    if plant.customer_email != current_customer["email"]:
        raise HTTPException(status_code=403, detail="You do not have access to this plant.")

    alerts = db.query(Alert).filter(Alert.plant_id == plant_id).order_by(Alert.created_at.desc()).all()
    return {
        "success": True,
        "alerts": [
            {
                "id": a.id,
                "alert_type": a.alert_type,
                "severity": a.severity,
                "message": a.message,
                "is_read": a.is_read,
                "created_at": a.created_at.isoformat()
            } for a in alerts
        ]
    }


@router.patch("/alerts/{alert_id}/read")
def mark_alert_read(alert_id: int, db: Session = Depends(get_db), current_customer: dict = Depends(get_current_customer)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")

    plant = db.query(SolarPlant).filter(SolarPlant.id == alert.plant_id).first()
    if not plant or plant.customer_email != current_customer["email"]:
        raise HTTPException(status_code=403, detail="You do not have access to this alert.")

    alert.is_read = True
    db.commit()
    return {"success": True, "message": "Alert marked as read."}
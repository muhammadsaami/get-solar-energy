"""
Phase 4 - Solar Plant Registration
A plant record is created once an installation is complete (Phase 2/3 territory).
For now, registration is a simple open endpoint the vendor/admin calls after
install — swap to a proper get_current_vendor() dependency once Phase 2 vendor
auth exists, same as the note left in job_marketplace.py.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from monitoring_models import SolarPlant
from customer_auth_helper import get_current_customer
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/plants", tags=["Solar Plants"])


class PlantRegisterRequest(BaseModel):
    customer_email: str
    capacity_kw: float
    city: str
    vendor_email: Optional[str] = None
    technician_id: Optional[int] = None
    inverter_brand: Optional[str] = None
    inverter_serial: Optional[str] = None


@router.post("/register")
def register_plant(data: PlantRegisterRequest, db: Session = Depends(get_db)):
    plant = SolarPlant(
        customer_email=data.customer_email,
        vendor_email=data.vendor_email,
        technician_id=data.technician_id,
        capacity_kw=data.capacity_kw,
        inverter_brand=data.inverter_brand,
        inverter_serial=data.inverter_serial,
        city=data.city,
        status="Active"
    )
    db.add(plant)
    db.commit()
    db.refresh(plant)
    logger.info("Plant registered: id=%s for %s (%s kW)", plant.id, data.customer_email, data.capacity_kw)
    return {"success": True, "message": "Plant registered successfully!", "plant_id": plant.id}


@router.get("/my")
def list_my_plants(db: Session = Depends(get_db), current_customer: dict = Depends(get_current_customer)):
    plants = db.query(SolarPlant).filter(SolarPlant.customer_email == current_customer["email"]).all()
    return {
        "success": True,
        "plants": [
            {
                "id": p.id,
                "capacity_kw": p.capacity_kw,
                "inverter_brand": p.inverter_brand,
                "city": p.city,
                "status": p.status,
                "installed_at": p.installed_at.isoformat() if p.installed_at else None
            } for p in plants
        ]
    }


@router.get("/{plant_id}")
def get_plant_detail(plant_id: int, db: Session = Depends(get_db), current_customer: dict = Depends(get_current_customer)):
    plant = db.query(SolarPlant).filter(SolarPlant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found.")
    if plant.customer_email != current_customer["email"]:
        raise HTTPException(status_code=403, detail="You do not have access to this plant.")

    return {
        "success": True,
        "plant": {
            "id": plant.id,
            "capacity_kw": plant.capacity_kw,
            "inverter_brand": plant.inverter_brand,
            "inverter_serial": plant.inverter_serial,
            "city": plant.city,
            "status": plant.status,
            "installed_at": plant.installed_at.isoformat() if plant.installed_at else None
        }
    }

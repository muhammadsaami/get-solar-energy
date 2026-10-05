"""
Phase 7B - Solar Production Persistence API
Handles customer-scoped storage and retrieval for verified solar generation readings.
Strictly isolated from electricity consumption and utility billing.
"""
from fastapi import APIRouter, HTTPException, Depends, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Dict, Any
from datetime import datetime
import re
import logging

from database import get_db
from security import verify_token
from solar_production_models import CustomerSolarProduction

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/solar-production", tags=["Solar Production Persistence"])

VALID_PERIOD_TYPES = {"day", "week", "month", "year", "lifetime", "custom"}
DATE_REGEX = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class DailyPointInput(BaseModel):
    id: Optional[str] = None
    date: str
    productionKwh: float = Field(..., ge=0)

    @field_validator("date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        if not DATE_REGEX.match(v.strip()):
            raise ValueError("Daily reading date must be formatted as YYYY-MM-DD.")
        return v.strip()


class SolarProductionRecordRequest(BaseModel):
    productionKwh: float = Field(..., ge=0, description="Total solar energy generated in kWh")
    installedCapacityKwp: Optional[float] = Field(None, gt=0, description="Installed DC capacity in kWp")
    periodType: str = Field("month", description="day, week, month, year, lifetime, custom")
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    month: Optional[str] = None
    year: Optional[int] = None
    source: str = Field("manual", description="'manual' or 'upload'")
    dailyGenerationKwh: Optional[float] = None
    dailyPoints: Optional[List[Dict[str, Any]]] = None

    @field_validator("periodType")
    @classmethod
    def validate_period_type(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if cleaned not in VALID_PERIOD_TYPES:
            raise ValueError(f"Invalid periodType '{v}'. Must be one of: {', '.join(sorted(VALID_PERIOD_TYPES))}")
        return cleaned

    @field_validator("source")
    @classmethod
    def validate_source(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if cleaned not in ("manual", "upload"):
            raise ValueError("source must be either 'manual' or 'upload'")
        return cleaned


def _serialize_reading(item: CustomerSolarProduction) -> Dict[str, Any]:
    return {
        "id": item.id,
        "customerEmail": item.customer_email,
        "periodType": item.period_type,
        "startDate": item.start_date,
        "endDate": item.end_date,
        "month": item.month,
        "year": item.year,
        "productionKwh": round(item.production_kwh, 2),
        "installedCapacityKwp": round(item.installed_capacity_kwp, 2) if item.installed_capacity_kwp is not None else None,
        "systemSizeKw": round(item.installed_capacity_kwp, 2) if item.installed_capacity_kwp is not None else None,
        "source": item.source,
        "dailyGenerationKwh": round(item.daily_generation_kwh, 2) if item.daily_generation_kwh is not None else None,
        "dailyPoints": item.daily_points,
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def save_solar_production(
    payload: SolarProductionRecordRequest,
    user_email: str = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """
    Saves or updates a canonical solar production reading for the authenticated customer.
    The customer identity is derived strictly from the verified JWT token.
    """
    if not user_email or not user_email.strip():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Valid authentication token required.")

    # Validate date ordering if both start and end date are provided
    if payload.startDate and payload.endDate:
        if payload.startDate > payload.endDate:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Start date cannot be after end date.",
            )

    # Check for existing reading for same customer and period identifier
    query = db.query(CustomerSolarProduction).filter(
        CustomerSolarProduction.customer_email == user_email.strip().lower(),
        CustomerSolarProduction.period_type == payload.periodType,
    )

    if payload.periodType == "month":
        query = query.filter(
            CustomerSolarProduction.month == payload.month,
            CustomerSolarProduction.year == payload.year,
        )
    elif payload.periodType in ("day", "week", "custom"):
        query = query.filter(
            CustomerSolarProduction.start_date == payload.startDate,
            CustomerSolarProduction.end_date == payload.endDate,
        )
    elif payload.periodType == "year":
        query = query.filter(CustomerSolarProduction.year == payload.year)

    existing = query.first()

    if existing:
        existing.production_kwh = payload.productionKwh
        existing.installed_capacity_kwp = payload.installedCapacityKwp
        existing.source = payload.source
        existing.daily_generation_kwh = payload.dailyGenerationKwh
        existing.daily_points = payload.dailyPoints
        existing.start_date = payload.startDate
        existing.end_date = payload.endDate
        existing.month = payload.month
        existing.year = payload.year
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        reading = existing
        logger.info("Updated solar production reading id=%s for user=%s", reading.id, user_email)
    else:
        reading = CustomerSolarProduction(
            customer_email=user_email.strip().lower(),
            period_type=payload.periodType,
            start_date=payload.startDate,
            end_date=payload.endDate,
            month=payload.month,
            year=payload.year,
            production_kwh=payload.productionKwh,
            installed_capacity_kwp=payload.installedCapacityKwp,
            source=payload.source,
            daily_generation_kwh=payload.dailyGenerationKwh,
            daily_points=payload.dailyPoints,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(reading)
        db.commit()
        db.refresh(reading)
        logger.info("Created solar production reading id=%s for user=%s", reading.id, user_email)

    return {
        "success": True,
        "message": "Solar production reading saved successfully.",
        "data": _serialize_reading(reading),
    }


@router.get("/latest")
def get_latest_solar_production(
    user_email: str = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """
    Returns the most recent solar production reading for the authenticated customer.
    Returns data: null if no reading has been saved yet.
    """
    if not user_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Valid authentication token required.")

    reading = (
        db.query(CustomerSolarProduction)
        .filter(CustomerSolarProduction.customer_email == user_email.strip().lower())
        .order_by(desc(CustomerSolarProduction.created_at))
        .first()
    )

    return {
        "success": True,
        "data": _serialize_reading(reading) if reading else None,
    }


@router.get("/history")
def get_solar_production_history(
    limit: int = Query(24, ge=1, le=100),
    user_email: str = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """
    Returns historical solar production readings for the authenticated customer.
    Ordered by creation date descending.
    """
    if not user_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Valid authentication token required.")

    readings = (
        db.query(CustomerSolarProduction)
        .filter(CustomerSolarProduction.customer_email == user_email.strip().lower())
        .order_by(desc(CustomerSolarProduction.created_at))
        .limit(limit)
        .all()
    )

    return {
        "success": True,
        "count": len(readings),
        "data": [_serialize_reading(r) for r in readings],
    }


@router.delete("/{reading_id}")
def delete_solar_production(
    reading_id: int,
    user_email: str = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """
    Deletes a solar production reading owned by the authenticated customer.
    Non-owners cannot delete or access records of another customer.
    """
    if not user_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Valid authentication token required.")

    reading = db.query(CustomerSolarProduction).filter(CustomerSolarProduction.id == reading_id).first()

    if not reading:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solar production record not found.")

    if reading.customer_email != user_email.strip().lower():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this record.")

    db.delete(reading)
    db.commit()
    logger.info("Deleted solar production reading id=%s for user=%s", reading_id, user_email)

    return {
        "success": True,
        "message": "Solar production record deleted successfully.",
    }

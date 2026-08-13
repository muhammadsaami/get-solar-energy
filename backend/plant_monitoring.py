"""
Phase 4 - Live Generation Dashboard & Plant Health Score

NOTE ON DATA SOURCE: No real inverter API is connected yet, so /simulate-reading
generates a realistic daily reading (with some natural variance) so the frontend
can be built and tested end-to-end right now. When a real inverter API (Growatt,
SolarEdge, etc.) is ready, replace only the body of _simulate_generation() with an
actual API call — /dashboard, /health-score and the alert logic all stay the same
since they just read from GenerationReading rows regardless of where they came from.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from monitoring_models import SolarPlant, GenerationReading, Alert
from customer_auth_helper import get_current_customer
from datetime import datetime, timedelta
import random
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/plants", tags=["Plant Monitoring"])

AVG_SUN_HOURS = 4.5   # kWh generated per kW of capacity per day, India average


def _get_owned_plant(plant_id: int, db: Session, current_customer: dict) -> SolarPlant:
    plant = db.query(SolarPlant).filter(SolarPlant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found.")
    if plant.customer_email != current_customer["email"]:
        raise HTTPException(status_code=403, detail="You do not have access to this plant.")
    return plant


def _simulate_generation(plant: SolarPlant) -> float:
    """Placeholder for real inverter API data. Adds realistic day-to-day variance
    (weather, shading, etc.) around the expected output."""
    expected = plant.capacity_kw * AVG_SUN_HOURS
    variance = random.uniform(0.65, 1.05)   # occasionally simulates a poor-generation day
    return round(expected * variance, 2)


def _check_and_raise_alerts(db: Session, plant: SolarPlant, reading: GenerationReading):
    """Creates an alert if the day's generation is significantly below expected."""
    if reading.expected_kwh <= 0:
        return
    ratio = reading.generation_kwh / reading.expected_kwh
    if ratio < 0.75:
        alert = Alert(
            plant_id=plant.id,
            alert_type="Low Generation",
            severity="High" if ratio < 0.5 else "Medium",
            message=f"Generation on {reading.reading_date.strftime('%d %b %Y')} was "
                    f"{round(ratio * 100)}% of expected output ({reading.generation_kwh} kWh vs "
                    f"{reading.expected_kwh} kWh expected). Please check for shading, dust, or inverter faults."
        )
        db.add(alert)
        db.commit()
        logger.info("Alert raised for plant %s: %s", plant.id, alert.alert_type)


@router.post("/{plant_id}/simulate-reading")
def simulate_reading(plant_id: int, db: Session = Depends(get_db), current_customer: dict = Depends(get_current_customer)):
    plant = _get_owned_plant(plant_id, db, current_customer)

    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    existing = db.query(GenerationReading).filter(
        GenerationReading.plant_id == plant.id,
        GenerationReading.reading_date == today
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A reading for today already exists for this plant.")

    expected_kwh = round(plant.capacity_kw * AVG_SUN_HOURS, 2)
    generation_kwh = _simulate_generation(plant)

    reading = GenerationReading(
        plant_id=plant.id,
        reading_date=today,
        generation_kwh=generation_kwh,
        expected_kwh=expected_kwh,
        source="simulated"
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    _check_and_raise_alerts(db, plant, reading)

    return {
        "success": True,
        "message": "Simulated reading recorded.",
        "reading": {
            "date": reading.reading_date.date().isoformat(),
            "generation_kwh": reading.generation_kwh,
            "expected_kwh": reading.expected_kwh
        }
    }


@router.get("/{plant_id}/dashboard")
def get_dashboard(plant_id: int, db: Session = Depends(get_db), current_customer: dict = Depends(get_current_customer)):
    plant = _get_owned_plant(plant_id, db, current_customer)

    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = today.replace(day=1)

    today_reading = db.query(GenerationReading).filter(
        GenerationReading.plant_id == plant.id,
        GenerationReading.reading_date == today
    ).first()

    month_readings = db.query(GenerationReading).filter(
        GenerationReading.plant_id == plant.id,
        GenerationReading.reading_date >= month_start
    ).all()

    monthly_total_kwh = round(sum(r.generation_kwh for r in month_readings), 2)
    monthly_expected_kwh = round(sum(r.expected_kwh for r in month_readings), 2)

    unread_alerts = db.query(Alert).filter(Alert.plant_id == plant.id, Alert.is_read == False).count()

    return {
        "success": True,
        "plant_id": plant.id,
        "capacity_kw": plant.capacity_kw,
        "status": plant.status,
        "today_generation_kwh": today_reading.generation_kwh if today_reading else None,
        "today_expected_kwh": round(plant.capacity_kw * AVG_SUN_HOURS, 2),
        "monthly_total_kwh": monthly_total_kwh,
        "monthly_expected_kwh": monthly_expected_kwh,
        "unread_alerts": unread_alerts
    }


@router.get("/{plant_id}/health-score")
def get_health_score(plant_id: int, db: Session = Depends(get_db), current_customer: dict = Depends(get_current_customer)):
    plant = _get_owned_plant(plant_id, db, current_customer)

    cutoff = datetime.utcnow() - timedelta(days=7)
    recent_readings = db.query(GenerationReading).filter(
        GenerationReading.plant_id == plant.id,
        GenerationReading.reading_date >= cutoff
    ).all()

    if not recent_readings:
        return {
            "success": True,
            "health_score": None,
            "message": "Not enough generation data yet to calculate a health score."
        }

    total_actual = sum(r.generation_kwh for r in recent_readings)
    total_expected = sum(r.expected_kwh for r in recent_readings)
    ratio_score = min(100, round((total_actual / total_expected) * 100)) if total_expected > 0 else 0

    high_severity_unread = db.query(Alert).filter(
        Alert.plant_id == plant.id, Alert.is_read == False, Alert.severity == "High"
    ).count()

    health_score = max(0, ratio_score - (high_severity_unread * 5))

    if health_score >= 85:
        status_label = "Excellent"
    elif health_score >= 70:
        status_label = "Good"
    elif health_score >= 50:
        status_label = "Needs Attention"
    else:
        status_label = "Poor"

    return {
        "success": True,
        "health_score": health_score,
        "status_label": status_label,
        "based_on_days": len(recent_readings)
    }

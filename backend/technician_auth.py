"""
Mirrors auth.py's security conventions (bcrypt hashing, JWT) but stores
technicians in PostgreSQL (via SQLAlchemy) instead of users.json, since
this is a distinct account type with its own profile fields.
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from technician_models import Technician
from security import hash_password, verify_password, validate_password_strength
import os
import uuid
import jwt
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/technician", tags=["Technician Auth"])
security_scheme = HTTPBearer()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
TECH_TOKEN_EXPIRE_HOURS = 24 * 7  # technicians stay logged in for 7 days (mobile-friendly)


# ==============================================================================
# SCHEMAS
# ==============================================================================
class TechnicianSignupRequest(BaseModel):
    name: str
    phone: str
    email: str
    password: str
    city: str


class TechnicianLoginRequest(BaseModel):
    email: str
    password: str


# ==============================================================================
# TOKEN HELPERS
# ==============================================================================
def create_technician_token(technician_id: int, email: str) -> str:
    payload = {
        "sub": email,
        "technician_id": technician_id,
        "role": "technician",
        "exp": datetime.utcnow() + timedelta(hours=TECH_TOKEN_EXPIRE_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_technician(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> Technician:
    """Dependency to protect technician-only routes. Use in other route files as:
    current_technician: Technician = Depends(get_current_technician)
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("role") != "technician":
            raise HTTPException(status_code=403, detail="This token is not valid for technician access.")
        technician_id = payload.get("technician_id")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token.")

    technician = db.query(Technician).filter(Technician.id == technician_id).first()
    if not technician:
        raise HTTPException(status_code=404, detail="Technician account not found.")
    if not technician.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated.")
    return technician


# ==============================================================================
# ROUTES
# ==============================================================================
@router.post("/signup")
def technician_signup(data: TechnicianSignupRequest, db: Session = Depends(get_db)):
    try:
        validated_password = validate_password_strength(data.password)

        existing = db.query(Technician).filter(
            (Technician.email == data.email) | (Technician.phone == data.phone)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email or phone number already registered.")

        technician = Technician(
            uuid=str(uuid.uuid4()),
            name=data.name,
            phone=data.phone,
            email=data.email,
            password=hash_password(validated_password),
            city=data.city,
            skill_level="Level 1",
            kyc_status="Pending",
            is_active=True
        )
        db.add(technician)
        db.commit()
        db.refresh(technician)

        token = create_technician_token(technician.id, technician.email)
        logger.info("Technician account created: %s", technician.email)

        return {
            "success": True,
            "message": "Technician account created successfully!",
            "token": token,
            "technician": {
                "id": technician.id,
                "name": technician.name,
                "email": technician.email,
                "city": technician.city,
                "skill_level": technician.skill_level
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error("Technician signup failed: %s", str(e))
        raise HTTPException(status_code=500, detail="An error occurred while creating the account.")


@router.post("/login")
def technician_login(data: TechnicianLoginRequest, db: Session = Depends(get_db)):
    try:
        technician = db.query(Technician).filter(Technician.email == data.email).first()
        if not technician or not verify_password(data.password, technician.password):
            raise HTTPException(status_code=400, detail="Invalid email or password.")

        if not technician.is_active:
            raise HTTPException(status_code=403, detail="Account has been deactivated. Contact support.")

        token = create_technician_token(technician.id, technician.email)
        logger.info("Technician login: %s", technician.email)

        return {
            "success": True,
            "message": "Login successful!",
            "token": token,
            "technician": {
                "id": technician.id,
                "name": technician.name,
                "email": technician.email,
                "city": technician.city,
                "skill_level": technician.skill_level,
                "kyc_status": technician.kyc_status
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Technician login failed: %s", str(e))
        raise HTTPException(status_code=500, detail="An error occurred during login.")


@router.get("/profile")
def get_profile(current_technician: Technician = Depends(get_current_technician)):
    return {
        "success": True,
        "technician": {
            "id": current_technician.id,
            "name": current_technician.name,
            "email": current_technician.email,
            "phone": current_technician.phone,
            "city": current_technician.city,
            "skill_level": current_technician.skill_level,
            "kyc_status": current_technician.kyc_status,
            "created_at": current_technician.created_at.isoformat() if current_technician.created_at else None
        }
    }
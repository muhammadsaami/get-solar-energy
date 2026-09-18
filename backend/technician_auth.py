"""
Mirrors auth.py's security conventions (bcrypt hashing, JWT) but stores
technicians in PostgreSQL (via SQLAlchemy) instead of users.json, since
this is a distinct account type with its own profile fields.
Also supports seamless Admin RBAC cross-portal authorization.
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from technician_models import Technician
from security import hash_password, verify_password, validate_password_strength
import os
import json
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
BACKEND_USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")
USERS_FILE = BACKEND_USERS_FILE if os.path.exists(BACKEND_USERS_FILE) else "users.json"


def _load_user_store() -> dict:
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    return {}


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


class TechnicianProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    avatar: Optional[str] = None


# ==============================================================================
# TOKEN HELPERS
# ==============================================================================
def create_technician_token(technician_id: int, email: str, role: str = "technician") -> str:
    payload = {
        "sub": email,
        "technician_id": technician_id,
        "role": role,
        "type": "access",
        "exp": datetime.utcnow() + timedelta(hours=TECH_TOKEN_EXPIRE_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_technician(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> Technician:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token claims.")
        
        if role != "technician" and role != "admin":
            raise HTTPException(status_code=403, detail="Forbidden: Not authorized for technician portal.")

        if role == "admin":
            tech = db.query(Technician).filter(Technician.email == email).first()
            if not tech:
                # Return an admin surrogate technician instance to satisfy route dependencies
                return Technician(
                    id=0,
                    uuid="admin-technician-surrogate",
                    name="Admin User",
                    phone="9999999999",
                    email=email,
                    password="",
                    city="Lucknow",
                    skill_level="Level 2",
                    kyc_status="Verified",
                    is_active=True,
                    created_at=datetime.utcnow()
                )
            return tech

        technician = db.query(Technician).filter(Technician.email == email).first()
        if not technician:
            raise HTTPException(status_code=401, detail="Technician account not found.")
        if not technician.is_active:
            raise HTTPException(status_code=403, detail="Technician account is deactivated.")
        
        return technician
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please log in again.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token.")


# ==============================================================================
# ENDPOINTS
# ==============================================================================
@router.post("/signup")
def signup_technician(req: TechnicianSignupRequest, db: Session = Depends(get_db)):
    try:
        if db.query(Technician).filter(Technician.email == req.email).first():
            raise HTTPException(status_code=400, detail="Email already registered as a technician.")

        if db.query(Technician).filter(Technician.phone == req.phone).first():
            raise HTTPException(status_code=400, detail="Phone number already registered.")

        validated_password = validate_password_strength(req.password)

        hashed = hash_password(validated_password)
        tech = Technician(
            uuid=str(uuid.uuid4()),
            name=req.name,
            phone=req.phone,
            email=req.email,
            password=hashed,
            city=req.city,
            skill_level="Level 1",
            kyc_status="Pending",
            is_active=True
        )
        db.add(tech)
        db.commit()
        db.refresh(tech)

        token = create_technician_token(tech.id, tech.email, role="technician")
        logger.info("Technician created: %s (%s)", tech.email, tech.city)

        return {
            "success": True,
            "message": "Technician account created successfully!",
            "token": token,
            "technician": {
                "id": tech.id,
                "name": tech.name,
                "email": tech.email,
                "city": tech.city,
                "skill_level": tech.skill_level,
                "kyc_status": tech.kyc_status
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error("Technician signup failed: %s", str(e))
        raise HTTPException(status_code=500, detail="An error occurred during technician signup.")


@router.post("/login")
def login_technician(req: TechnicianLoginRequest, db: Session = Depends(get_db)):
    try:
        technician = db.query(Technician).filter(Technician.email == req.email).first()
        if technician:
            if not verify_password(req.password, technician.password):
                raise HTTPException(status_code=401, detail="Invalid email or password.")

            if not technician.is_active:
                raise HTTPException(status_code=403, detail="Account has been deactivated. Contact support.")

            token = create_technician_token(technician.id, technician.email, role="technician")
            logger.info("Technician login: %s", technician.email)

            return {
                "success": True,
                "message": "Login successful!",
                "token": token,
                "role": "technician",
                "user": {
                    "id": technician.id,
                    "name": technician.name,
                    "email": technician.email,
                    "role": "technician"
                },
                "technician": {
                    "id": technician.id,
                    "name": technician.name,
                    "email": technician.email,
                    "city": technician.city,
                    "skill_level": technician.skill_level,
                    "kyc_status": technician.kyc_status
                }
            }

        # Check primary user store (users.json) for Admin cross-portal authentication
        users = _load_user_store()
        user = users.get(req.email)
        if user and verify_password(req.password, user.get("password", "")):
            user_role = user.get("role", "customer")
            if user_role == "admin":
                token = create_technician_token(0, user["email"], role="admin")
                logger.info("Admin cross-portal login to Technician portal: %s", user["email"])
                return {
                    "success": True,
                    "message": "Admin authorization granted for Technician portal.",
                    "token": token,
                    "role": "admin",
                    "user": {
                        "id": user.get("id", "admin-session-id"),
                        "name": user.get("name", "Admin User"),
                        "email": user["email"],
                        "role": "admin",
                        "city": user.get("city", "Lucknow")
                    },
                    "technician": {
                        "id": 0,
                        "name": user.get("name", "Admin User"),
                        "email": user["email"],
                        "city": user.get("city", "Lucknow"),
                        "skill_level": "Level 2",
                        "kyc_status": "Verified"
                    }
                }
            else:
                # Valid password, but non-admin user attempting unauthorized access to technician portal
                raise HTTPException(status_code=403, detail="Forbidden: Account is not authorized to access the Technician Portal.")

        raise HTTPException(status_code=401, detail="Invalid email or password.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Technician login failed: %s", str(e))
        raise HTTPException(status_code=500, detail="An error occurred during login.")


@router.get("/profile")
def get_profile(
    current_technician: Technician = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    from performance_models import TechnicianProfilePhoto
    photo = db.query(TechnicianProfilePhoto).filter(TechnicianProfilePhoto.technician_id == current_technician.id).first()
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
            "avatar": photo.file_url if photo else None,
            "created_at": current_technician.created_at.isoformat() if current_technician.created_at else None
        }
    }


@router.put("/profile")
def update_profile(
    data: TechnicianProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_technician: Technician = Depends(get_current_technician)
):
    from performance_models import TechnicianProfilePhoto
    if data.name:
        current_technician.name = data.name
    if data.phone:
        current_technician.phone = data.phone
    if data.city:
        current_technician.city = data.city
    if data.avatar is not None:
        photo = db.query(TechnicianProfilePhoto).filter(TechnicianProfilePhoto.technician_id == current_technician.id).first()
        if data.avatar:
            if photo:
                photo.file_url = data.avatar
                photo.updated_at = datetime.utcnow()
            else:
                photo = TechnicianProfilePhoto(technician_id=current_technician.id, file_url=data.avatar)
                db.add(photo)
        else:
            if photo:
                db.delete(photo)
    db.commit()
    db.refresh(current_technician)
    photo = db.query(TechnicianProfilePhoto).filter(TechnicianProfilePhoto.technician_id == current_technician.id).first()
    return {
        "success": True,
        "message": "Profile updated successfully.",
        "technician": {
            "id": current_technician.id,
            "name": current_technician.name,
            "email": current_technician.email,
            "phone": current_technician.phone,
            "city": current_technician.city,
            "skill_level": current_technician.skill_level,
            "kyc_status": current_technician.kyc_status,
            "avatar": photo.file_url if photo else None
        }
    }
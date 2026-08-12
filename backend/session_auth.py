"""
Session/Refresh Token module — extends (does NOT replace) the existing
customer auth.py (users.json) and technician_auth.py (Postgres) systems.

Works across account types (customer / technician / vendor-later) while
keeping them isolated via a `role` field on each session row — matching
Hammad's requirement: "Customer, Vendor and Technician authentication
remain isolated."

Endpoints (all prefixed /api/auth):
  POST   /login          -> access_token (JSON) + refresh_token (HttpOnly cookie)
  POST   /refresh         -> reads refresh cookie, rotates it, returns new access_token
  GET    /me               -> current user from access token
  POST   /logout           -> revokes only the current session
  POST   /logout-all       -> revokes every session for this account
  GET    /sessions         -> list this account's active sessions
  DELETE /sessions/{id}    -> revoke one specific session
"""
import hashlib
import json
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import Session

from database import Base, get_db
from technician_models import Technician
from security import verify_password

router = APIRouter(prefix="/api/auth", tags=["Session Auth"])
security_scheme = HTTPBearer()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# All tunable — override any of these in .env without touching code.
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS_REMEMBER = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS_REMEMBER", "30"))
REFRESH_TOKEN_EXPIRE_HOURS_NO_REMEMBER = int(os.getenv("REFRESH_TOKEN_EXPIRE_HOURS_NO_REMEMBER", "24"))
REFRESH_COOKIE_NAME = os.getenv("REFRESH_COOKIE_NAME", "refresh_token")

# Local dev over http => secure=False. MUST be true in production (https).
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")  # "none" required if cross-site + secure
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN") or None  # e.g. ".getsolarenergy.in" in production; None for localhost
BACKEND_USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")
USERS_FILE = BACKEND_USERS_FILE if os.path.exists(BACKEND_USERS_FILE) else "users.json"


# ---------------------------------------------------------------------------
# DB model — new table, additive only
# ---------------------------------------------------------------------------
class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    account_email = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False)  # "customer" / "technician" / "vendor"
    refresh_token_hash = Column(String, nullable=False, unique=True, index=True)

    device_name = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    os = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = True


# ---------------------------------------------------------------------------
# Helpers — account lookup across customer(users.json) / technician(Postgres)
# ---------------------------------------------------------------------------
def _load_customers() -> dict:
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    return {}


def _find_account(db: Session, email: str, password: str):
    """Returns (role, account_dict, technician_id_or_None) or None if no match/bad password."""
    technician = db.query(Technician).filter(Technician.email == email).first()
    if technician and verify_password(password, technician.password):
        return "technician", {
            "id": technician.id, "name": technician.name, "email": technician.email,
            "city": technician.city, "skill_level": technician.skill_level,
        }, technician.id

    customers = _load_customers()
    customer = customers.get(email)
    if customer and verify_password(password, customer["password"]):
        user_role = customer.get("role", "customer")
        return user_role, {
            "id": customer["id"], "name": customer["name"], "email": customer["email"],
            "city": customer.get("city"), "referral_code": customer.get("referral_code"),
            "role": user_role,
        }, None

    return None


def _get_account_by_email_role(db: Session, email: str, role: str):
    if role == "technician":
        t = db.query(Technician).filter(Technician.email == email).first()
        if not t:
            return None
        return {"id": t.id, "name": t.name, "email": t.email, "city": t.city, "skill_level": t.skill_level, "role": "technician"}
    customers = _load_customers()
    c = customers.get(email)
    if not c:
        return None
    user_role = c.get("role", "customer")
    return {"id": c["id"], "name": c["name"], "email": c["email"], "city": c.get("city"), "role": user_role}


# ---------------------------------------------------------------------------
# Token helpers
# ---------------------------------------------------------------------------
def _create_access_token(email: str, role: str) -> str:
    payload = {
        "sub": email,
        "role": role,
        "type": "access",
        "jti": secrets.token_hex(8),  # ensures uniqueness even if issued in the same second
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def _new_refresh_token() -> tuple[str, str]:
    """Returns (raw_token_for_cookie, sha256_hash_for_db)."""
    raw = secrets.token_urlsafe(48)
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, hashed


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def _set_refresh_cookie(response: Response, raw_token: str, expires_at: datetime):
    max_age = int((expires_at - datetime.utcnow()).total_seconds())
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=raw_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=max_age,
        path="/api/auth",
        domain=COOKIE_DOMAIN,
    )


def _clear_refresh_cookie(response: Response):
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path="/api/auth", domain=COOKIE_DOMAIN)


def _device_info(request: Request) -> dict:
    ua = request.headers.get("user-agent", "Unknown")
    return {
        "device_name": "Browser",
        "browser": ua.split(")")[0].split("(")[-1] if "(" in ua else ua[:40],
        "os": ua.split("(")[1].split(";")[0] if "(" in ua else "Unknown",
        "ip_address": request.client.host if request.client else "unknown",
    }


def get_current_account(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> dict:
    """Generic dependency — works for any role. Protected routes needing a
    SPECIFIC role should still check payload['role'] themselves, or keep
    using get_current_technician / the customer equivalent for role-locked routes."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Access token expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid access token.")
    return {"email": payload.get("sub"), "role": payload.get("role")}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post("/login")
def login(data: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    match = _find_account(db, data.email, data.password)
    if not match:
        raise HTTPException(status_code=400, detail="Invalid email or password.")
    role, account, _technician_id = match

    access_token = _create_access_token(data.email, role)

    raw_refresh, hashed_refresh = _new_refresh_token()
    expires_delta = (
        timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS_REMEMBER)
        if data.remember_me
        else timedelta(hours=REFRESH_TOKEN_EXPIRE_HOURS_NO_REMEMBER)
    )
    expires_at = datetime.utcnow() + expires_delta

    info = _device_info(request)
    session_row = UserSession(
        account_email=data.email,
        role=role,
        refresh_token_hash=hashed_refresh,
        expires_at=expires_at,
        **info,
    )
    db.add(session_row)
    db.commit()

    _set_refresh_cookie(response, raw_refresh, expires_at)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {**account, "role": role},
    }


@router.post("/refresh")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not raw_token:
        raise HTTPException(status_code=401, detail="No refresh token provided.")

    token_hash = _hash_token(raw_token)
    session_row = db.query(UserSession).filter(UserSession.refresh_token_hash == token_hash).first()

    if not session_row or session_row.revoked:
        # Reuse of a revoked/unknown token — treat as compromise, refuse.
        raise HTTPException(status_code=401, detail="Refresh token invalid or has been revoked.")
    if session_row.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Refresh token expired. Please log in again.")

    # Rotate: revoke old, issue new
    session_row.revoked = True
    remaining = session_row.expires_at - datetime.utcnow()

    raw_new, hashed_new = _new_refresh_token()
    info = _device_info(request)
    new_session_row = UserSession(
        account_email=session_row.account_email,
        role=session_row.role,
        refresh_token_hash=hashed_new,
        expires_at=datetime.utcnow() + remaining,
        **info,
    )
    db.add(new_session_row)
    session_row.last_used_at = datetime.utcnow()
    db.commit()

    _set_refresh_cookie(response, raw_new, new_session_row.expires_at)

    new_access_token = _create_access_token(session_row.account_email, session_row.role)
    return {"access_token": new_access_token, "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60}


@router.get("/me")
def me(current=Depends(get_current_account), db: Session = Depends(get_db)):
    account = _get_account_by_email_role(db, current["email"], current["role"])
    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")
    return {"success": True, "user": {**account, "role": current["role"]}}


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if raw_token:
        token_hash = _hash_token(raw_token)
        session_row = db.query(UserSession).filter(UserSession.refresh_token_hash == token_hash).first()
        if session_row:
            session_row.revoked = True
            db.commit()
    _clear_refresh_cookie(response)
    return {"success": True, "message": "Logged out from this device."}


@router.post("/logout-all")
def logout_all(current=Depends(get_current_account), response: Response = None, db: Session = Depends(get_db)):
    db.query(UserSession).filter(
        UserSession.account_email == current["email"],
        UserSession.revoked == False,  # noqa: E712
    ).update({"revoked": True})
    db.commit()
    if response is not None:
        _clear_refresh_cookie(response)
    return {"success": True, "message": "Logged out from all devices."}


@router.get("/sessions")
def list_sessions(current=Depends(get_current_account), db: Session = Depends(get_db)):
    sessions = db.query(UserSession).filter(
        UserSession.account_email == current["email"],
        UserSession.revoked == False,  # noqa: E712
        UserSession.expires_at > datetime.utcnow(),
    ).order_by(UserSession.last_used_at.desc()).all()

    return {
        "success": True,
        "sessions": [
            {
                "id": s.id,
                "device_name": s.device_name,
                "browser": s.browser,
                "os": s.os,
                "ip_address": s.ip_address,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "last_used_at": s.last_used_at.isoformat() if s.last_used_at else None,
                "expires_at": s.expires_at.isoformat() if s.expires_at else None,
            }
            for s in sessions
        ],
    }


@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, current=Depends(get_current_account), db: Session = Depends(get_db)):
    session_row = db.query(UserSession).filter(
        UserSession.id == session_id,
        UserSession.account_email == current["email"],
    ).first()
    if not session_row:
        raise HTTPException(status_code=404, detail="Session not found.")
    session_row.revoked = True
    db.commit()
    return {"success": True, "message": "Session revoked."}
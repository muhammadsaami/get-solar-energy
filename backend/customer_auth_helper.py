"""
Phase 4 - Customer authentication dependency
Reuses the SAME JWT format Phase 1's auth.py already issues via create_access_token({"sub": email}),
so a customer's existing login token also works for plant monitoring endpoints.
No new login route needed here — customers already log in via /api/login.
"""
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import json
import jwt

security_scheme = HTTPBearer()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
USERS_FILE = "users.json"


def _load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def get_current_customer(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> dict:
    """Returns the logged-in customer's user record (dict) from users.json, or 401s."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token.")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token.")

    users = _load_users()
    user = users.get(email)
    if not user:
        raise HTTPException(status_code=404, detail="Customer account not found.")
    return user
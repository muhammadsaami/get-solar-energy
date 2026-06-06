from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from security import hash_password, verify_password, create_access_token
import json
import os
import uuid

router = APIRouter()

USERS_FILE = "users.json"

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f)

class SignupRequest(BaseModel):
    name: str
    phone: str
    email: str
    password: str
    city: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/api/signup")
async def signup(data: SignupRequest):
    try:
        users = load_users()
        if data.email in users:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user_id = str(uuid.uuid4())
        referral_code = data.name[:3].upper() + user_id[:5].upper()
        
        users[data.email] = {
            "id": user_id,
            "name": data.name,
            "phone": data.phone,
            "email": data.email,
            "password": hash_password(data.password),
            "city": data.city,
            "referral_code": referral_code,
            "points": 0
        }
        save_users(users)
        
        token = create_access_token({"sub": data.email})
        
        return {
            "success": True,
            "message": "Account created!",
            "token": token,
            "user": {
                "id": user_id,
                "name": data.name,
                "email": data.email,
                "referral_code": referral_code
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/api/login")
async def login(data: LoginRequest):
    try:
        users = load_users()
        if data.email not in users:
            raise HTTPException(status_code=400, detail="Email not found")
        
        user = users[data.email]
        if not verify_password(data.password, user["password"]):
            raise HTTPException(status_code=400, detail="Wrong password")
        
        token = create_access_token({"sub": data.email})
        
        return {
            "success": True,
            "message": "Login successful!",
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "city": user["city"],
                "referral_code": user["referral_code"],
                "points": user["points"]
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        return {"success": False, "error": str(e)}
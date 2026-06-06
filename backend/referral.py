from fastapi import APIRouter
from pydantic import BaseModel
import json
import os

router = APIRouter()

USERS_FILE = "users.json"
REFERRALS_FILE = "referrals.json"

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f)

def load_referrals():
    if os.path.exists(REFERRALS_FILE):
        with open(REFERRALS_FILE, "r") as f:
            return json.load(f)
    return []

def save_referrals(referrals):
    with open(REFERRALS_FILE, "w") as f:
        json.dump(referrals, f)

class ReferralRequest(BaseModel):
    referral_code: str
    new_user_email: str

class PointsRequest(BaseModel):
    email: str

@router.post("/api/referral/apply")
async def apply_referral(data: ReferralRequest):
    try:
        users = load_users()
        referrals = load_referrals()

        referrer = None
        for email, user in users.items():
            if user["referral_code"] == data.referral_code:
                referrer = email
                break

        if not referrer:
            return {"success": False, "error": "Invalid referral code"}

        if data.new_user_email not in users:
            return {"success": False, "error": "New user not found"}

        for r in referrals:
            if r["referred_email"] == data.new_user_email:
                return {"success": False, "error": "Referral already applied"}

        users[referrer]["points"] += 100
        users[data.new_user_email]["points"] += 50
        save_users(users)

        referrals.append({
            "referrer_email": referrer,
            "referred_email": data.new_user_email,
            "referrer_points": 100,
            "referred_points": 50,
            "status": "completed"
        })
        save_referrals(referrals)

        return {
            "success": True,
            "message": "Referral applied!",
            "referrer_points_earned": 100,
            "new_user_points_earned": 50
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/api/referral/points/{email}")
async def get_points(email: str):
    try:
        users = load_users()
        if email not in users:
            return {"success": False, "error": "User not found"}
        
        return {
            "success": True,
            "email": email,
            "points": users[email]["points"],
            "referral_code": users[email]["referral_code"]
        }

    except Exception as e:
        return {"success": False, "error": str(e)}
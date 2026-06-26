from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from security import hash_password, verify_password, create_access_token
import json
import os
import uuid
import secrets
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
USERS_FILE = "users.json"
reset_tokens = {}

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

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

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
            "message": "Account created successfully!",
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

@router.post("/api/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    try:
        users = load_users()
        if data.email not in users:
            raise HTTPException(status_code=400, detail="Email not found")
        
        token = secrets.token_urlsafe(32)
        reset_tokens[token] = data.email
        
        reset_link = f"http://localhost:8080/reset-password.html?token={token}"
        
        message = MIMEMultipart()
        message["From"] = "GET Solar Support <devgetsolar@gmail.com>"
        message["To"] = data.email
        message["Subject"] = "GET Solar - Password Reset Request"
        
        body = f"""Hello,

You have requested to reset your GET Solar account password.

Click the link below to set a new password:
{reset_link}

This link is valid for 30 minutes only.

If you did not request this, please ignore this email. Your password will remain unchanged.

Best regards,
GET Solar Support Team
support@getsolar.in
"""
        message.attach(MIMEText(body, "plain"))
        
        await aiosmtplib.send(
            message,
            hostname="smtp.gmail.com",
            port=465,
            username="devgetsolar@gmail.com",
            password=os.getenv("EMAIL_PASSWORD"),
            use_tls=True,
        )
        
        return {"success": True, "message": "Password reset email sent successfully!"}
    
    except HTTPException as e:
        raise e
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/api/reset-password")
async def reset_password(data: ResetPasswordRequest):
    try:
        if data.token not in reset_tokens:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        
        email = reset_tokens[data.token]
        users = load_users()
        
        users[email]["password"] = hash_password(data.new_password)
        save_users(users)
        
        del reset_tokens[data.token]
        
        return {"success": True, "message": "Password reset successfully!"}
    
    except HTTPException as e:
        raise e
    except Exception as e:
        return {"success": False, "error": str(e)}
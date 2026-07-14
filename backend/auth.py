from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from security import hash_password, verify_password, create_access_token, create_reset_token, verify_reset_token, validate_password_strength
import json
import os
import uuid
import secrets
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import logging
import time
import abc
import hashlib
from datetime import datetime, timedelta
from collections import defaultdict

load_dotenv()

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter()
USERS_FILE = "users.json"

# ==============================================================================
# AUDIT LOGGING HELPER
# ==============================================================================
def log_auth_audit(email: str, event_type: str, client_ip: str, user_agent: str, metadata: dict = None):
    from database import SessionLocal, AuthAuditLog
    db = SessionLocal()
    try:
        log_entry = AuthAuditLog(
            email=email,
            event_type=event_type,
            timestamp=datetime.utcnow(),
            ip_address=client_ip,
            user_agent=user_agent,
            event_metadata=metadata or {}
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        logger.error("Audit log DB write failed: %s", str(e))
    finally:
        db.close()

# ==============================================================================
# ABSTRACT RATE LIMITER
# ==============================================================================
class RateLimiter(abc.ABC):
    @abc.abstractmethod
    def is_allowed(self, email: str, client_ip: str) -> bool:
        pass

class MemoryRateLimiter(RateLimiter):
    def __init__(self, window_seconds: int = 60, max_requests: int = 3):
        self.window_seconds = window_seconds
        self.max_requests = max_requests
        self.requests = defaultdict(list)
        
    def is_allowed(self, email: str, client_ip: str) -> bool:
        now = time.time()
        self.requests[email] = [t for t in self.requests[email] if now - t < self.window_seconds]
        if len(self.requests[email]) >= self.max_requests:
            return False
        self.requests[email].append(now)
        return True

class PostgresRateLimiter(RateLimiter):
    def __init__(self, window_seconds: int = 60, max_requests: int = 3):
        self.window_seconds = window_seconds
        self.max_requests = max_requests
        
    def is_allowed(self, email: str, client_ip: str) -> bool:
        from database import SessionLocal, AuthRateLimit
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            cutoff = now - timedelta(seconds=self.window_seconds)
            
            record = db.query(AuthRateLimit).filter(AuthRateLimit.email == email).first()
            if record:
                # Filter/clean requests out of the window
                if record.last_request_at < cutoff:
                    record.request_count = 1
                    record.first_request_at = now
                    record.last_request_at = now
                    record.client_ip = client_ip
                    db.commit()
                    return True
                else:
                    if record.request_count >= self.max_requests:
                        return False
                    record.request_count += 1
                    record.last_request_at = now
                    record.client_ip = client_ip
                    db.commit()
                    return True
            else:
                record = AuthRateLimit(
                    email=email,
                    request_count=1,
                    first_request_at=now,
                    last_request_at=now,
                    client_ip=client_ip
                )
                db.add(record)
                db.commit()
                return True
        except Exception as e:
            logger.error("PostgresRateLimiter exception: %s. Falling back to MemoryRateLimiter.", str(e))
            return memory_limiter.is_allowed(email, client_ip)
        finally:
            db.close()

# Instantiate rate limiters
memory_limiter = MemoryRateLimiter(window_seconds=60, max_requests=3)
rate_limiter = PostgresRateLimiter(window_seconds=60, max_requests=3)
auth_rate_limiter = PostgresRateLimiter(window_seconds=60, max_requests=10)

# ==============================================================================
# USER DATA FILE HELPERS
# ==============================================================================
def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f)

# ==============================================================================
# SCHEMAS
# ==============================================================================
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

# ==============================================================================
# ROUTERS
# ==============================================================================
@router.post("/api/signup")
async def signup(data: SignupRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    logger.info("Signup request received.")
    if not auth_rate_limiter.is_allowed(data.email, client_ip):
        logger.warning("Rate limit exceeded for signup.")
        raise HTTPException(status_code=429, detail="Too many signup attempts. Please try again later.")
    try:
        # Validate password strength
        validated_password = validate_password_strength(data.password)
        
        users = load_users()
        if data.email in users:
            log_auth_audit(data.email, "SIGNUP_FAILED", client_ip, user_agent, {"error": "Email already registered"})
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user_id = str(uuid.uuid4())
        referral_code = data.name[:3].upper() + user_id[:5].upper()
        
        users[data.email] = {
            "id": user_id,
            "name": data.name,
            "phone": data.phone,
            "email": data.email,
            "password": hash_password(validated_password),
            "city": data.city,
            "referral_code": referral_code,
            "points": 0
        }
        save_users(users)
        
        token = create_access_token({"sub": data.email})
        log_auth_audit(data.email, "SIGNUP_SUCCESS", client_ip, user_agent)
        
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
        logger.error("Signup failed: %s", str(e))
        log_auth_audit(data.email, "SIGNUP_FAILED", client_ip, user_agent, {"error": str(e)})
        raise HTTPException(status_code=500, detail="An error occurred during account creation.")

@router.post("/api/login")
async def login(data: LoginRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    logger.info("Login request received.")
    if not auth_rate_limiter.is_allowed(data.email, client_ip):
        logger.warning("Rate limit exceeded for login.")
        raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")
    try:
        users = load_users()
        if data.email not in users:
            log_auth_audit(data.email, "LOGIN_FAILED", client_ip, user_agent, {"error": "Email not found"})
            raise HTTPException(status_code=400, detail="Email not found")
        
        user = users[data.email]
        if not verify_password(data.password, user["password"]):
            log_auth_audit(data.email, "LOGIN_FAILED", client_ip, user_agent, {"error": "Wrong password"})
            raise HTTPException(status_code=400, detail="Wrong password")
        
        token = create_access_token({"sub": data.email})
        log_auth_audit(data.email, "LOGIN_SUCCESS", client_ip, user_agent)
        
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
        logger.error("Login failed: %s", str(e))
        log_auth_audit(data.email, "LOGIN_FAILED", client_ip, user_agent, {"error": str(e)})
        raise HTTPException(status_code=500, detail="An error occurred during login.")

@router.post("/api/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    logger.info("Forgot-password request received.")
    try:
        # Rate Limiting
        if not rate_limiter.is_allowed(data.email, client_ip):
            logger.warning("Rate limit exceeded for forgot password.")
            log_auth_audit(data.email, "RATE_LIMIT_EXCEEDED", client_ip, user_agent)
            raise HTTPException(status_code=429, detail="Too many password reset requests. Please try again later.")
            
        users = load_users()
        success_message = "If an account exists for this email address, a password reset link has been sent."
        
        # User existence masking: always return success message
        if data.email not in users:
            logger.info("Forgot-password: Email not found (masked response returned).")
            log_auth_audit(data.email, "PASSWORD_RESET_REQUESTED_NONEXISTENT", client_ip, user_agent)
            return {"success": True, "message": success_message}
            
        user = users[data.email]
        customer_name = user.get("name", "Solar Explorer")
        
        # Generate JWT reset token
        token = create_reset_token(data.email)
        token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
        
        # Save reset token to PostgreSQL
        from database import SessionLocal, PasswordResetToken
        db = SessionLocal()
        try:
            # Revoke previous tokens
            db.query(PasswordResetToken).filter(
                PasswordResetToken.email == data.email, 
                PasswordResetToken.revoked == False
            ).update({"revoked": True})
            
            now = datetime.utcnow()
            reset_token_record = PasswordResetToken(
                email=data.email,
                token_hash=token_hash,
                created_at=now,
                expires_at=now + timedelta(minutes=int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "30"))),
                revoked=False,
                ip_address=client_ip
            )
            db.add(reset_token_record)
            db.commit()
        except Exception as db_err:
            logger.error("Failed to save reset token to DB: %s", str(db_err))
            raise HTTPException(status_code=500, detail="Database persistence error.")
        finally:
            db.close()
        
        # Generate reset link
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:8080")
        reset_link = f"{frontend_url}/reset-password.html?token={token}"
        
        # Build MIMEMultipart email
        message = MIMEMultipart("alternative")
        message["From"] = os.getenv("SMTP_FROM", "GET Solar Support <devgetsolar@gmail.com>")
        message["To"] = data.email
        message["Subject"] = "GET Solar - Password Reset Request"
        
        # Text version fallback
        text_body = f"""Hello {customer_name},

We received a request to reset your password for your GET Solar Energy account.

Click the link below to set a new password:
{reset_link}

This link is valid for 30 minutes only.

If you did not request this reset, please ignore this email. Your password will remain unchanged.

Best regards,
GET Solar Energy Support Team
support@getsolar.in
"""
        
        # HTML version with premium branding
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f4f7f6; padding: 20px; color: #333333; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <div style="background: linear-gradient(135deg, #081a2e 0%, #030a12 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 0.5px; font-weight: bold;">GET Solar Energy</h1>
              </div>
              <div style="padding: 30px; line-height: 1.6;">
                <p style="font-size: 16px; margin-top: 0; color: #1e293b;">Hello {customer_name},</p>
                <p style="font-size: 14px; color: #475569;">We received a request to reset your password for your GET Solar Energy account. Click the button below to set a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{reset_link}" style="background-color: #ff8a1d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(255, 138, 29, 0.3);">Reset Password</a>
                </div>
                <p style="font-size: 12px; color: #64748b;">If the button above does not work, copy and paste the following link into your browser:</p>
                <p style="font-size: 12px; word-break: break-all; color: #0284c7;"><a href="{reset_link}" style="color: #0284c7; text-decoration: underline;">{reset_link}</a></p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                <p style="font-size: 12px; color: #64748b; margin-bottom: 0;"><strong>Security Notice:</strong> This password reset link is valid for <strong>30 minutes</strong> only. If you did not request this reset, please ignore this email; your account remains secure.</p>
              </div>
              <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px 0; font-weight: bold;">GET Solar Energy Support Team</p>
                <p style="margin: 0;"><a href="mailto:support@getsolar.in" style="color: #0284c7; text-decoration: none;">support@getsolar.in</a></p>
              </div>
            </div>
          </body>
        </html>
        """
        
        message.attach(MIMEText(text_body, "plain"))
        message.attach(MIMEText(html_body, "html"))
        
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "465"))
        smtp_user = os.getenv("SMTP_USERNAME", "devgetsolar@gmail.com")
        smtp_pass = os.getenv("SMTP_PASSWORD")
        
        # SMTP robust dispatch with connection timeout & retry
        max_retries = 3
        retry_delay = 1
        success_dispatch = False
        
        for attempt in range(max_retries):
            try:
                await aiosmtplib.send(
                    message,
                    hostname=smtp_host,
                    port=smtp_port,
                    username=smtp_user,
                    password=smtp_pass,
                    use_tls=True,
                    timeout=10,
                )
                success_dispatch = True
                break
            except Exception as smtp_err:
                logger.warning("SMTP dispatch attempt %d failed: %s", attempt + 1, str(smtp_err))
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    
        if not success_dispatch:
            logger.error("SMTP delivery failed completely after %d attempts.", max_retries)
            log_auth_audit(data.email, "PASSWORD_RESET_SMTP_FAILED", client_ip, user_agent)
            # Mask SMTP failures from users to prevent details leakage
            return {"success": True, "message": success_message}
            
        logger.info("Forgot-password: Reset email dispatched successfully.")
        log_auth_audit(data.email, "PASSWORD_RESET_REQUEST", client_ip, user_agent)
        return {"success": True, "message": success_message}
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error("Forgot-password exception: %s", str(e))
        raise HTTPException(status_code=500, detail="An error occurred while processing your request.")

@router.post("/api/reset-password")
async def reset_password(data: ResetPasswordRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    logger.info("Reset-password request received.")
    try:
        # Validate password strength
        validated_password = validate_password_strength(data.new_password)
        
        # Calculate SHA-256 token hash
        token_hash = hashlib.sha256(data.token.encode('utf-8')).hexdigest()
        
        # Validate token against PostgreSQL
        from database import SessionLocal, PasswordResetToken
        db = SessionLocal()
        token_record = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == token_hash).first()
        
        if not token_record or token_record.used_at is not None or token_record.revoked or token_record.expires_at < datetime.utcnow():
            log_auth_audit("unknown", "PASSWORD_RESET_FAILED", client_ip, user_agent, {"error": "Invalid or expired token"})
            raise HTTPException(status_code=400, detail="Invalid or expired token.")
            
        # Verify JWT signature and claims
        email = verify_reset_token(data.token)
        
        users = load_users()
        if email not in users:
            log_auth_audit(email, "PASSWORD_RESET_FAILED", client_ip, user_agent, {"error": "Subject email not found in user database"})
            raise HTTPException(status_code=400, detail="Invalid token subject.")
            
        # Hash and save new password
        users[email]["password"] = hash_password(validated_password)
        save_users(users)
        
        # Mark token used
        token_record.used_at = datetime.utcnow()
        db.commit()
        db.close()
        
        logger.info("Reset-password: Password reset completed successfully.")
        log_auth_audit(email, "PASSWORD_RESET_SUCCESS", client_ip, user_agent)
        return {"success": True, "message": "Password reset successfully!"}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error("Reset-password exception: %s", str(e))
        log_auth_audit("unknown", "PASSWORD_RESET_FAILED", client_ip, user_agent, {"error": str(e)})
        raise HTTPException(status_code=500, detail="An error occurred while resetting your password.")
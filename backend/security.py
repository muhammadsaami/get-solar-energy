from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
import os
import re
import logging

load_dotenv()

logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "getsolar-secret-key-2026-india")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "30"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

def validate_password_strength(password: str) -> str:
    cleaned = password.strip()
    if len(cleaned) < 8 or len(cleaned) > 72:
        raise HTTPException(
            status_code=400, 
            detail="Password must be between 8 and 72 characters long."
        )
    if not re.search(r"[A-Z]", cleaned):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one uppercase letter."
        )
    if not re.search(r"[a-z]", cleaned):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one lowercase letter."
        )
    if not re.search(r"\d", cleaned):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one digit."
        )
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", cleaned):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one special character."
        )
    return cleaned

def hash_password(password: str):
    password = password[:72]
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    plain_password = plain_password[:72]
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        token_type = payload.get("type")
        if email is None or token_type != "access":
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def create_reset_token(email: str) -> str:
    now = datetime.utcnow()
    expire = now + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": email,
        "type": "reset",
        "exp": expire,
        "iat": now,
        "iss": "GET Solar Energy",
        "aud": "password-reset"
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_reset_token(token: str) -> str:
    try:
        payload = jwt.decode(
            token, 
            SECRET_KEY, 
            algorithms=[ALGORITHM],
            audience="password-reset"
        )
        email = payload.get("sub")
        token_type = payload.get("type")
        iss = payload.get("iss")
        aud = payload.get("aud")
        iat = payload.get("iat")
        exp = payload.get("exp")
        
        if None in (email, token_type, iss, aud, iat, exp):
            raise HTTPException(status_code=400, detail="Required JWT claim is missing")
            
        if token_type != "reset" or iss != "GET Solar Energy" or aud != "password-reset":
            raise HTTPException(status_code=400, detail="Invalid token claims")
            
        return email
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

def run_startup_health_check():
    logger.info("Initializing GET Solar Energy Authentication System health check...")
    errors = []
    
    # 1. Environment Verification
    required_vars = [
        "JWT_SECRET_KEY", "JWT_ALGORITHM", "RESET_TOKEN_EXPIRE_MINUTES",
        "SMTP_HOST", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_FROM"
    ]
    for var in required_vars:
        if not os.getenv(var):
            errors.append(f"Missing required environment variable: {var}")
            
    # 2. JWT Configuration
    try:
        test_token = jwt.encode({"test": "val"}, SECRET_KEY, algorithm=ALGORITHM)
        decoded = jwt.decode(test_token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded.get("test") == "val"
    except Exception as e:
        errors.append(f"JWT setup verification failed: {str(e)}")
        
    # 3. Database Connection
    try:
        from database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        errors.append(f"Database connection check failed: {str(e)}")
        
    # 4. Password Hashing Initialization
    try:
        test_pwd = "TestPassword123!"
        hashed = hash_password(test_pwd)
        assert verify_password(test_pwd, hashed)
    except Exception as e:
        errors.append(f"Password hashing verification failed: {str(e)}")
        
    # 5. Email Templates & SMTP Configuration
    port = os.getenv("SMTP_PORT")
    if port:
        try:
            int(port)
        except ValueError:
            errors.append("SMTP_PORT must be an integer")
            
    if errors:
        logger.error("GET Solar Energy Authentication Health Check FAILED:")
        for err in errors:
            logger.error(" - %s", err)
        raise RuntimeError("Authentication System Health Check FAILED. Verify environment configuration.")
    else:
        logger.info("GET Solar Energy Authentication System Health Check: SUCCESS")
        logger.info(" - JWT Configured: YES")
        logger.info(" - SMTP Configured: YES")
        logger.info(" - Database Connected: YES")
        logger.info(" - Password Hashing Operational: YES")
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, nullable=False)
    expires_at = Column(DateTime, index=True, nullable=False)
    used_at = Column(DateTime, nullable=True)
    revoked = Column(Boolean, default=False, nullable=False)
    ip_address = Column(String, nullable=True)

class AuthRateLimit(Base):
    __tablename__ = "auth_rate_limits"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    request_count = Column(Integer, default=0, nullable=False)
    first_request_at = Column(DateTime, nullable=False)
    last_request_at = Column(DateTime, index=True, nullable=False)
    client_ip = Column(String, nullable=True)

class AuthAuditLog(Base):
    __tablename__ = "auth_audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    event_type = Column(String, index=True, nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    event_metadata = Column(JSON, nullable=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
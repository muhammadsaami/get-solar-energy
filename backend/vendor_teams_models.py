"""
Phase 5 - Vendor Teams
New DB table, additive only. Same vendor_email string pattern as
vendor_models.py / vendor_payments_models.py - no vendor login system
exists yet.
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from database import Base
from datetime import datetime


class VendorTeamMember(Base):
    __tablename__ = "vendor_team_members"

    id = Column(Integer, primary_key=True, index=True)
    vendor_email = Column(String, index=True, nullable=False)

    name = Column(String, nullable=False)
    role = Column(String, nullable=True)  # e.g. Site Supervisor, Installer, Sales
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    city = Column(String, nullable=True)

    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
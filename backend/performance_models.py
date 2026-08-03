"""
Phase 3 (extension) - Profile Photo, Ratings, Skills & Badges
All new tables (no ALTER TABLE needed on the existing technicians table).
"""
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text
from database import Base
from datetime import datetime


class TechnicianProfilePhoto(Base):
    __tablename__ = "technician_profile_photos"
    id = Column(Integer, primary_key=True, index=True)
    technician_id = Column(Integer, ForeignKey("technicians.id"), unique=True, nullable=False)
    file_url = Column(String, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow)


class Rating(Base):
    __tablename__ = "technician_ratings"
    id = Column(Integer, primary_key=True, index=True)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=False)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    rating = Column(Integer, nullable=False)   # 1-5
    review_text = Column(Text, nullable=True)
    rated_by_email = Column(String, nullable=True)   # customer/vendor email, no auth gate yet
    created_at = Column(DateTime, default=datetime.utcnow)


class TechnicianSkill(Base):
    __tablename__ = "technician_skills"
    id = Column(Integer, primary_key=True, index=True)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=False)
    skill_name = Column(String, nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow)


class TechnicianBadge(Base):
    __tablename__ = "technician_badges"
    id = Column(Integer, primary_key=True, index=True)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=False)
    badge_name = Column(String, nullable=False)
    awarded_at = Column(DateTime, default=datetime.utcnow)
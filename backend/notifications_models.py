"""
Phase 3 (extension) - Notifications
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from database import Base
from datetime import datetime


class TechnicianNotification(Base):
    __tablename__ = "technician_notifications"
    id = Column(Integer, primary_key=True, index=True)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String, default="system")   # job / earning / training / system
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
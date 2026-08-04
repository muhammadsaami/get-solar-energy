"""
Phase 3 (extension) - AI Troubleshooting Assistant conversation log
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from database import Base
from datetime import datetime


class AIConversationLog(Base):
    __tablename__ = "ai_conversation_logs"
    id = Column(Integer, primary_key=True, index=True)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=False)
    interaction_type = Column(String, nullable=False)   # "chat" / "image" / "diagnose"
    user_message = Column(Text, nullable=True)
    ai_response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
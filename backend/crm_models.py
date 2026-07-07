from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database_sqlite import BaseSqlite

class CRMActivityTimelineModel(BaseSqlite):
    __tablename__ = "crm_timeline"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    event_type = Column(String, nullable=False) # e.g. Customer Created, Bill Uploaded, etc.
    user = Column(String, default="System")
    module = Column(String, nullable=False) # e.g. CRM, Roof Analysis, Proposal Generator, etc.
    status = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CRMTaskModel(BaseSqlite):
    __tablename__ = "crm_tasks"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    title = Column(String, nullable=False)
    department = Column(String, nullable=False) # Sales, Survey, Installation, Finance, AMC, Support
    assigned_to = Column(String, nullable=True)
    priority = Column(String, nullable=False) # High, Medium, Low
    due_date = Column(String, nullable=False)
    status = Column(String, default="Pending") # Pending, In Progress, Completed, Cancelled
    progress = Column(Integer, default=0) # 0 to 100
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CRMFollowUpModel(BaseSqlite):
    __tablename__ = "crm_followups"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    title = Column(String, nullable=False) # Followup action
    due_date = Column(String, nullable=False) # ISO String or YYYY-MM-DD
    priority = Column(String, nullable=False) # High, Medium, Low
    status = Column(String, default="Pending") # Pending, Completed, Cancelled, Overdue
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CRMMeetingModel(BaseSqlite):
    __tablename__ = "crm_meetings"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    title = Column(String, nullable=False)
    meeting_type = Column(String, nullable=False) # Phone, Video, Office, Site Visit
    scheduled_date = Column(String, nullable=False) # YYYY-MM-DD
    scheduled_time = Column(String, nullable=False) # HH:MM
    assigned_to = Column(String, nullable=True)
    outcome = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    next_action = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

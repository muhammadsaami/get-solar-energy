from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, Index
from sqlalchemy.sql import func
from database_sqlite import BaseSqlite


class ProjectModel(BaseSqlite):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True)
    display_id = Column(String(20), unique=True, nullable=False, index=True)

    title = Column(String(300), nullable=False)
    project_type = Column(String(20), default="residential")
    description = Column(Text, nullable=True)

    customer_name = Column(String(200), nullable=True)
    customer_email = Column(String(200), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)

    status = Column(String(50), default="initiation", index=True)
    progress = Column(Integer, default=0)
    priority = Column(String(20), default="medium", index=True)

    start_date = Column(Date, nullable=True)
    target_date = Column(Date, nullable=True)
    completed_date = Column(Date, nullable=True)

    assigned_engineer = Column(String(100), nullable=True, index=True)
    assigned_team = Column(String(100), nullable=True, index=True)

    solar_system_size = Column(Float, default=0)
    panel_count = Column(Integer, default=0)
    panel_capacity = Column(Integer, default=0)
    inverter_model = Column(String(200), nullable=True)
    battery_model = Column(String(200), nullable=True)

    total_budget = Column(Float, default=0)
    project_value = Column(Float, default=0)
    currency = Column(String(10), default="INR")
    budget_variance = Column(Float, default=0)
    timeline_variance = Column(Integer, default=0)

    health_score = Column(Integer, default=80)
    quality_score = Column(Integer, default=80)
    safety_score = Column(Integer, default=80)

    notes = Column(Text, default="[]")
    tasks = Column(Text, default="[]")
    activities = Column(Text, default="[]")
    documents = Column(Text, default="[]")
    risk_flags = Column(Text, default="[]")
    stage_start_dates = Column(Text, default="{}")
    stage_completion_dates = Column(Text, default="{}")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


Index("idx_project_status", ProjectModel.status)
Index("idx_project_priority", ProjectModel.priority)
Index("idx_project_city", ProjectModel.city)
Index("idx_project_assigned_engineer", ProjectModel.assigned_engineer)
Index("idx_project_assigned_team", ProjectModel.assigned_team)
Index("idx_project_health_score", ProjectModel.health_score)
Index("idx_project_created_at", ProjectModel.created_at)

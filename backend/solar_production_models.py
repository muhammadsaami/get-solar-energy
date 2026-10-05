"""
Phase 7B - Solar Production Models & Persistence Layer
Stores canonical solar production readings (from manual entry or report upload)
associated with authenticated customers.
"""
from sqlalchemy import Column, Integer, String, DateTime, Float, JSON
from database import Base
from datetime import datetime


class CustomerSolarProduction(Base):
    __tablename__ = "customer_solar_production"

    id = Column(Integer, primary_key=True, index=True)
    customer_email = Column(String, index=True, nullable=False)
    period_type = Column(String, nullable=False, default="month")  # day, week, month, year, lifetime, custom
    start_date = Column(String, nullable=True)                      # YYYY-MM-DD
    end_date = Column(String, nullable=True)                        # YYYY-MM-DD
    month = Column(String, nullable=True)                           # e.g. "October"
    year = Column(Integer, nullable=True)                           # e.g. 2026
    production_kwh = Column(Float, nullable=False)                  # energy generated in kWh
    installed_capacity_kwp = Column(Float, nullable=True)           # optional installed capacity in kWp
    source = Column(String, nullable=False, default="manual")       # manual | upload
    daily_generation_kwh = Column(Float, nullable=True)             # calculated or explicit daily average
    daily_points = Column(JSON, nullable=True)                      # optional list of discrete daily readings
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

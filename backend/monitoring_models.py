"""
Phase 4 - Plant Monitoring & Analytics
Database models for registered solar plants, their generation readings,
and system-generated alerts (low generation, inverter fault, no data, etc).
"""
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Boolean, Text
from database import Base
from datetime import datetime


class SolarPlant(Base):
    __tablename__ = "solar_plants"
    id = Column(Integer, primary_key=True, index=True)
    customer_email = Column(String, index=True, nullable=False)   # links to Phase 1 customer account (users.json)
    vendor_email = Column(String, nullable=True)                  # links to Phase 2 vendor who installed it
    technician_id = Column(Integer, nullable=True)                # links to Phase 3 technician who did install/AMC
    capacity_kw = Column(Float, nullable=False)
    inverter_brand = Column(String, nullable=True)
    inverter_serial = Column(String, nullable=True)
    city = Column(String, nullable=False)
    status = Column(String, default="Active")   # Active, Inactive, Under Maintenance
    installed_at = Column(DateTime, default=datetime.utcnow)


class GenerationReading(Base):
    __tablename__ = "generation_readings"
    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("solar_plants.id"), nullable=False)
    reading_date = Column(DateTime, nullable=False)      # the day this reading covers
    generation_kwh = Column(Float, nullable=False)       # actual units generated that day
    expected_kwh = Column(Float, nullable=False)         # capacity_kw * 4.5 (avg sun-hours) benchmark
    source = Column(String, default="simulated")         # simulated / inverter_api / manual
    created_at = Column(DateTime, default=datetime.utcnow)


class Alert(Base):
    __tablename__ = "plant_alerts"
    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("solar_plants.id"), nullable=False)
    alert_type = Column(String, nullable=False)   # Low Generation, No Data, Inverter Fault, Maintenance Due
    severity = Column(String, default="Medium")   # Low, Medium, High
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
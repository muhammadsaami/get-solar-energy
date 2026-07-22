"""
Phase 3 - Technician Network Database Models
Uses the same Base/engine from database.py so all tables are created together
via Base.metadata.create_all(bind=engine) in main.py
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey, Text
from database import Base
from datetime import datetime


class Technician(Base):
    __tablename__ = "technicians"
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    city = Column(String, nullable=False)
    skill_level = Column(String, default="Level 1")   # Level 1, Level 2, Certified
    kyc_status = Column(String, default="Pending")    # Pending, Verified, Rejected
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class TrainingModule(Base):
    __tablename__ = "training_modules"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    level = Column(String, nullable=False)   # "Level 1" / "Level 2"
    content_url = Column(String, nullable=True)
    passing_score = Column(Integer, default=70)
    order_index = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class TrainingQuizQuestion(Base):
    __tablename__ = "training_quiz_questions"
    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("training_modules.id"), nullable=False)
    question = Column(Text, nullable=False)
    option_a = Column(String, nullable=False)
    option_b = Column(String, nullable=False)
    option_c = Column(String, nullable=False)
    option_d = Column(String, nullable=False)
    correct_option = Column(String, nullable=False)  # 'A' / 'B' / 'C' / 'D'


class TechnicianTrainingProgress(Base):
    __tablename__ = "technician_training_progress"
    id = Column(Integer, primary_key=True, index=True)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=False)
    module_id = Column(Integer, ForeignKey("training_modules.id"), nullable=False)
    status = Column(String, default="Not Started")  # Not Started, Passed, Failed
    score = Column(Integer, nullable=True)
    attempts = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)


class Certification(Base):
    __tablename__ = "certifications"
    id = Column(Integer, primary_key=True, index=True)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=False)
    level = Column(String, nullable=False)
    badge_name = Column(String, nullable=False)
    certificate_number = Column(String, unique=True, nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow)
    valid_till = Column(DateTime, nullable=True)


class JobPosting(Base):
    __tablename__ = "job_postings"
    id = Column(Integer, primary_key=True, index=True)
    vendor_email = Column(String, nullable=False)   # links to Phase 2 vendor account
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    job_type = Column(String, nullable=False)   # Installation, AMC, Repair, Inspection
    city = Column(String, nullable=False)
    budget = Column(Float, nullable=True)
    status = Column(String, default="Open")   # Open, Assigned, Completed, Cancelled
    required_skill_level = Column(String, default="Level 1")
    created_at = Column(DateTime, default=datetime.utcnow)


class JobApplication(Base):
    __tablename__ = "job_applications"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("job_postings.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=False)
    status = Column(String, default="Applied")   # Applied, Accepted, Rejected
    applied_at = Column(DateTime, default=datetime.utcnow)


class WorkOrder(Base):
    __tablename__ = "work_orders"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("job_postings.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=False)
    status = Column(String, default="Assigned")   # Assigned, In Progress, Completed, Verified
    proof_photo_url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)


class Earning(Base):
    __tablename__ = "earnings"
    id = Column(Integer, primary_key=True, index=True)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=False)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payout_status = Column(String, default="Pending")   # Pending, Paid
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
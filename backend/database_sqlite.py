from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
import os

DATABASE_URL_SQLITE = "sqlite:///./customer_platform.db"

engine_sqlite = create_engine(
    DATABASE_URL_SQLITE, connect_args={"check_same_thread": False}
)
SessionLocalSqlite = sessionmaker(autocommit=False, autoflush=False, bind=engine_sqlite)
BaseSqlite = declarative_base()

class CustomerModel(BaseSqlite):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    consumer_number = Column(String, unique=True, index=True, nullable=False)
    customer_name = Column(String, nullable=False)
    discom = Column(String, index=True, nullable=False)
    city = Column(String, index=True, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    bills = relationship("BillModel", back_populates="customer", cascade="all, delete-orphan")

class BillModel(BaseSqlite):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    file_name = Column(String, nullable=False)
    billing_period = Column(String, nullable=False)
    monthly_units = Column(Float, nullable=False)
    bill_amount = Column(Float, nullable=False)
    per_unit_rate = Column(Float, nullable=False)
    recommended_kw = Column(Float, nullable=False)
    monthly_savings = Column(Float, nullable=False)
    annual_savings = Column(Float, nullable=True)
    system_cost = Column(Float, nullable=False)
    subsidy = Column(Float, nullable=True)
    net_cost = Column(Float, nullable=True)
    payback_years = Column(Float, nullable=False)
    savings_25yr = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("CustomerModel", back_populates="bills")

# Explicit Index definitions for fast queries
Index("idx_customer_number", CustomerModel.consumer_number)
Index("idx_customer_city", CustomerModel.city)
Index("idx_customer_discom", CustomerModel.discom)

def get_sqlite_db():
    db = SessionLocalSqlite()
    try:
        yield db
    finally:
        db.close()

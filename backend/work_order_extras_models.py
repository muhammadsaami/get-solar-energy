"""
Phase 3 (extension) - Work Order supporting tables
These are NEW tables (not new columns on the existing work_orders table),
so create_all() can add them without needing an ALTER TABLE migration.
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from database import Base
from datetime import datetime


class WorkOrderNote(Base):
    __tablename__ = "work_order_notes"
    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class WorkOrderAttachment(Base):
    __tablename__ = "work_order_attachments"
    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    file_url = Column(String, nullable=False)
    file_type = Column(String, nullable=False)   # "photo" / "document" / "signature"
    uploaded_at = Column(DateTime, default=datetime.utcnow)


class WorkOrderChecklistItem(Base):
    __tablename__ = "work_order_checklist_items"
    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    item_text = Column(String, nullable=False)
    is_checked = Column(Boolean, default=False)
    checked_at = Column(DateTime, nullable=True)
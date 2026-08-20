"""
Phase 5 - Vendor Payments/Payouts
New DB table, additive only. Same vendor_email string pattern as
vendor_models.py (Vendor Inventory) - no vendor login system exists yet.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
from datetime import datetime


class VendorPayout(Base):
    __tablename__ = "vendor_payouts"

    id = Column(Integer, primary_key=True, index=True)
    vendor_email = Column(String, index=True, nullable=False)

    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False, default="INR")

    status = Column(String, nullable=False, default="Pending")  # Pending / Processing / Paid / Failed
    payment_method = Column(String, nullable=True)  # Bank Transfer / UPI / Cheque
    reference_id = Column(String, nullable=True)  # bank/UPI transaction ref once paid
    notes = Column(String, nullable=True)  # e.g. which job/order this payout is for

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)


class VendorInvoice(Base):
    """One invoice per payout — created on demand once a payout exists."""
    __tablename__ = "vendor_invoices"

    id = Column(Integer, primary_key=True, index=True)
    vendor_email = Column(String, index=True, nullable=False)
    payout_id = Column(Integer, index=True, nullable=False)

    invoice_number = Column(String, unique=True, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, nullable=False, default="Draft")  # Draft / Sent / Paid

    created_at = Column(DateTime, default=datetime.utcnow)
"""
Phase 5 - Vendor Documents
New DB table, additive only. Same vendor_email string pattern as the other
Phase 5 modules - no vendor login system exists yet. Reuses the same
local-disk storage convention as uploads.py (backend/uploads/, served via
StaticFiles at /uploads) so there's only one place files actually live.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
from datetime import datetime


class VendorDocument(Base):
    __tablename__ = "vendor_documents"

    id = Column(Integer, primary_key=True, index=True)
    vendor_email = Column(String, index=True, nullable=False)

    document_name = Column(String, nullable=False)  # e.g. "GST Certificate"
    document_type = Column(String, nullable=True)   # e.g. GST / PAN / License / Agreement / Other

    file_url = Column(String, nullable=False)        # e.g. /uploads/<uuid>.pdf
    original_filename = Column(String, nullable=True)
    size_mb = Column(Float, nullable=True)

    uploaded_at = Column(DateTime, default=datetime.utcnow)
"""
Phase 5 - Vendor Inventory
New DB table, additive only. No vendor login/auth system exists yet in the
codebase (confirmed: no vendor.py / vendor_auth.py / vendor router anywhere
in main.py) - vendors are identified by vendor_email (string), same pattern
already used in plants.py. Swap to a real get_current_vendor() dependency
once vendor auth exists.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
from datetime import datetime


class VendorInventoryItem(Base):
    __tablename__ = "vendor_inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    vendor_email = Column(String, index=True, nullable=False)

    product_name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    sku = Column(String, nullable=True, index=True)

    quantity = Column(Integer, nullable=False, default=0)
    unit = Column(String, nullable=True, default="pcs")
    unit_price = Column(Float, nullable=True)

    warehouse_city = Column(String, nullable=True)
    status = Column(String, nullable=False, default="In Stock")  # In Stock / Low Stock / Out of Stock

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
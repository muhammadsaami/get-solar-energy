"""
Phase 5 - Vendor Inventory
CRUD APIs for vendor stock/product records.

RELEASE GATE: Vendor Portal is not publicly released. Every endpoint here
is Admin-only until the future Vendor Portal release (owner-or-admin
scoping to be added then). Do not relax without a release decision.

Does NOT touch: auth.py, session_auth.py, technician_auth.py, Customer
APIs, Plant Monitoring, CRM, AI, Admin. Real PostgreSQL table only - no
mock/in-memory data.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from security import verify_token
from permissions import has_admin_access
from vendor_models import VendorInventoryItem
import logging

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/api/vendor/inventory",
    tags=["Vendor Inventory"],
    dependencies=[Depends(verify_token)],
)


def _require_admin(user_email: str):
    """Release gate: Vendor Portal is admin-only until public release."""
    if not has_admin_access(user_email):
        raise HTTPException(status_code=403, detail="Admin access required")


# ==============================================================================
# SCHEMAS
# ==============================================================================
class InventoryItemCreateRequest(BaseModel):
    vendor_email: str
    product_name: str
    category: Optional[str] = None
    sku: Optional[str] = None
    quantity: int = 0
    unit: Optional[str] = "pcs"
    unit_price: Optional[float] = None
    warehouse_city: Optional[str] = None


class InventoryItemUpdateRequest(BaseModel):
    product_name: Optional[str] = None
    category: Optional[str] = None
    sku: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    warehouse_city: Optional[str] = None
    status: Optional[str] = None


def _derive_status(quantity: int) -> str:
    if quantity <= 0:
        return "Out of Stock"
    if quantity <= 5:
        return "Low Stock"
    return "In Stock"


def _serialize(item: VendorInventoryItem) -> dict:
    return {
        "id": item.id,
        "vendor_email": item.vendor_email,
        "product_name": item.product_name,
        "category": item.category,
        "sku": item.sku,
        "quantity": item.quantity,
        "unit": item.unit,
        "unit_price": item.unit_price,
        "warehouse_city": item.warehouse_city,
        "status": item.status,
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "updated_at": item.updated_at.isoformat() if item.updated_at else None,
    }


# ==============================================================================
# ROUTES
# ==============================================================================
@router.post("")
def add_inventory_item(data: InventoryItemCreateRequest, db: Session = Depends(get_db), user_email: str = Depends(verify_token)):
    _require_admin(user_email)
    try:
        item = VendorInventoryItem(
            vendor_email=data.vendor_email,
            product_name=data.product_name,
            category=data.category,
            sku=data.sku,
            quantity=data.quantity,
            unit=data.unit,
            unit_price=data.unit_price,
            warehouse_city=data.warehouse_city,
            status=_derive_status(data.quantity),
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        logger.info(
            "Vendor inventory item added: id=%s vendor=%s product=%s",
            item.id, item.vendor_email, item.product_name
        )
        return {"success": True, "message": "Inventory item added.", "item": _serialize(item)}
    except Exception as e:
        db.rollback()
        logger.error("Failed to add inventory item: %s", str(e))
        raise HTTPException(status_code=500, detail="Could not add inventory item.")


@router.get("")
def list_inventory(
    vendor_email: str,
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    user_email: str = Depends(verify_token),
):
    _require_admin(user_email)
    query = db.query(VendorInventoryItem).filter(VendorInventoryItem.vendor_email == vendor_email)

    if search:
        like_pattern = f"%{search}%"
        query = query.filter(
            (VendorInventoryItem.product_name.ilike(like_pattern)) |
            (VendorInventoryItem.sku.ilike(like_pattern))
        )
    if category:
        query = query.filter(VendorInventoryItem.category == category)
    if status:
        query = query.filter(VendorInventoryItem.status == status)

    total_count = query.count()
    page = max(page, 1)
    page_size = max(1, min(page_size, 100))

    items = (
        query.order_by(VendorInventoryItem.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "success": True,
        "page": page,
        "page_size": page_size,
        "total_count": total_count,
        "total_pages": (total_count + page_size - 1) // page_size if total_count else 0,
        "count": len(items),
        "items": [_serialize(i) for i in items],
    }


@router.get("/{item_id}")
def get_inventory_item(item_id: int, db: Session = Depends(get_db), user_email: str = Depends(verify_token)):
    _require_admin(user_email)
    item = db.query(VendorInventoryItem).filter(VendorInventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found.")
    return {"success": True, "item": _serialize(item)}


@router.put("/{item_id}")
def update_inventory_item(item_id: int, data: InventoryItemUpdateRequest, db: Session = Depends(get_db), user_email: str = Depends(verify_token)):
    _require_admin(user_email)
    item = db.query(VendorInventoryItem).filter(VendorInventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found.")

    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    # Keep status in sync unless the caller explicitly set it themselves
    if "quantity" in update_data and "status" not in update_data:
        item.status = _derive_status(item.quantity)

    db.commit()
    db.refresh(item)
    logger.info("Vendor inventory item updated: id=%s", item.id)
    return {"success": True, "message": "Inventory item updated.", "item": _serialize(item)}


@router.delete("/{item_id}")
def delete_inventory_item(item_id: int, db: Session = Depends(get_db), user_email: str = Depends(verify_token)):
    _require_admin(user_email)
    item = db.query(VendorInventoryItem).filter(VendorInventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found.")
    db.delete(item)
    db.commit()
    logger.info("Vendor inventory item deleted: id=%s", item_id)
    return {"success": True, "message": "Inventory item deleted."}
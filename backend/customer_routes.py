from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from database_sqlite import get_sqlite_db
import customer_service

router = APIRouter(tags=["Customer Data Platform"])

# ═════════════════════════════════════════════════════════════
# PYDANTIC SCHEMAS
# ═════════════════════════════════════════════════════════════
class BillResponse(BaseModel):
    id: int
    customer_id: int
    file_name: str
    billing_period: str
    monthly_units: float
    bill_amount: float
    per_unit_rate: float
    recommended_kw: float
    monthly_savings: float
    annual_savings: Optional[float] = None
    system_cost: float
    subsidy: Optional[float] = None
    net_cost: Optional[float] = None
    payback_years: float
    savings_25yr: float
    created_at: datetime

    class Config:
        from_attributes = True

class CustomerBase(BaseModel):
    consumer_number: str
    customer_name: str
    discom: str
    city: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    customer_name: Optional[str] = None
    discom: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime
    bills: List[BillResponse] = []

    class Config:
        from_attributes = True

# ═════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═════════════════════════════════════════════════════════════

@router.get("/api/customers", response_model=List[CustomerResponse])
def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_sqlite_db)
):
    """Retrieve a paginated list of customer accounts."""
    return customer_service.get_customers(db, skip=skip, limit=limit)


@router.get("/api/customers/search", response_model=List[CustomerResponse])
def search_customers(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_sqlite_db)
):
    """Search customers by consumer number, name, city, or discom."""
    return customer_service.search_customers(db, q=q)


@router.get("/api/customers/{id}", response_model=CustomerResponse)
def get_customer_profile(
    id: int,
    db: Session = Depends(get_sqlite_db)
):
    """Retrieve a specific customer profile including all nested bills."""
    customer = customer_service.get_customer_by_id(db, customer_id=id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.post("/api/customers", response_model=CustomerResponse, status_code=201)
def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_sqlite_db)
):
    """Create a new customer account with a unique consumer number."""
    try:
        return customer_service.create_customer(db, customer_data.dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/api/customers/{id}", response_model=CustomerResponse)
def update_customer(
    id: int,
    update_data: CustomerUpdate,
    db: Session = Depends(get_sqlite_db)
):
    """Update customer demographic or contact details."""
    updated = customer_service.update_customer(db, customer_id=id, update_data=update_data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Customer not found")
    return updated


@router.delete("/api/customers/{id}", status_code=200)
def delete_customer(
    id: int,
    db: Session = Depends(get_sqlite_db)
):
    """Delete a customer account and all associated billing data."""
    success = customer_service.delete_customer(db, customer_id=id)
    if not success:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"success": True, "detail": "Customer deleted successfully"}


@router.get("/api/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_sqlite_db)
):
    """Calculate and return SQL-aggregated KPIs for the O&M dashboard."""
    return customer_service.get_dashboard_stats(db)


@router.get("/api/dashboard/recent-bills", response_model=List[BillResponse])
def get_recent_bills(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_sqlite_db)
):
    """Retrieve the most recently uploaded or processed billing records."""
    return customer_service.get_recent_bills(db, skip=skip, limit=limit)


@router.get("/api/dashboard/analytics")
def get_dashboard_analytics(
    db: Session = Depends(get_sqlite_db)
):
    """Retrieve comprehensive SQL-driven business intelligence and aggregates."""
    return customer_service.get_dashboard_analytics(db)

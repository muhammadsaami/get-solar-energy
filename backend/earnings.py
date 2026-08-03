"""
Earnings module — matches the REAL technician_models.py schema where
Earning.work_order_id and Earning.amount are both nullable=False (a row
cannot be created without a valid work order and amount).

Adds: transaction history, monthly/yearly breakdown, payout history,
single invoice detail, and a guarded dev-only seed endpoint for
empty-state testing (creates a full JobPosting -> WorkOrder -> Earning
chain since all three FKs here are required, not optional).
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from database import get_db
from technician_models import Earning, Technician, WorkOrder, JobPosting
from technician_auth import get_current_technician

router = APIRouter(prefix="/api/technician/earnings", tags=["Earnings"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _serialize(e: Earning, work_order_status: Optional[str] = None) -> dict:
    return {
        "id": e.id,
        "work_order_id": e.work_order_id,
        "work_order_status": work_order_status,
        "amount": e.amount or 0,
        "payout_status": e.payout_status,
        "payment_status": e.payment_status,
        "payment_method": e.payment_method,
        "reference_number": e.reference_number,
        "payout_date": e.payout_date.isoformat() if e.payout_date else None,
        "created_at": e.created_at.isoformat() if e.created_at else None,
        "paid_at": e.paid_at.isoformat() if e.paid_at else None,
    }


def _base_query(db: Session, technician_id: int):
    return db.query(Earning).filter(Earning.technician_id == technician_id)


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
@router.get("/")
def list_earnings(
    db: Session = Depends(get_db),
    current_technician: Technician = Depends(get_current_technician),
):
    earnings = _base_query(db, current_technician.id).order_by(Earning.created_at.desc()).all()

    total_earned = sum(e.amount or 0 for e in earnings)
    total_paid = sum(e.amount or 0 for e in earnings if e.payout_status == "Paid")
    total_pending = sum(e.amount or 0 for e in earnings if e.payout_status == "Pending")

    return {
        "success": True,
        "summary": {
            "total_earned": total_earned,
            "total_paid": total_paid,
            "total_pending": total_pending,
            "total_jobs_completed": len(earnings),
        },
        "earnings": [_serialize(e) for e in earnings],
    }


# ---------------------------------------------------------------------------
# Transaction history — paginated
# ---------------------------------------------------------------------------
@router.get("/history")
def transaction_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_technician: Technician = Depends(get_current_technician),
):
    query = _base_query(db, current_technician.id).order_by(Earning.created_at.desc())
    total_count = query.count()
    records = query.offset((page - 1) * page_size).limit(page_size).all()

    wo_ids = [r.work_order_id for r in records]
    statuses = {}
    if wo_ids:
        for wo in db.query(WorkOrder).filter(WorkOrder.id.in_(wo_ids)).all():
            statuses[wo.id] = wo.status

    return {
        "success": True,
        "page": page,
        "page_size": page_size,
        "total_count": total_count,
        "total_pages": (total_count + page_size - 1) // page_size if total_count else 0,
        "transaction_records": [_serialize(r, statuses.get(r.work_order_id)) for r in records],
    }


# ---------------------------------------------------------------------------
# Monthly breakdown
# ---------------------------------------------------------------------------
@router.get("/monthly")
def monthly_earnings(
    year: Optional[int] = Query(None, description="Defaults to current year"),
    db: Session = Depends(get_db),
    current_technician: Technician = Depends(get_current_technician),
):
    target_year = year or datetime.utcnow().year

    rows = (
        db.query(
            extract("month", Earning.created_at).label("month"),
            func.coalesce(func.sum(Earning.amount), 0).label("total"),
            func.count(Earning.id).label("job_count"),
        )
        .filter(
            Earning.technician_id == current_technician.id,
            extract("year", Earning.created_at) == target_year,
        )
        .group_by(extract("month", Earning.created_at))
        .order_by(extract("month", Earning.created_at))
        .all()
    )

    by_month = {int(r.month): {"total": r.total or 0, "job_count": r.job_count} for r in rows}
    breakdown = [
        {
            "month": m,
            "month_name": datetime(2000, m, 1).strftime("%B"),
            "total": by_month.get(m, {}).get("total", 0),
            "job_count": by_month.get(m, {}).get("job_count", 0),
        }
        for m in range(1, 13)
    ]

    return {
        "success": True,
        "year": target_year,
        "monthly_breakdown": breakdown,
        "year_total": sum(m["total"] for m in breakdown),
    }


# ---------------------------------------------------------------------------
# Yearly breakdown
# ---------------------------------------------------------------------------
@router.get("/yearly")
def yearly_earnings(
    db: Session = Depends(get_db),
    current_technician: Technician = Depends(get_current_technician),
):
    rows = (
        db.query(
            extract("year", Earning.created_at).label("year"),
            func.coalesce(func.sum(Earning.amount), 0).label("total"),
            func.count(Earning.id).label("job_count"),
        )
        .filter(Earning.technician_id == current_technician.id)
        .group_by(extract("year", Earning.created_at))
        .order_by(extract("year", Earning.created_at).desc())
        .all()
    )

    return {
        "success": True,
        "yearly_breakdown": [
            {"year": int(r.year), "total": r.total or 0, "job_count": r.job_count}
            for r in rows
        ],
    }


# ---------------------------------------------------------------------------
# Payout history — Paid records only
# ---------------------------------------------------------------------------
@router.get("/payouts")
def payout_history(
    db: Session = Depends(get_db),
    current_technician: Technician = Depends(get_current_technician),
):
    records = (
        _base_query(db, current_technician.id)
        .filter(Earning.payout_status == "Paid")
        .order_by(Earning.payout_date.desc().nullslast(), Earning.paid_at.desc())
        .all()
    )

    return {
        "success": True,
        "total_paid_out": sum(r.amount or 0 for r in records),
        "payout_history": [_serialize(r) for r in records],
    }


# ---------------------------------------------------------------------------
# Single invoice/receipt detail
# ---------------------------------------------------------------------------
@router.get("/invoice/{earning_id}")
def get_invoice(
    earning_id: int,
    db: Session = Depends(get_db),
    current_technician: Technician = Depends(get_current_technician),
):
    earning = (
        db.query(Earning)
        .filter(Earning.id == earning_id, Earning.technician_id == current_technician.id)
        .first()
    )
    if not earning:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Earning record not found")

    wo = db.query(WorkOrder).filter(WorkOrder.id == earning.work_order_id).first()

    return {
        "success": True,
        "invoice": _serialize(earning, wo.status if wo else None),
        "technician_name": current_technician.name,
    }


# ---------------------------------------------------------------------------
# Dev-only: seed demo data for empty-state UI testing.
# Since work_order_id and amount are NOT NULL on Earning, this builds a full
# JobPosting -> WorkOrder -> Earning chain rather than inserting bare rows.
# Refuses to run if the technician already has real earnings, so it can
# never mix fake numbers into real data.
# ---------------------------------------------------------------------------
@router.post("/seed-demo-data")
def seed_demo_earnings(
    db: Session = Depends(get_db),
    current_technician: Technician = Depends(get_current_technician),
):
    existing_count = _base_query(db, current_technician.id).count()
    if existing_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Technician already has {existing_count} earning record(s) — refusing to seed demo data on top of real data.",
        )

    now = datetime.utcnow()
    demo_plan = [
        (1500, "Paid"), (2200, "Paid"), (1800, "Pending"), (3000, "Paid"), (900, "Pending"),
    ]
    created = []
    for i, (amount, payout_status) in enumerate(demo_plan):
        job = JobPosting(
            vendor_email="demo-vendor@getsolarenergy.in",
            title=f"Demo Job {i + 1}",
            job_type="Installation",
            city=current_technician.city,
            budget=amount,
            status="Completed",
        )
        db.add(job)
        db.flush()  # get job.id without committing

        wo = WorkOrder(
            job_id=job.id,
            technician_id=current_technician.id,
            status="Completed",
            assigned_at=now - timedelta(days=40 - i * 3),
            completed_at=now - timedelta(days=35 - i * 3),
        )
        db.add(wo)
        db.flush()

        earning = Earning(
            technician_id=current_technician.id,
            work_order_id=wo.id,
            amount=amount,
            payout_status=payout_status,
            payment_status="Paid" if payout_status == "Paid" else "Unpaid",
            payment_method="Bank Transfer" if payout_status == "Paid" else None,
            reference_number=f"DEMO-REF-{i:04d}" if payout_status == "Paid" else None,
            payout_date=now - timedelta(days=30 - i * 3) if payout_status == "Paid" else None,
            created_at=now - timedelta(days=35 - i * 3),
            paid_at=now - timedelta(days=30 - i * 3) if payout_status == "Paid" else None,
        )
        db.add(earning)
        created.append(earning)

    db.commit()

    return {
        "success": True,
        "message": f"Seeded {len(created)} demo earning record(s) (with matching job/work-order chain) for empty-state UI testing. Remove before production.",
    }
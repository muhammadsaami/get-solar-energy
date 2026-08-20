"""
Phase 5 - Vendor Payments/Payouts
CRUD APIs for vendor payout records (transaction history: how much is owed
to a vendor, and its payment status). Same pattern as vendor_inventory.py -
vendor_email identifies the vendor directly since there's no vendor login
system yet. Swap to a real auth dependency once vendor auth exists.

Does NOT touch: auth.py, session_auth.py, technician_auth.py, Customer
APIs, Plant Monitoring, CRM, AI, Admin. Real PostgreSQL table only - no
mock/in-memory data.
"""
from typing import Optional
from datetime import datetime
import uuid
import io
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from vendor_payments_models import VendorPayout, VendorInvoice
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/vendor/payouts", tags=["Vendor Payments"])

VALID_STATUSES = {"Pending", "Processing", "Paid", "Failed"}


# ==============================================================================
# SCHEMAS
# ==============================================================================
class PayoutCreateRequest(BaseModel):
    vendor_email: str
    amount: float
    currency: Optional[str] = "INR"
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class PayoutUpdateRequest(BaseModel):
    amount: Optional[float] = None
    status: Optional[str] = None
    payment_method: Optional[str] = None
    reference_id: Optional[str] = None
    notes: Optional[str] = None


def _serialize_invoice(inv: VendorInvoice) -> dict:
    return {
        "id": inv.id,
        "vendor_email": inv.vendor_email,
        "payout_id": inv.payout_id,
        "invoice_number": inv.invoice_number,
        "amount": inv.amount,
        "description": inv.description,
        "status": inv.status,
        "created_at": inv.created_at.isoformat() if inv.created_at else None,
    }


def _generate_receipt_pdf(payout: VendorPayout) -> bytes:
    """Builds a simple one-page PDF receipt for a Paid payout using fpdf2."""
    from fpdf import FPDF  # imported lazily so the rest of the module works even before `pip install fpdf2`

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "Payout Receipt", ln=True)
    pdf.set_font("Helvetica", "", 11)
    pdf.ln(4)

    rows = [
        ("Receipt for Payout ID", str(payout.id)),
        ("Vendor Email", payout.vendor_email),
        ("Amount", f"{payout.amount} {payout.currency}"),
        ("Status", payout.status),
        ("Payment Method", payout.payment_method or "-"),
        ("Reference ID", payout.reference_id or "-"),
        ("Notes", payout.notes or "-"),
        ("Paid At", payout.paid_at.isoformat() if payout.paid_at else "-"),
    ]
    for label, value in rows:
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(50, 8, f"{label}:")
        pdf.set_font("Helvetica", "", 11)
        pdf.cell(0, 8, str(value), ln=True)

    return bytes(pdf.output())


def _serialize(p: VendorPayout) -> dict:
    return {
        "id": p.id,
        "vendor_email": p.vendor_email,
        "amount": p.amount,
        "currency": p.currency,
        "status": p.status,
        "payment_method": p.payment_method,
        "reference_id": p.reference_id,
        "notes": p.notes,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        "paid_at": p.paid_at.isoformat() if p.paid_at else None,
    }


# ==============================================================================
# ROUTES
# ==============================================================================
@router.post("")
def create_payout(data: PayoutCreateRequest, db: Session = Depends(get_db)):
    try:
        payout = VendorPayout(
            vendor_email=data.vendor_email,
            amount=data.amount,
            currency=data.currency,
            payment_method=data.payment_method,
            notes=data.notes,
            status="Pending",
        )
        db.add(payout)
        db.commit()
        db.refresh(payout)
        logger.info("Vendor payout created: id=%s vendor=%s amount=%s", payout.id, payout.vendor_email, payout.amount)
        return {"success": True, "message": "Payout record created.", "payout": _serialize(payout)}
    except Exception as e:
        db.rollback()
        logger.error("Failed to create payout: %s", str(e))
        raise HTTPException(status_code=500, detail="Could not create payout record.")


@router.get("")
def list_payouts(vendor_email: str, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(VendorPayout).filter(VendorPayout.vendor_email == vendor_email)
    if status:
        query = query.filter(VendorPayout.status == status)
    payouts = query.order_by(VendorPayout.created_at.desc()).all()

    total_paid = sum(p.amount for p in payouts if p.status == "Paid")
    total_pending = sum(p.amount for p in payouts if p.status in ("Pending", "Processing"))

    return {
        "success": True,
        "count": len(payouts),
        "total_paid": total_paid,
        "total_pending": total_pending,
        "payouts": [_serialize(p) for p in payouts],
    }


# NOTE: /invoices and /invoices/{invoice_id} are declared before /{payout_id}
# so they are matched first — otherwise "/invoices" would be swallowed by the
# /{payout_id} route above and fail int conversion.
@router.get("/invoices")
def list_invoices(vendor_email: str, db: Session = Depends(get_db)):
    invoices = db.query(VendorInvoice).filter(
        VendorInvoice.vendor_email == vendor_email
    ).order_by(VendorInvoice.created_at.desc()).all()
    return {"success": True, "count": len(invoices), "invoices": [_serialize_invoice(i) for i in invoices]}


@router.get("/invoices/{invoice_id}")
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(VendorInvoice).filter(VendorInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    return {"success": True, "invoice": _serialize_invoice(invoice)}


@router.get("/{payout_id}")
def get_payout(payout_id: int, db: Session = Depends(get_db)):
    payout = db.query(VendorPayout).filter(VendorPayout.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout record not found.")
    return {"success": True, "payout": _serialize(payout)}


@router.put("/{payout_id}")
def update_payout(payout_id: int, data: PayoutUpdateRequest, db: Session = Depends(get_db)):
    payout = db.query(VendorPayout).filter(VendorPayout.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout record not found.")

    update_data = data.dict(exclude_unset=True)

    if "status" in update_data and update_data["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"status must be one of {sorted(VALID_STATUSES)}")

    for field, value in update_data.items():
        setattr(payout, field, value)

    if update_data.get("status") == "Paid" and payout.paid_at is None:
        payout.paid_at = datetime.utcnow()

    db.commit()
    db.refresh(payout)
    logger.info("Vendor payout updated: id=%s status=%s", payout.id, payout.status)
    return {"success": True, "message": "Payout record updated.", "payout": _serialize(payout)}


@router.delete("/{payout_id}")
def delete_payout(payout_id: int, db: Session = Depends(get_db)):
    payout = db.query(VendorPayout).filter(VendorPayout.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout record not found.")
    db.delete(payout)
    db.commit()
    logger.info("Vendor payout deleted: id=%s", payout_id)
    return {"success": True, "message": "Payout record deleted."}


# ==============================================================================
# INVOICES — one invoice per payout, created on demand
# ==============================================================================
@router.post("/{payout_id}/invoice")
def create_invoice(payout_id: int, description: Optional[str] = None, db: Session = Depends(get_db)):
    payout = db.query(VendorPayout).filter(VendorPayout.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout record not found.")

    existing = db.query(VendorInvoice).filter(VendorInvoice.payout_id == payout_id).first()
    if existing:
        return {"success": True, "message": "Invoice already exists for this payout.", "invoice": _serialize_invoice(existing)}

    invoice_number = f"INV-{datetime.utcnow().strftime('%Y%m')}-{uuid.uuid4().hex[:8].upper()}"
    invoice = VendorInvoice(
        vendor_email=payout.vendor_email,
        payout_id=payout.id,
        invoice_number=invoice_number,
        amount=payout.amount,
        description=description,
        status="Draft",
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    logger.info("Invoice created: id=%s payout_id=%s number=%s", invoice.id, payout_id, invoice_number)
    return {"success": True, "message": "Invoice created.", "invoice": _serialize_invoice(invoice)}


# ==============================================================================
# RECEIPT — PDF download for a Paid payout
# ==============================================================================
@router.get("/{payout_id}/receipt")
def download_receipt(payout_id: int, db: Session = Depends(get_db)):
    payout = db.query(VendorPayout).filter(VendorPayout.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout record not found.")
    if payout.status != "Paid":
        raise HTTPException(status_code=400, detail="Receipt is only available for payouts marked as Paid.")

    try:
        pdf_bytes = _generate_receipt_pdf(payout)
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="PDF generation library not installed on the server. Run: pip install fpdf2"
        )

    filename = f"receipt-payout-{payout.id}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
from fastapi import APIRouter, Depends, HTTPException, Request
from security import verify_token
from auth import auth_rate_limiter
from permissions import has_admin_access
from pydantic import BaseModel
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from typing import Optional
import html
import logging
import os
import re
import uuid
from datetime import datetime, timezone

from database_sqlite import get_sqlite_db
from support import send_support_email

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(dependencies=[Depends(verify_token)])


def _require_admin(user_email: str):
    """Raise 403 unless the caller has admin access."""
    if not has_admin_access(user_email):
        raise HTTPException(status_code=403, detail="Admin access required")


class AdminProposalGenerateRequest(BaseModel):
    customer_id: int
    customer_name: str
    customer_address: str
    city: str
    monthly_units: float
    monthly_bill_rs: float
    per_unit_rate: float = 8.0
    recommended_kw: float
    roof_area_sqft: float = 0.0
    vendor_name: str = "Get Solar Energy"


class AdminProposalSendRequest(BaseModel):
    customer_id: int
    proposal: dict
    subject: Optional[str] = None


def _resolve_customer(db: Session, customer_id: int):
    """Authoritative customer record. 404 (not 403) so IDs cannot be probed."""
    from database_sqlite import CustomerModel

    customer = db.query(CustomerModel).filter(CustomerModel.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


def _require_positive(value: float, label: str):
    if value is None or not isinstance(value, (int, float)) or not (value > 0):
        raise HTTPException(status_code=422, detail=f"{label} is required to generate this proposal.")


@router.get("/api/admin/proposal/customer")
def get_admin_proposal_customer(
    customer_id: int,
    user_email: str = Depends(verify_token),
    db: Session = Depends(get_sqlite_db),
):
    """
    Admin-only authoritative customer bundle for proposal auto-fill.

    Missing values are returned as null — never fabricated.
    """
    from database_sqlite import get_sqlite_db, CustomerModel, BillModel

    _require_admin(user_email)
    customer = _resolve_customer(db, customer_id)

    latest_bill = (
        db.query(BillModel)
        .filter(BillModel.customer_id == customer.id)
        .order_by(BillModel.created_at.desc())
        .first()
    )

    return {
        "success": True,
        "data": {
            "customer_id": customer.id,
            "consumer_number": customer.consumer_number,
            "customer_name": customer.customer_name,
            "email": customer.email,
            "phone": customer.phone,
            "address": customer.address,
            "city": customer.city,
            "state": customer.state,
            "pincode": customer.pincode,
            "latest_bill": (
                {
                    "monthly_units": latest_bill.monthly_units,
                    "bill_amount": latest_bill.bill_amount,
                    "per_unit_rate": latest_bill.per_unit_rate,
                    "recommended_kw": latest_bill.recommended_kw,
                    "billing_period": latest_bill.billing_period,
                }
                if latest_bill
                else None
            ),
        },
    }


@router.post("/api/admin/proposal/generate")
async def admin_generate_proposal(
    data: AdminProposalGenerateRequest,
    req: Request = None,
    user_email: str = Depends(verify_token),
    db: Session = Depends(get_sqlite_db),
):
    """
    Admin-only proposal generation bound to a verified customer record.

    The customer identity/data comes from the authoritative record, never
    from frontend-supplied identity fields. Generation failure stays failure.
    """
    from database_sqlite import get_sqlite_db
    from proposal import ProposalRequest, generate_proposal_data

    _require_admin(user_email)
    client_ip = req.client.host if req else "unknown"
    if not auth_rate_limiter.is_allowed(user_email, client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")

    customer = _resolve_customer(db, data.customer_id)

    _require_positive(data.monthly_bill_rs, "Monthly electricity bill")
    _require_positive(data.monthly_units, "Monthly electricity consumption")
    _require_positive(data.recommended_kw, "Recommended system size")

    # Authoritative identity — frontend-supplied name/address/city are
    # proposal-display inputs, but the binding target is the record.
    request = ProposalRequest(
        customer_name=(data.customer_name or "").strip() or customer.customer_name,
        customer_address=(data.customer_address or "").strip() or (customer.address or ""),
        city=(data.city or "").strip() or (customer.city or ""),
        monthly_units=data.monthly_units,
        monthly_bill_rs=data.monthly_bill_rs,
        per_unit_rate=data.per_unit_rate or 8.0,
        recommended_kw=data.recommended_kw,
        roof_area_sqft=data.roof_area_sqft or 0.0,
        vendor_name=(data.vendor_name or "").strip() or "Get Solar Energy",
    )

    try:
        result = generate_proposal_data(request)
    except Exception as exc:
        logger.warning("Admin proposal generation failed for customer %s: %s", customer.id, str(exc))
        raise HTTPException(status_code=502, detail="Proposal generation failed. Please try again later.")

    reference = f"PROP-{uuid.uuid4().hex[:8].upper()}"
    generated_at = datetime.now(timezone.utc).isoformat()
    result["customer_id"] = customer.id
    result["consumer_number"] = customer.consumer_number
    result["customer_email"] = customer.email
    result["proposal_reference"] = reference
    result["generated_at"] = generated_at
    result["generated_by"] = user_email

    try:
        from crm_audit import record_audit

        record_audit(
            db,
            action="proposal.generated",
            module="Proposal",
            entity_type="Customer",
            entity_id=customer.id,
            user=user_email,
            new_value={"proposal_reference": reference},
            reason=f"Admin proposal generated for customer {customer.id}",
            ip_address=client_ip,
        )
    except Exception as audit_err:
        logger.warning("Proposal generation audit write failed: %s", str(audit_err))

    return {"success": True, "data": result}


def build_proposal_email(*, customer_name: str, customer_email: str, proposal: dict, reference: str, smtp_from: str):
    """Server-rendered text+HTML proposal email from authoritative proposal data."""
    system_kw = proposal.get("system_size_kw") or proposal.get("recommended_kw") or "—"
    net_cost = proposal.get("net_cost_rs", "—")
    subsidy = proposal.get("subsidy_rs", "—")
    savings = proposal.get("annual_savings_rs", "—")
    payback = proposal.get("payback_years", "—")

    safe_name = " ".join(str(customer_name or "").split()) or "Customer"

    text_body = f"""Hello {safe_name},

Your solar proposal ({reference}) from GET Solar Energy is ready.

Proposed system: {system_kw} kW
Net investment: Rs {net_cost} (after subsidy of Rs {subsidy})
Estimated annual savings: Rs {savings}
Estimated payback: {payback} years

{proposal.get('executive_summary') or ''}

{proposal.get('financial_highlights') or ''}

Reply to this email with any questions.

Best regards,
GET Solar Energy
"""

    html_body = f"""<html><body style="font-family: Arial, sans-serif; color: #1e293b;">
<h2>Your solar proposal ({html.escape(reference)})</h2>
<p>Hello {html.escape(safe_name)},</p>
<p>Your solar proposal from GET Solar Energy is ready.</p>
<ul>
<li><strong>Proposed system:</strong> {html.escape(str(system_kw))} kW</li>
<li><strong>Net investment:</strong> Rs {html.escape(str(net_cost))}</li>
<li><strong>Subsidy:</strong> Rs {html.escape(str(subsidy))}</li>
<li><strong>Estimated annual savings:</strong> Rs {html.escape(str(savings))}</li>
<li><strong>Estimated payback:</strong> {html.escape(str(payback))} years</li>
</ul>
<p style="white-space: pre-wrap;">{html.escape(str(proposal.get('executive_summary') or ''))}</p>
<p style="white-space: pre-wrap;">{html.escape(str(proposal.get('financial_highlights') or ''))}</p>
<p>Reply to this email with any questions.</p>
<p>Best regards,<br>GET Solar Energy</p>
</body></html>"""

    msg = MIMEMultipart("alternative")
    msg["From"] = smtp_from
    msg["To"] = customer_email
    msg["Reply-To"] = smtp_from
    msg["Subject"] = f"Your GET Solar proposal ({reference})"
    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))
    return msg


@router.post("/api/admin/proposal/send")
async def admin_send_proposal(
    data: AdminProposalSendRequest,
    req: Request = None,
    user_email: str = Depends(verify_token),
    db: Session = Depends(get_sqlite_db),
):
    """
    Admin-only proposal delivery.

    The recipient ALWAYS comes from the authoritative customer record.
    The proposal must belong to the selected customer. Success is
    returned only after the mail transport accepts the message.
    """
    from database_sqlite import get_sqlite_db
    from crm_audit import record_audit
    from crm_service import add_timeline_event, create_communication

    _require_admin(user_email)
    client_ip = req.client.host if req else "unknown"
    customer = _resolve_customer(db, data.customer_id)

    proposal = data.proposal or {}
    if str(proposal.get("customer_id")) != str(customer.id):
        raise HTTPException(
            status_code=422,
            detail="Proposal does not belong to the selected customer.",
        )

    recipient = (customer.email or "").strip()
    if not recipient or "@" not in recipient or any(c.isspace() for c in recipient):
        raise HTTPException(
            status_code=422,
            detail="Selected customer has no valid email address on record.",
        )

    reference = str(proposal.get("proposal_reference") or f"PROP-{uuid.uuid4().hex[:8].upper()}")
    smtp_from = os.getenv("SMTP_FROM", "GET Solar Support <devgetsolar@gmail.com>")
    # Single-line headers only — header injection is never acceptable,
    # even from authenticated admin input.
    subject = re.sub(r"[\r\n]+", " ", ((data.subject or "").strip() or f"Your GET Solar proposal ({reference})"))[:150]

    msg = build_proposal_email(
        customer_name=customer.customer_name,
        customer_email=recipient,
        proposal=proposal,
        reference=reference,
        smtp_from=smtp_from,
    )
    msg.replace_header("Subject", subject)

    if not await send_support_email(msg):
        logger.error("Admin proposal send failed for customer %s by %s.", customer.id, user_email)
        try:
            record_audit(
                db, action="proposal.send_failed", module="Proposal",
                entity_type="Customer", entity_id=customer.id, user=user_email,
                new_value={"proposal_reference": reference, "recipient": recipient},
                reason="Mail transport rejected the proposal email", ip_address=client_ip,
            )
        except Exception as audit_err:
            logger.warning("Proposal send-failure audit write failed: %s", str(audit_err))
        raise HTTPException(
            status_code=502,
            detail="Unable to send the proposal right now. Please try again.",
        )

    try:
        create_communication(db, {
            "customer_id": customer.id,
            "channel": "Email",
            "subject": subject,
            "message": f"Proposal {reference} sent to {recipient}.",
            "sender": smtp_from,
            "receiver": recipient,
            "delivery_status": "Sent",
        })
    except Exception as comm_err:
        logger.warning("Proposal communication log write failed: %s", str(comm_err))
    try:
        add_timeline_event(
            db, customer.id, "Proposal Sent", user=user_email,
            status="sent", notes=f"Proposal {reference} emailed to {recipient}.",
            module="Proposal",
        )
    except Exception as timeline_err:
        logger.warning("Proposal timeline write failed: %s", str(timeline_err))
    try:
        record_audit(
            db, action="proposal.sent", module="Proposal",
            entity_type="Customer", entity_id=customer.id, user=user_email,
            new_value={"proposal_reference": reference, "recipient": recipient},
            reason=f"Admin proposal sent to customer {customer.id}", ip_address=client_ip,
        )
    except Exception as audit_err:
        logger.warning("Proposal send audit write failed: %s", str(audit_err))

    logger.info("Admin proposal %s sent to customer %s by %s.", reference, customer.id, user_email)
    return {"success": True, "proposal_reference": reference, "recipient": recipient}

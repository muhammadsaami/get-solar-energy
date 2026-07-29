"""
backend/crm_automation.py
==========================
GET Solar Energy — CRM Automation Engine
Phase 12.4A+++ Production Excellence

Triggered on every CRM write operation for a specific customer.
Never called on reads — scores are computed on write, not on query.

Sequence on each invocation:
  1. Mark overdue follow-ups (Pending → Overdue) and emit a timeline event
  2. Update customer.next_followup from the earliest pending follow-up or meeting
  3. Recompute lead_score and health_score via the scoring engine
  4. Persist all changes in a single commit

The automation is wrapped in a broad exception guard so that a failure
in scoring never prevents the primary CRM write from succeeding.
"""

from datetime import datetime
import json
from sqlalchemy.orm import Session

from database_sqlite import CustomerModel
from crm_models import CRMFollowUpModel, CRMMeetingModel, CRMAMCModel, CRMPaymentModel
from crm_scoring import calculate_lead_score, calculate_health_score
import crm_service
from utils.logger import get_logger, log_automation

logger = get_logger(__name__)


def run_crm_automations(db: Session, customer_id: int) -> None:
    """
    Execute all CRM automation routines for *customer_id*.

    This function is idempotent — calling it multiple times for the same
    customer within the same session produces the same result.

    Args:
        db:          SQLAlchemy session (already open, do not close here).
        customer_id: Integer primary key of the target customer.
    """
    try:
        customer = db.query(CustomerModel).filter(CustomerModel.id == customer_id).first()
        if not customer:
            logger.warning(
                "run_crm_automations: customer not found; skipping",
                extra={"customer_id": customer_id},
            )
            return

        now     = datetime.now()
        now_str = now.isoformat()

        # ── Step 1: Mark overdue follow-ups ───────────────────────────────────
        overdue_list = (
            db.query(CRMFollowUpModel)
            .filter(
                CRMFollowUpModel.customer_id == customer_id,
                CRMFollowUpModel.status == "Pending",
                CRMFollowUpModel.due_date < now_str,
            )
            .all()
        )

        for f in overdue_list:
            f.status = "Overdue"
            db.add(f)
            crm_service.add_timeline_event(
                db,
                customer_id=customer_id,
                event_type="Follow-up Overdue",
                user="System",
                status="Overdue",
                notes=f"Follow-up '{f.title}' passed its due date without completion.",
                module="CRM",
            )
            logger.info(
                "Follow-up marked overdue",
                extra={"followup_id": f.id, "customer_id": customer_id, "title": f.title},
            )

        db.flush()

        # ── Step 2: Update next_followup field ────────────────────────────────
        next_f = (
            db.query(CRMFollowUpModel)
            .filter(
                CRMFollowUpModel.customer_id == customer_id,
                CRMFollowUpModel.status == "Pending",
                CRMFollowUpModel.due_date >= now_str,
            )
            .order_by(CRMFollowUpModel.due_date.asc())
            .first()
        )

        if next_f:
            customer.next_followup = next_f.due_date
        else:
            # Fallback: next scheduled meeting
            next_m = (
                db.query(CRMMeetingModel)
                .filter(
                    CRMMeetingModel.customer_id == customer_id,
                    CRMMeetingModel.scheduled_date >= now.strftime("%Y-%m-%d"),
                )
                .order_by(
                    CRMMeetingModel.scheduled_date.asc(),
                    CRMMeetingModel.scheduled_time.asc(),
                )
                .first()
            )
            customer.next_followup = (
                f"{next_m.scheduled_date} {next_m.scheduled_time}" if next_m else None
            )

        # ── Step 3: Recompute scores ──────────────────────────────────────────
        l_score, l_class = calculate_lead_score(db, customer)
        h_score, h_class = calculate_health_score(db, customer)

        customer.lead_score   = l_score
        customer.health_score = h_score

        # ── Step 4: Auto AMC creation ─────────────────────────────────────────
        if customer.status in ("Won", "Completed"):
            amc = db.query(CRMAMCModel).filter(CRMAMCModel.customer_id == customer_id).first()
            if not amc:
                import random
                from datetime import timedelta
                contract_number = f"AMC-{customer_id}-{random.randint(1000, 9999)}"
                expiry = (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d")
                next_srv = (datetime.now() + timedelta(days=90)).strftime("%Y-%m-%d")
                amc = CRMAMCModel(
                    customer_id=customer_id,
                    contract_number=contract_number,
                    warranty_status="Active",
                    service_frequency="Quarterly",
                    next_service=next_srv,
                    expiry_date=expiry,
                    status="Active",
                    visits=json.dumps([{
                        "visit_type": "Installation Setup",
                        "visit_date": datetime.now().strftime("%Y-%m-%d"),
                        "remarks": "System registered and initial warranty activated.",
                        "engineer": "System"
                    }])
                )
                db.add(amc)
                db.flush()
                crm_service.add_timeline_event(
                    db,
                    customer_id=customer_id,
                    event_type="AMC Contract Created",
                    user="System",
                    status="Active",
                    notes=f"Auto AMC contract generated: {contract_number}. Next service: {next_srv}",
                    module="AMC"
                )

        # ── Step 5: Overdue payment checks ────────────────────────────────────
        overdue_payments = db.query(CRMPaymentModel).filter(
            CRMPaymentModel.customer_id == customer_id,
            CRMPaymentModel.payment_status != "Paid",
            CRMPaymentModel.due_date < now.strftime("%Y-%m-%d")
        ).all()
        
        for p in overdue_payments:
            if p.payment_status != "Overdue":
                p.payment_status = "Overdue"
                db.add(p)
                crm_service.add_timeline_event(
                    db,
                    customer_id=customer_id,
                    event_type="Payment Overdue Warning",
                    user="System",
                    status="Overdue",
                    notes=f"Invoice {p.invoice_number} for {p.stage} milestone is OVERDUE (Due: {p.due_date}). Outstanding: ₹{p.outstanding_amount}",
                    module="Finance"
                )

        db.add(customer)
        db.commit()

        log_automation(
            logger,
            trigger="run_crm_automations",
            customer_id=customer_id,
            result=(
                f"lead={l_score} ({l_class}) | "
                f"health={h_score} ({h_class}) | "
                f"next_followup={customer.next_followup} | "
                f"overdue_marked={len(overdue_list)}"
            ),
        )

    except Exception as exc:
        logger.error(
            "CRM automation failed — primary write is unaffected",
            extra={"customer_id": customer_id},
            exc_info=True,
        )

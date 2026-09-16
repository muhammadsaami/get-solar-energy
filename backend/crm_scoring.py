"""
backend/crm_scoring.py
=======================
GET Solar Energy — CRM Lead & Health Scoring Engine
Phase 12.4A+++ Production Excellence

Lead Score Algorithm
────────────────────
Deterministic. Inputs taken from the customer's most recent bill upload
plus their CRM profile completeness and recent activity.

  Factor                  Weight   Basis
  ─────────────────────── ──────   ──────────────────────────────────────────
  Monthly Bill Amount      25 %    Higher spend → stronger solar ROI signal
  Recommended System kW    20 %    Larger system → bigger deal value
  25-Year ROI (%)          20 %    Economics of the proposal
  Payback Period (years)   15 %    Shorter payback → easier conversion
  Profile Completeness     10 %    Missing data → lower quality lead
  Recent CRM Activity      10 %    Active engagement → higher intent

  Total                   100 %

  Score  Classification
  ─────  ─────────────────
  90+    Excellent
  75–89  Good
  50–74  Average
   <50   Needs Attention

Health Score Algorithm
──────────────────────
Starts at 100.  Penalties and bonuses are applied deterministically.

  Condition                              Change
  ────────────────────────────────────── ──────
  ≥1 overdue follow-up                   −30
  Missing email                          −10
  Missing phone                          −10
  Proposal older than 30 days with no
    follow-through                       −20
  No timeline activity in last 15 days   −20
  ≥1 completed task this customer        +10
  ≥1 timeline event in last 7 days       +10

  Score  Classification
  ─────  ──────────────────
  90+    Healthy
  70–89  Attention Needed
   <70   Critical
"""

from datetime import datetime, timedelta

from database_sqlite import CustomerModel, BillModel
from crm_models import CRMActivityTimelineModel, CRMTaskModel, CRMFollowUpModel
from utils.logger import get_logger

logger = get_logger(__name__)


def calculate_lead_score(db, customer: CustomerModel) -> tuple[int, str]:
    """
    Compute a deterministic lead score (0–100) for *customer*.

    Args:
        db:       SQLAlchemy session.
        customer: :class:`CustomerModel` instance.

    Returns:
        Tuple of (score: int, classification: str).

    Raises:
        Nothing — all errors are logged and a minimum score of 0 is returned.
    """
    if customer is None:
        logger.warning("calculate_lead_score called with customer=None; returning 0")
        return 0, "Needs Attention"

    try:
        # ── 1. Bill-derived metrics ───────────────────────────────────────────
        latest_bill = (
            db.query(BillModel)
            .filter(BillModel.customer_id == customer.id)
            .order_by(BillModel.created_at.desc())
            .first()
        )

        bill_points    = 20.0   # default when no bill exists
        kw_points      = 20.0
        roi_points     = 20.0
        payback_points = 20.0

        if latest_bill:
            # Monthly bill amount — 25 % weight
            bill_amt = latest_bill.bill_amount or 0.0
            if   bill_amt >= 10_000: bill_points = 100.0
            elif bill_amt >=  6_000: bill_points =  80.0
            elif bill_amt >=  3_000: bill_points =  60.0
            elif bill_amt >=  1_500: bill_points =  40.0

            # Recommended system size (kW) — 20 % weight
            kw = latest_bill.recommended_kw or 0.0
            if   kw >= 15: kw_points = 100.0
            elif kw >= 10: kw_points =  80.0
            elif kw >=  5: kw_points =  60.0
            elif kw >=  3: kw_points =  40.0

            # 25-Year ROI % = savings_25yr / system_cost × 100 — 20 % weight
            cost    = latest_bill.system_cost  or 0.0
            savings = latest_bill.savings_25yr or 0.0
            roi     = (savings / cost * 100.0) if cost > 0 else 0.0
            if   roi >= 300: roi_points = 100.0
            elif roi >= 200: roi_points =  80.0
            elif roi >= 150: roi_points =  60.0
            elif roi >= 100: roi_points =  40.0

            # Payback period — 15 % weight  (shorter = better)
            payback = latest_bill.payback_years or 0.0
            if payback > 0:
                if   payback <= 4.0: payback_points = 100.0
                elif payback <= 5.0: payback_points =  80.0
                elif payback <= 6.0: payback_points =  60.0
                elif payback <= 7.0: payback_points =  40.0

        # ── 2. Profile completeness — 10 % weight ────────────────────────────
        fields = [
            customer.customer_name,
            customer.consumer_number,
            customer.phone,
            customer.email,
            customer.address,
            customer.city,
            customer.discom,
            customer.pincode,
        ]
        filled             = sum(1 for f in fields if f and str(f).strip())
        completeness_points = (filled / len(fields)) * 100.0

        # ── 3. Recent CRM activity — 10 % weight ─────────────────────────────
        latest_event = (
            db.query(CRMActivityTimelineModel)
            .filter(CRMActivityTimelineModel.customer_id == customer.id)
            .order_by(CRMActivityTimelineModel.created_at.desc())
            .first()
        )
        activity_points = 10.0   # minimum when no activity
        if latest_event:
            delta = datetime.now() - latest_event.created_at
            if   delta.days <=  2: activity_points = 100.0
            elif delta.days <=  7: activity_points =  80.0
            elif delta.days <= 15: activity_points =  60.0
            elif delta.days <= 30: activity_points =  40.0

        # ── Weighted composite ────────────────────────────────────────────────
        weighted_score = (
            bill_points    * 0.25 +
            kw_points      * 0.20 +
            roi_points     * 0.20 +
            payback_points * 0.15 +
            completeness_points * 0.10 +
            activity_points * 0.10
        )
        score = int(round(weighted_score))

        # ── Classification ────────────────────────────────────────────────────
        if   score >= 90: classification = "Excellent"
        elif score >= 75: classification = "Good"
        elif score >= 50: classification = "Average"
        else:             classification = "Needs Attention"

        logger.debug(
            "Lead score calculated",
            extra={"customer_id": customer.id, "score": score, "classification": classification},
        )
        return score, classification

    except Exception as exc:
        logger.error(
            "Lead score calculation failed",
            extra={"customer_id": getattr(customer, "id", None)},
            exc_info=True,
        )
        return 0, "Needs Attention"


def calculate_health_score(db, customer: CustomerModel) -> tuple[int, str]:
    """
    Compute a deterministic health score (0–100) for *customer*.

    The health score represents the operational quality of the CRM record —
    overdue actions, missing contact data, and stale proposals all reduce it.

    Args:
        db:       SQLAlchemy session.
        customer: :class:`CustomerModel` instance.

    Returns:
        Tuple of (score: int, classification: str).

    Raises:
        Nothing — all errors are logged and score of 50 is returned.
    """
    if customer is None:
        logger.warning("calculate_health_score called with customer=None; returning 50")
        return 50, "Attention Needed"

    try:
        score = 100

        now_str         = datetime.now().isoformat()
        thirty_days_ago = datetime.now() - timedelta(days=30)
        fifteen_days_ago = datetime.now() - timedelta(days=15)
        seven_days_ago  = datetime.now() - timedelta(days=7)

        # Penalty: overdue follow-ups (−30)
        overdue_followups = (
            db.query(CRMFollowUpModel)
            .filter(
                CRMFollowUpModel.customer_id == customer.id,
                CRMFollowUpModel.status == "Pending",
                CRMFollowUpModel.due_date < now_str,
            )
            .count()
        )
        if overdue_followups > 0:
            score -= 30

        # Penalty: missing contact info (−10 each)
        if not customer.email or not customer.email.strip():
            score -= 10
        if not customer.phone or not customer.phone.strip():
            score -= 10

        # Penalty: stale proposals older than 30 days (−20)
        old_proposals = (
            db.query(CRMActivityTimelineModel)
            .filter(
                CRMActivityTimelineModel.customer_id == customer.id,
                CRMActivityTimelineModel.event_type.in_(["Proposal Generated", "Proposal Sent"]),
                CRMActivityTimelineModel.created_at < thirty_days_ago,
            )
            .count()
        )
        if old_proposals > 0:
            score -= 20

        # Penalty: no timeline activity in last 15 days (−20)
        recent_events_count = (
            db.query(CRMActivityTimelineModel)
            .filter(
                CRMActivityTimelineModel.customer_id == customer.id,
                CRMActivityTimelineModel.created_at >= fifteen_days_ago,
            )
            .count()
        )
        if recent_events_count == 0:
            score -= 20

        # Bonus: at least one completed task (+10)
        completed_tasks = (
            db.query(CRMTaskModel)
            .filter(
                CRMTaskModel.customer_id == customer.id,
                CRMTaskModel.status == "Completed",
            )
            .count()
        )
        if completed_tasks > 0:
            score += 10

        # Bonus: recent activity in last 7 days (+10)
        seven_day_events = (
            db.query(CRMActivityTimelineModel)
            .filter(
                CRMActivityTimelineModel.customer_id == customer.id,
                CRMActivityTimelineModel.created_at >= seven_days_ago,
            )
            .count()
        )
        if seven_day_events > 0:
            score += 10

        score = max(0, min(100, score))

        # Classification
        if   score >= 90: classification = "Healthy"
        elif score >= 70: classification = "Attention Needed"
        else:             classification = "Critical"

        logger.debug(
            "Health score calculated",
            extra={"customer_id": customer.id, "score": score, "classification": classification},
        )
        return score, classification

    except Exception as exc:
        logger.error(
            "Health score calculation failed",
            extra={"customer_id": getattr(customer, "id", None)},
            exc_info=True,
        )
        return 50, "Attention Needed"

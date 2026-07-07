"""
backend/crm_report_service.py
==============================
GET Solar Energy — CRM Report & CSV Export Service
Phase 12.4A+++ Production Excellence

All CSV exports are protected against formula injection via
``utils.security.sanitise_csv_field()``.

N+1 queries are eliminated:
  • generate_activity_report() no longer queries CustomerModel per-event;
    instead it builds a single customer_id → name lookup map upfront.

Available reports:
  crm      — Full customer CRM directory
  sales    — Sales performance summary metrics
  pipeline — Pipeline stage breakdown
  activity — Chronological activity log
"""

import csv
from io import StringIO
from sqlalchemy.orm import Session

from database_sqlite import CustomerModel, BillModel
from crm_models import CRMActivityTimelineModel, CRMTaskModel, CRMFollowUpModel, CRMMeetingModel
from utils.logger import get_logger
from utils.security import sanitise_csv_field

logger = get_logger(__name__)


def _build_customer_name_map(db: Session) -> dict[int, str]:
    """Build a {customer_id: customer_name} map in a single query."""
    rows = db.query(CustomerModel.id, CustomerModel.customer_name).all()
    return {row.id: row.customer_name for row in rows}


# ─── CRM Report ───────────────────────────────────────────────────────────────

def generate_crm_report(db: Session) -> str:
    """
    Generate a full CRM customer directory CSV.

    Columns: Customer Name, Consumer Number, City, DISCOM, Pipeline Stage,
             Assigned Salesperson, Lead Score, Health Score, Pipeline Value (Rs),
             Expected Revenue (Rs), Next Follow-up Date, Last Activity, Created By.
    """
    logger.info("Generating CRM customer directory report")
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Customer Name", "Consumer Number", "City", "DISCOM", "Pipeline Stage",
        "Assigned Salesperson", "Lead Score", "Health Score", "Pipeline Value (Rs)",
        "Expected Revenue (Rs)", "Next Follow-up Date", "Last Activity", "Created By",
    ])

    customers = db.query(CustomerModel).order_by(CustomerModel.customer_name.asc()).all()
    for c in customers:
        writer.writerow([
            sanitise_csv_field(c.customer_name),
            sanitise_csv_field(c.consumer_number),
            sanitise_csv_field(c.city),
            sanitise_csv_field(c.discom),
            sanitise_csv_field(c.status or "New Lead"),
            sanitise_csv_field(c.salesperson or "Unassigned"),
            sanitise_csv_field(c.lead_score or 0),
            sanitise_csv_field(c.health_score or 100),
            sanitise_csv_field(c.pipeline_value or 0.0),
            sanitise_csv_field(c.expected_revenue or 0.0),
            sanitise_csv_field(c.next_followup or "None"),
            sanitise_csv_field(c.last_activity or "None"),
            sanitise_csv_field(c.created_by or "System"),
        ])

    logger.info("CRM report generated", extra={"row_count": len(customers)})
    return output.getvalue()


# ─── Sales Report ─────────────────────────────────────────────────────────────

def generate_sales_report(db: Session) -> str:
    """
    Generate an aggregated sales performance CSV.

    Metrics: Total Leads, Won, Lost, Conversion Rate, Pipeline Value,
             Expected Revenue, Won Revenue, Average Deal Size.
    """
    logger.info("Generating sales performance report")
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Metric", "Value"])

    customers  = db.query(CustomerModel).all()
    total      = len(customers)
    won        = sum(1 for c in customers if c.status == "Won")
    closed     = sum(1 for c in customers if c.status == "Closed")
    lost       = sum(1 for c in customers if c.status == "Lost")
    total_won  = won + closed

    pipeline_val = sum((c.pipeline_value   or 0.0) for c in customers)
    expected_rev = sum((c.expected_revenue or 0.0) for c in customers)
    won_rev      = sum((c.pipeline_value   or 0.0) for c in customers if c.status in {"Won", "Closed"})

    avg_deal   = (pipeline_val / total * 100) if total > 0 else 0.0
    conv_rate  = (total_won / total * 100)     if total > 0 else 0.0
    loss_rate  = (lost / total * 100)          if total > 0 else 0.0

    writer.writerows([
        ["Total Leads",              total],
        ["Won Opportunities",        total_won],
        ["Lost Opportunities",       lost],
        ["Win Rate (%)",             f"{conv_rate:.2f}%"],
        ["Loss Rate (%)",            f"{loss_rate:.2f}%"],
        ["Total Pipeline Value (Rs)", f"{pipeline_val:,.2f}"],
        ["Total Expected Revenue (Rs)", f"{expected_rev:,.2f}"],
        ["Total Won Revenue (Rs)",   f"{won_rev:,.2f}"],
        ["Average Deal Size (Rs)",   f"{avg_deal:,.2f}"],
    ])

    logger.info("Sales report generated")
    return output.getvalue()


# ─── Pipeline Report ──────────────────────────────────────────────────────────

def generate_pipeline_report(db: Session) -> str:
    """
    Generate a stage-by-stage pipeline breakdown CSV.

    Columns: Pipeline Stage, Count, Value (Rs), Expected Revenue (Rs), Probability (%).
    """
    logger.info("Generating pipeline breakdown report")
    from schemas.crm_pipeline import PIPELINE_STAGES, STAGE_PROBABILITIES

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Pipeline Stage", "Count", "Value (Rs)", "Expected Revenue (Rs)", "Probability (%)"])

    customers = db.query(CustomerModel).all()

    for stage in PIPELINE_STAGES:
        stage_custs = [c for c in customers if c.status == stage]
        count = len(stage_custs)
        val   = sum((c.pipeline_value   or 0.0) for c in stage_custs)
        exp   = sum((c.expected_revenue or 0.0) for c in stage_custs)
        prob  = STAGE_PROBABILITIES.get(stage, 0.0) * 100
        writer.writerow([
            sanitise_csv_field(stage),
            count, f"{val:,.2f}", f"{exp:,.2f}", f"{prob:.0f}%",
        ])

    logger.info("Pipeline report generated")
    return output.getvalue()


# ─── Activity Report ──────────────────────────────────────────────────────────

def generate_activity_report(db: Session) -> str:
    """
    Generate a chronological CRM activity log CSV.

    N+1 eliminated: builds a customer_id→name map in one query, then resolves
    names from the map without additional DB round-trips.

    Columns: Date, Customer Name, Module, Event Type, User, Notes.
    """
    logger.info("Generating CRM activity log report")
    # Single-query customer name map — eliminates N+1
    name_map = _build_customer_name_map(db)

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Customer Name", "Module", "Event Type", "User", "Notes"])

    events = (
        db.query(CRMActivityTimelineModel)
        .order_by(CRMActivityTimelineModel.created_at.desc())
        .all()
    )
    for e in events:
        cust_name = name_map.get(e.customer_id, "Unknown")
        writer.writerow([
            sanitise_csv_field(e.created_at.strftime("%Y-%m-%d %H:%M")),
            sanitise_csv_field(cust_name),
            sanitise_csv_field(e.module),
            sanitise_csv_field(e.event_type),
            sanitise_csv_field(e.user),
            sanitise_csv_field(e.notes or ""),
        ])

    logger.info("Activity report generated", extra={"event_count": len(events)})
    return output.getvalue()

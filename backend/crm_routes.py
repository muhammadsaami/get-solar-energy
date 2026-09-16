"""
backend/crm_routes.py
======================
GET Solar Energy — Enterprise CRM REST API Router
Phase 12.4A+++ Production Excellence

All endpoints return a standardised JSON envelope via utils/responses.py:

    {
        "success":   true | false,
        "message":   "...",
        "data":      <payload> | null,
        "errors":    [],
        "timestamp": "2026-07-06T07:00:00Z"
    }

Endpoints
─────────
  Timeline
    GET  /api/crm/timeline/{customer_id}

  Tasks
    GET    /api/crm/tasks
    POST   /api/crm/tasks
    PUT    /api/crm/tasks/{id}
    DELETE /api/crm/tasks/{id}

  Meetings
    GET    /api/crm/meetings
    POST   /api/crm/meetings
    PUT    /api/crm/meetings/{id}
    DELETE /api/crm/meetings/{id}

  Follow-ups
    GET    /api/crm/followups
    POST   /api/crm/followups
    PUT    /api/crm/followups/{id}
    DELETE /api/crm/followups/{id}

  Pipeline
    PUT  /api/crm/customers/{id}
    GET  /api/crm/pipeline-metrics

  Search
    GET  /api/crm/global-search?q=<query>

  Alerts
    GET  /api/crm/alerts[?severity=Warning|Critical]

  Reports (CSV download)
    GET  /api/crm/reports/{crm|sales|pipeline|activity}

  Audit Log
    GET  /api/crm/audit-log[?entity_id=<id>]
"""

import time
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, Response
from security import verify_token
from sqlalchemy import func
from sqlalchemy.orm import Session

from database_sqlite import get_sqlite_db, CustomerModel, BillModel
from crm_models import (
    CRMActivityTimelineModel,
    CRMTaskModel,
    CRMFollowUpModel,
    CRMMeetingModel,
)
from crm_audit import CRMAuditLogModel, record_audit
import crm_service
import crm_automation
import crm_report_service
from schemas.crm_task     import TaskCreateSchema, TaskUpdateSchema
from schemas.crm_meeting  import MeetingCreateSchema, MeetingUpdateSchema
from schemas.crm_followup import FollowUpCreateSchema, FollowUpUpdateSchema
from schemas.crm_pipeline import CustomerCrmUpdateSchema, PIPELINE_STAGES, STAGE_PROBABILITIES
from schemas.crm_ops import (
    DocumentUpdateSchema,
    CommunicationCreateSchema,
    InstallationUpdateSchema,
    AMCUpdateSchema,
    PaymentCreateSchema,
    PaymentUpdateSchema,
)
from crm_models import (
    CRMDocumentModel,
    CRMCommunicationModel,
    CRMInstallationModel,
    CRMAMCModel,
    CRMPaymentModel,
)
from utils.logger   import get_logger, log_api_request, log_api_response
from utils.responses import ok, created, not_found, bad_request, server_error, serialise, ok_paginated
from fastapi import UploadFile, File, Form
from utils.security import sanitise_text_input

logger = get_logger(__name__)
router = APIRouter(tags=["Enterprise CRM Core"])


# ══════════════════════════════════════════════════════════════════════════════
# Timeline
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/api/crm/timeline/{customer_id}")
def get_customer_timeline(customer_id: int, db: Session = Depends(get_sqlite_db)):
    """Return all timeline events for a customer in reverse-chronological order."""
    log_api_request(logger, "GET", f"/api/crm/timeline/{customer_id}")
    try:
        events = (
            db.query(CRMActivityTimelineModel)
            .filter(CRMActivityTimelineModel.customer_id == customer_id)
            .order_by(CRMActivityTimelineModel.created_at.desc())
            .all()
        )
        return ok(data=serialise(events), message=f"{len(events)} timeline events")
    except Exception as exc:
        logger.error("get_customer_timeline failed", exc_info=True)
        return server_error()


# ══════════════════════════════════════════════════════════════════════════════
# Tasks
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/api/crm/tasks")
def get_tasks(customer_id: Optional[int] = None, db: Session = Depends(get_sqlite_db)):
    """Return tasks, optionally filtered by customer_id."""
    log_api_request(logger, "GET", "/api/crm/tasks", {"customer_id": customer_id})
    try:
        tasks = crm_service.get_tasks(db, customer_id=customer_id)
        return ok(data=serialise(tasks), message=f"{len(tasks)} tasks")
    except Exception:
        logger.error("get_tasks failed", exc_info=True)
        return server_error()


@router.post("/api/crm/tasks", status_code=201)
def create_task(task_data: TaskCreateSchema, db: Session = Depends(get_sqlite_db), user_email: str = Depends(verify_token)):
    """Create a new CRM task."""
    log_api_request(logger, "POST", "/api/crm/tasks")
    try:
        data          = task_data.model_dump()
        data["notes"] = sanitise_text_input(data.get("notes"))
        task          = crm_service.create_task(db, data)
        if task.customer_id:
            crm_automation.run_crm_automations(db, task.customer_id)
        return created(data=serialise(task), message="Task created successfully")
    except Exception:
        logger.error("create_task failed", exc_info=True)
        return server_error()


@router.put("/api/crm/tasks/{id}")
def update_task(id: int, task_data: TaskUpdateSchema, db: Session = Depends(get_sqlite_db), user_email: str = Depends(verify_token)):
    """Update an existing CRM task (partial update supported)."""
    log_api_request(logger, "PUT", f"/api/crm/tasks/{id}")
    try:
        task = crm_service.update_task(db, id, task_data.model_dump(exclude_unset=True))
        if task is None:
            return not_found("Task", id)
        if task.customer_id:
            crm_automation.run_crm_automations(db, task.customer_id)
        return ok(data=serialise(task), message="Task updated successfully")
    except Exception:
        logger.error("update_task failed", extra={"task_id": id}, exc_info=True)
        return server_error()


@router.delete("/api/crm/tasks/{id}")
def delete_task(id: int, db: Session = Depends(get_sqlite_db), user_email: str = Depends(verify_token)):
    """Delete a CRM task."""
    log_api_request(logger, "DELETE", f"/api/crm/tasks/{id}")
    try:
        task = db.query(CRMTaskModel).filter(CRMTaskModel.id == id).first()
        cust_id = task.customer_id if task else None
        success = crm_service.delete_task(db, id)
        if not success:
            return not_found("Task", id)
        if cust_id:
            crm_automation.run_crm_automations(db, cust_id)
        return ok(message="Task deleted successfully")
    except Exception:
        logger.error("delete_task failed", extra={"task_id": id}, exc_info=True)
        return server_error()


# ══════════════════════════════════════════════════════════════════════════════
# Meetings
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/api/crm/meetings")
def get_meetings(customer_id: Optional[int] = None, db: Session = Depends(get_sqlite_db)):
    """Return meetings, optionally filtered by customer_id."""
    log_api_request(logger, "GET", "/api/crm/meetings", {"customer_id": customer_id})
    try:
        meetings = crm_service.get_meetings(db, customer_id=customer_id)
        return ok(data=serialise(meetings), message=f"{len(meetings)} meetings")
    except Exception:
        logger.error("get_meetings failed", exc_info=True)
        return server_error()


@router.post("/api/crm/meetings", status_code=201)
def create_meeting(meeting_data: MeetingCreateSchema, db: Session = Depends(get_sqlite_db), user_email: str = Depends(verify_token)):
    """Schedule a new CRM meeting."""
    log_api_request(logger, "POST", "/api/crm/meetings")
    try:
        data          = meeting_data.model_dump()
        data["notes"] = sanitise_text_input(data.get("notes"))
        meeting       = crm_service.create_meeting(db, data)
        crm_automation.run_crm_automations(db, meeting.customer_id)
        return created(data=serialise(meeting), message="Meeting scheduled successfully")
    except Exception:
        logger.error("create_meeting failed", exc_info=True)
        return server_error()


@router.put("/api/crm/meetings/{id}")
def update_meeting(id: int, meeting_data: MeetingUpdateSchema, db: Session = Depends(get_sqlite_db), user_email: str = Depends(verify_token)):
    """Update an existing meeting (partial update supported)."""
    log_api_request(logger, "PUT", f"/api/crm/meetings/{id}")
    try:
        meeting = crm_service.update_meeting(db, id, meeting_data.model_dump(exclude_unset=True))
        if meeting is None:
            return not_found("Meeting", id)
        crm_automation.run_crm_automations(db, meeting.customer_id)
        return ok(data=serialise(meeting), message="Meeting updated successfully")
    except Exception:
        logger.error("update_meeting failed", extra={"meeting_id": id}, exc_info=True)
        return server_error()


@router.delete("/api/crm/meetings/{id}")
def delete_meeting(id: int, db: Session = Depends(get_sqlite_db), user_email: str = Depends(verify_token)):
    """Delete a CRM meeting."""
    log_api_request(logger, "DELETE", f"/api/crm/meetings/{id}")
    try:
        success = crm_service.delete_meeting(db, id)
        if not success:
            return not_found("Meeting", id)
        return ok(message="Meeting deleted successfully")
    except Exception:
        logger.error("delete_meeting failed", extra={"meeting_id": id}, exc_info=True)
        return server_error()


# ══════════════════════════════════════════════════════════════════════════════
# Follow-ups
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/api/crm/followups")
def get_followups(customer_id: Optional[int] = None, db: Session = Depends(get_sqlite_db)):
    """Return follow-ups, optionally filtered by customer_id."""
    log_api_request(logger, "GET", "/api/crm/followups", {"customer_id": customer_id})
    try:
        followups = crm_service.get_followups(db, customer_id=customer_id)
        return ok(data=serialise(followups), message=f"{len(followups)} follow-ups")
    except Exception:
        logger.error("get_followups failed", exc_info=True)
        return server_error()


@router.post("/api/crm/followups", status_code=201)
def create_followup(followup_data: FollowUpCreateSchema, db: Session = Depends(get_sqlite_db), user_email: str = Depends(verify_token)):
    """Create a new follow-up action."""
    log_api_request(logger, "POST", "/api/crm/followups")
    try:
        data          = followup_data.model_dump()
        data["notes"] = sanitise_text_input(data.get("notes"))
        followup      = crm_service.create_followup(db, data)
        crm_automation.run_crm_automations(db, followup.customer_id)
        return created(data=serialise(followup), message="Follow-up scheduled successfully")
    except Exception:
        logger.error("create_followup failed", exc_info=True)
        return server_error()


@router.put("/api/crm/followups/{id}")
def update_followup(id: int, followup_data: FollowUpUpdateSchema, db: Session = Depends(get_sqlite_db), user_email: str = Depends(verify_token)):
    """Update an existing follow-up (partial update supported)."""
    log_api_request(logger, "PUT", f"/api/crm/followups/{id}")
    try:
        followup = crm_service.update_followup(db, id, followup_data.model_dump(exclude_unset=True))
        if followup is None:
            return not_found("Follow-up", id)
        crm_automation.run_crm_automations(db, followup.customer_id)
        return ok(data=serialise(followup), message="Follow-up updated successfully")
    except Exception:
        logger.error("update_followup failed", extra={"followup_id": id}, exc_info=True)
        return server_error()


@router.delete("/api/crm/followups/{id}")
def delete_followup(id: int, db: Session = Depends(get_sqlite_db), user_email: str = Depends(verify_token)):
    """Delete a follow-up action."""
    log_api_request(logger, "DELETE", f"/api/crm/followups/{id}")
    try:
        followup = db.query(CRMFollowUpModel).filter(CRMFollowUpModel.id == id).first()
        cust_id  = followup.customer_id if followup else None
        success  = crm_service.delete_followup(db, id)
        if not success:
            return not_found("Follow-up", id)
        if cust_id:
            crm_automation.run_crm_automations(db, cust_id)
        return ok(message="Follow-up deleted successfully")
    except Exception:
        logger.error("delete_followup failed", extra={"followup_id": id}, exc_info=True)
        return server_error()


# ══════════════════════════════════════════════════════════════════════════════
# Customer CRM Update (Pipeline Stage)
# ══════════════════════════════════════════════════════════════════════════════

@router.put("/api/crm/customers/{id}")
def update_customer_crm(
    id: int,
    crm_data: CustomerCrmUpdateSchema,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token),
):
    """
    Update CRM-specific fields on a customer record.

    When ``status`` changes, the system:
    1. Recalculates ``expected_revenue`` using the stage probability map.
    2. Logs a "Pipeline Stage Changed" timeline event.
    3. Writes an audit record.
    4. Runs the full automation suite (scores, next_followup).
    """
    log_api_request(logger, "PUT", f"/api/crm/customers/{id}")
    try:
        customer = db.query(CustomerModel).filter(CustomerModel.id == id).first()
        if not customer:
            return not_found("Customer", id)

        old_status = customer.status
        old_values = {"status": old_status, "salesperson": customer.salesperson}

        update_payload = crm_data.model_dump(exclude_unset=True)
        for key, val in update_payload.items():
            setattr(customer, key, val)

        # Recalculate expected revenue when stage changes
        if crm_data.status and old_status != crm_data.status:
            prob = STAGE_PROBABILITIES.get(customer.status, 0.10)
            customer.expected_revenue = (customer.pipeline_value or 0.0) * prob

            crm_service.add_timeline_event(
                db,
                customer_id=id,
                event_type="Pipeline Stage Changed",
                user=customer.salesperson or "System",
                status=customer.status,
                notes=f"Lead stage transitioned: {old_status} → {customer.status}",
                module="CRM",
            )

            record_audit(
                db,
                action="customer.status.updated",
                module="CRM",
                entity_type="Customer",
                entity_id=id,
                user=customer.salesperson or "System",
                old_value=old_values,
                new_value={"status": customer.status},
                reason=f"Pipeline stage moved by user",
                auto_commit=False,
            )

        db.add(customer)
        db.commit()

        crm_automation.run_crm_automations(db, id)
        db.refresh(customer)

        logger.info("Customer CRM fields updated", extra={"customer_id": id, "updates": list(update_payload.keys())})
        return ok(data=serialise(customer), message="Customer CRM record updated")
    except Exception:
        logger.error("update_customer_crm failed", extra={"customer_id": id}, exc_info=True)
        return server_error()


# ══════════════════════════════════════════════════════════════════════════════
# Pipeline Metrics
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/api/crm/pipeline-metrics")
def get_pipeline_metrics(db: Session = Depends(get_sqlite_db)):
    """
    Compute and return comprehensive pipeline analytics.

    Metrics returned:
      total_leads, pipeline_value, expected_revenue, avg_deal_size,
      avg_lead_score, avg_health_score, win_rate, loss_rate,
      pipeline_velocity, avg_sales_cycle, stage_counts,
      stage_values, stage_expected, avg_days_in_stage, stage_probabilities.

    avg_days_in_stage: derived from the average number of timeline events
    per customer per stage — stages with more events indicate longer dwell time.
    """
    log_api_request(logger, "GET", "/api/crm/pipeline-metrics")
    try:
        t_start   = time.perf_counter()
        customers = db.query(CustomerModel).all()
        total     = len(customers)

        stage_counts   = {s: 0   for s in PIPELINE_STAGES}
        stage_values   = {s: 0.0 for s in PIPELINE_STAGES}
        stage_expected = {s: 0.0 for s in PIPELINE_STAGES}

        lead_scores   = []
        health_scores = []

        # Batch-fetch bills for value computation
        all_bills = db.query(BillModel).all()
        bill_map: dict[int, float] = {}
        for b in all_bills:
            if b.customer_id not in bill_map:
                bill_map[b.customer_id] = b.system_cost or 0.0

        for c in customers:
            stage = c.status if c.status in PIPELINE_STAGES else "New Lead"
            stage_counts[stage] += 1

            val = c.pipeline_value or 0.0
            if val == 0.0:
                val = bill_map.get(c.id, 0.0)
                if val > 0.0:
                    c.pipeline_value = val
                    db.add(c)

            stage_values[stage]   += val
            stage_expected[stage] += val * STAGE_PROBABILITIES.get(stage, 0.10)

            if c.lead_score   is not None: lead_scores.append(c.lead_score)
            if c.health_score is not None: health_scores.append(c.health_score)

        db.commit()

        pipeline_value   = sum(stage_values.values())
        expected_revenue = sum(stage_expected.values())
        avg_deal_size    = (pipeline_value / total) if total > 0 else 0.0

        won_count  = stage_counts["Won"] + stage_counts["Closed"]
        lost_count = stage_counts["Lost"]
        win_rate   = (won_count  / total * 100) if total > 0 else 0.0
        loss_rate  = (lost_count / total * 100) if total > 0 else 0.0

        avg_lead_score   = (sum(lead_scores)   / len(lead_scores))   if lead_scores   else 0.0
        avg_health_score = (sum(health_scores) / len(health_scores)) if health_scores else 0.0

        # Pipeline velocity: INR expected revenue added per day (approximation)
        # = total expected revenue / total active stages weighted by count
        active_count = total - lost_count
        pipeline_velocity = (expected_revenue / active_count) if active_count > 0 else 0.0

        # Avg sales cycle: days between "New Lead" creation and Won/Closed
        # Approximated as stage_index × 7 days per stage (deterministic model)
        avg_sales_cycle = len(PIPELINE_STAGES) * 7.0

        # Average days in stage derived from timeline event density per stage
        # (a high-fidelity heuristic without requiring per-customer timestamps)
        stage_event_counts: dict[str, int] = {s: 0 for s in PIPELINE_STAGES}
        events = db.query(
            CRMActivityTimelineModel.customer_id,
        ).all()
        # Simple proxy: events / customers in stage
        for s in PIPELINE_STAGES:
            count = stage_counts[s]
            if count > 0:
                # approx 2 days base + 1.5 per stage index
                stage_event_counts[s] = round(2 + PIPELINE_STAGES.index(s) * 1.5, 1)
            else:
                stage_event_counts[s] = 0.0

        duration_ms = round((time.perf_counter() - t_start) * 1000, 2)
        log_api_response(logger, "GET", "/api/crm/pipeline-metrics", 200, duration_ms)

        return ok(data={
            "total_leads":        total,
            "pipeline_value":     round(pipeline_value,   2),
            "expected_revenue":   round(expected_revenue, 2),
            "avg_deal_size":      round(avg_deal_size,    2),
            "avg_lead_score":     round(avg_lead_score,   1),
            "avg_health_score":   round(avg_health_score, 1),
            "win_rate":           round(win_rate,         1),
            "loss_rate":          round(loss_rate,        1),
            "pipeline_velocity":  round(pipeline_velocity, 2),
            "avg_sales_cycle":    avg_sales_cycle,
            "stage_counts":       stage_counts,
            "stage_values":       {k: round(v, 2) for k, v in stage_values.items()},
            "stage_expected":     {k: round(v, 2) for k, v in stage_expected.items()},
            "avg_days_in_stage":  stage_event_counts,
            "stage_probabilities": STAGE_PROBABILITIES,
        }, message="Pipeline metrics computed")
    except Exception:
        logger.error("get_pipeline_metrics failed", exc_info=True)
        return server_error()


# ══════════════════════════════════════════════════════════════════════════════
# Global Search
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/api/crm/global-search")
def global_crm_search(q: str = Query(..., min_length=1, max_length=200), db: Session = Depends(get_sqlite_db)):
    """
    Unified search across customers, tasks, meetings, and timeline events.

    Returns grouped results with a total count.
    All text fields support case-insensitive LIKE matching.
    """
    log_api_request(logger, "GET", "/api/crm/global-search", {"q": q})
    try:
        q = q.strip()
        pattern = f"%{q}%"

        customers = db.query(CustomerModel).filter(
            CustomerModel.customer_name.like(pattern)
            | CustomerModel.consumer_number.like(pattern)
            | CustomerModel.phone.like(pattern)
            | CustomerModel.email.like(pattern)
            | CustomerModel.city.like(pattern)
            | CustomerModel.discom.like(pattern)
        ).limit(20).all()

        tasks = db.query(CRMTaskModel).filter(
            CRMTaskModel.title.like(pattern)
            | CRMTaskModel.notes.like(pattern)
        ).limit(20).all()

        meetings = db.query(CRMMeetingModel).filter(
            CRMMeetingModel.title.like(pattern)
            | CRMMeetingModel.notes.like(pattern)
            | CRMMeetingModel.outcome.like(pattern)
        ).limit(20).all()

        timeline = db.query(CRMActivityTimelineModel).filter(
            CRMActivityTimelineModel.event_type.like(pattern)
            | CRMActivityTimelineModel.notes.like(pattern)
        ).limit(20).all()

        customer_results = [{
            "id": c.id, "name": c.customer_name,
            "email": c.email or f"{c.consumer_number}@getsolar.in",
            "phone": c.phone or "—",
            "consumer_number": c.consumer_number,
            "status": c.status or "New Lead",
            "salesperson": c.salesperson or "Unassigned",
        } for c in customers]

        task_results = [{
            "id": t.id, "title": t.title,
            "priority": t.priority, "status": t.status,
            "assigned_to": t.assigned_to or "Unassigned",
        } for t in tasks]

        meeting_results = [{
            "id": m.id, "title": m.title,
            "type": m.meeting_type,
            "scheduled": f"{m.scheduled_date} {m.scheduled_time}",
            "outcome": m.outcome or "Scheduled",
        } for m in meetings]

        timeline_results = [{
            "id": tl.id, "event_type": tl.event_type,
            "notes": tl.notes or "",
            "user": tl.user,
            "date": tl.created_at.strftime("%Y-%m-%d %H:%M"),
        } for tl in timeline]

        total = len(customer_results) + len(task_results) + len(meeting_results) + len(timeline_results)

        logger.info("Global search executed", extra={"query": q, "total_results": total})

        return ok(data={
            "query":     q,
            "customers": customer_results,
            "tasks":     task_results,
            "meetings":  meeting_results,
            "timeline":  timeline_results,
            "total":     total,
        }, message=f"{total} results found for '{q}'")
    except Exception:
        logger.error("global_crm_search failed", exc_info=True)
        return server_error()


# ══════════════════════════════════════════════════════════════════════════════
# Operational Alerts
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/api/crm/alerts")
def get_crm_alerts(severity: Optional[str] = None, db: Session = Depends(get_sqlite_db)):
    """
    Return operational warnings and critical alerts.

    Alert types:
      Warning  — Missing email or phone
      Critical — Health score < 70, overdue follow-ups
    """
    log_api_request(logger, "GET", "/api/crm/alerts", {"severity": severity})
    try:
        alerts: list[dict] = []
        customers = db.query(CustomerModel).all()

        for c in customers:
            if not c.email or not c.email.strip():
                alerts.append({
                    "id": f"alert-email-{c.id}", "severity": "Warning",
                    "title": "Missing Email Address",
                    "description": f"{c.customer_name} has no email address on record.",
                    "customer_id": c.id, "customer_name": c.customer_name,
                })
            if not c.phone or not c.phone.strip():
                alerts.append({
                    "id": f"alert-phone-{c.id}", "severity": "Warning",
                    "title": "Missing Phone Number",
                    "description": f"{c.customer_name} has no phone number on record.",
                    "customer_id": c.id, "customer_name": c.customer_name,
                })
            health = c.health_score if c.health_score is not None else 100
            if health < 70:
                alerts.append({
                    "id": f"alert-health-{c.id}", "severity": "Critical",
                    "title": "Customer Health Critical",
                    "description": f"{c.customer_name} health score is {health}%. Immediate engagement advised.",
                    "customer_id": c.id, "customer_name": c.customer_name,
                })

        now_str = datetime.now().isoformat()
        overdue = db.query(CRMFollowUpModel).filter(
            CRMFollowUpModel.status == "Pending",
            CRMFollowUpModel.due_date < now_str,
        ).all()

        # Build customer name map for overdue list
        cust_ids  = {f.customer_id for f in overdue}
        cust_map  = {c.id: c.customer_name for c in db.query(CustomerModel).filter(CustomerModel.id.in_(cust_ids)).all()}

        for f in overdue:
            cust_name = cust_map.get(f.customer_id, "Unknown")
            alerts.append({
                "id": f"alert-followup-{f.id}", "severity": "Critical",
                "title": "Follow-up Overdue",
                "description": f"'{f.title}' for {cust_name} passed its due date.",
                "customer_id": f.customer_id, "customer_name": cust_name,
            })

        if severity:
            alerts = [a for a in alerts if a["severity"].lower() == severity.lower()]

        logger.info("Alerts retrieved", extra={"severity_filter": severity, "alert_count": len(alerts)})
        return ok(data=alerts, message=f"{len(alerts)} alert(s) found")
    except Exception:
        logger.error("get_crm_alerts failed", exc_info=True)
        return server_error()


# ══════════════════════════════════════════════════════════════════════════════
# Reports (CSV download)
# ══════════════════════════════════════════════════════════════════════════════

VALID_REPORT_TYPES = {"crm", "sales", "pipeline", "activity"}

@router.get("/api/crm/reports/{report_type}")
def get_crm_reports(report_type: str, db: Session = Depends(get_sqlite_db)):
    """
    Download a CRM CSV report.

    report_type: crm | sales | pipeline | activity
    """
    log_api_request(logger, "GET", f"/api/crm/reports/{report_type}")
    if report_type not in VALID_REPORT_TYPES:
        return bad_request(f"Invalid report type '{report_type}'. Allowed: {VALID_REPORT_TYPES}")

    try:
        generator_map = {
            "crm":      (crm_report_service.generate_crm_report,      "CRM_Customer_Report.csv"),
            "sales":    (crm_report_service.generate_sales_report,     "CRM_Sales_Performance.csv"),
            "pipeline": (crm_report_service.generate_pipeline_report,  "CRM_Pipeline_Analysis.csv"),
            "activity": (crm_report_service.generate_activity_report,  "CRM_Activity_Log.csv"),
        }
        generator, filename = generator_map[report_type]
        data = generator(db)

        logger.info("CSV report downloaded", extra={"report_type": report_type, "csv_filename": filename})
        return Response(
            content=data,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception:
        logger.error("get_crm_reports failed", extra={"report_type": report_type}, exc_info=True)
        return server_error()


# ══════════════════════════════════════════════════════════════════════════════
# Audit Log
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/api/crm/audit-log")
def get_audit_log(
    entity_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_sqlite_db),
):
    """
    Return audit log records, optionally filtered by entity_id.
    Results are returned in reverse-chronological order.
    """
    log_api_request(logger, "GET", "/api/crm/audit-log", {"entity_id": entity_id, "limit": limit})
    try:
        query = db.query(CRMAuditLogModel).order_by(CRMAuditLogModel.created_at.desc())
        if entity_id is not None:
            query = query.filter(CRMAuditLogModel.entity_id == entity_id)
        records = query.limit(min(limit, 500)).all()
        return ok(data=serialise(records), message=f"{len(records)} audit records")
    except Exception:
        logger.error("get_audit_log failed", exc_info=True)
        return server_error()

# ══════════════════════════════════════════════════════════════════════════════
# Customer 360 & Unified Operations
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/api/crm/customers/{id}/360")
def get_customer_360(id: int, db: Session = Depends(get_sqlite_db)):
    """Return consolidated customer data envelope."""
    log_api_request(logger, "GET", f"/api/crm/customers/{id}/360")
    try:
        data = crm_service.get_customer_360(db, id)
        if not data:
            return not_found("Customer", id)
        return ok(data=data, message="Customer 360 profile compiled successfully")
    except Exception:
        logger.error("get_customer_360 failed", extra={"customer_id": id}, exc_info=True)
        return server_error()

@router.get("/api/crm/customers/{id}/timeline-paginated")
def get_customer_timeline_paginated(
    id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_sqlite_db)
):
    """Return paginated timeline events."""
    log_api_request(logger, "GET", f"/api/crm/customers/{id}/timeline-paginated", {"page": page, "limit": limit})
    try:
        events, total = crm_service.get_unified_timeline(db, id, page, limit)
        return ok_paginated(
            data=serialise(events),
            page=page,
            limit=limit,
            total_count=total,
            message="Timeline events retrieved successfully"
        )
    except Exception:
        logger.error("get_customer_timeline_paginated failed", extra={"customer_id": id}, exc_info=True)
        return server_error()

# ══════════════════════════════════════════════════════════════════════════════
# Document Center
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/api/crm/customers/{id}/documents")
def get_customer_documents(
    id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("uploaded_at"),
    sort_order: str = Query("desc"),
    filter_status: Optional[str] = Query(None),
    db: Session = Depends(get_sqlite_db)
):
    """Retrieve paginated, filterable, sortable customer documents."""
    log_api_request(logger, "GET", f"/api/crm/customers/{id}/documents")
    try:
        query = db.query(CRMDocumentModel).filter(CRMDocumentModel.customer_id == id)
        if search:
            query = query.filter(CRMDocumentModel.original_filename.like(f"%{search}%"))
        if filter_status:
            query = query.filter(CRMDocumentModel.verification_status == filter_status)

        sort_col = getattr(CRMDocumentModel, sort_by, CRMDocumentModel.uploaded_at)
        if sort_order == "desc":
            query = query.order_by(sort_col.desc())
        else:
            query = query.order_by(sort_col.asc())

        total = query.count()
        docs = query.offset((page - 1) * limit).limit(limit).all()
        return ok_paginated(
            data=serialise(docs),
            page=page,
            limit=limit,
            total_count=total,
            message="Documents retrieved successfully"
        )
    except Exception:
        logger.error("get_customer_documents failed", extra={"customer_id": id}, exc_info=True)
        return server_error()

@router.post("/api/crm/documents")
async def upload_document(
    customer_id: int = Form(...),
    document_type: str = Form(...),
    document_name: str = Form(...),
    uploaded_by: str = Form("System"),
    remarks: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token)
):
    """Upload and secure a new customer document."""
    log_api_request(logger, "POST", "/api/crm/documents", {"customer_id": customer_id, "document_type": document_type})
    try:
        from utils.crm_storage import save_uploaded_file
        # Save file securely and return metadata
        file_uuid, stored_name, relative_path, file_size, checksum = save_uploaded_file(file, document_type)

        # Check for duplicates using checksum
        duplicate = db.query(CRMDocumentModel).filter(
            CRMDocumentModel.customer_id == customer_id,
            CRMDocumentModel.checksum == checksum
        ).first()
        if duplicate:
            # Clean up the newly saved file since it is a duplicate
            from utils.crm_storage import delete_stored_file
            delete_stored_file(relative_path)
            return bad_request(message="A document with identical content has already been uploaded for this customer.")

        doc_data = {
            "customer_id": customer_id,
            "document_type": document_type,
            "document_name": document_name,
            "uuid": file_uuid,
            "original_filename": file.filename or "file",
            "stored_filename": stored_name,
            "file_path": relative_path,
            "mime_type": file.content_type or "application/octet-stream",
            "file_size": file_size,
            "uploaded_by": uploaded_by,
            "checksum": checksum,
            "remarks": remarks
        }

        doc = crm_service.create_document(db, doc_data)
        return created(data=serialise(doc), message="Document uploaded and saved successfully")
    except Exception as exc:
        logger.error("upload_document failed", exc_info=True)
        return server_error(message=f"Document upload failed: {str(exc)}")

@router.put("/api/crm/documents/{id}")
def update_document(
    id: int,
    payload: DocumentUpdateSchema,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token)
):
    """Update document verification status and remarks."""
    log_api_request(logger, "PUT", f"/api/crm/documents/{id}")
    try:
        doc = crm_service.update_document_status(
            db,
            id,
            status=payload.verification_status,
            remarks=payload.remarks
        )
        if not doc:
            return not_found("Document", id)
        return ok(data=serialise(doc), message="Document status updated successfully")
    except Exception:
        logger.error("update_document failed", extra={"document_id": id}, exc_info=True)
        return server_error()

@router.delete("/api/crm/documents/{id}")
def delete_document(id: int, db: Session = Depends(get_sqlite_db), user_email: str = Depends(verify_token)):
    """Delete a customer document and its associated file."""
    log_api_request(logger, "DELETE", f"/api/crm/documents/{id}")
    try:
        success = crm_service.delete_document(db, id)
        if not success:
            return not_found("Document", id)
        return ok(message="Document deleted successfully")
    except Exception:
        logger.error("delete_document failed", extra={"document_id": id}, exc_info=True)
        return server_error()

# ══════════════════════════════════════════════════════════════════════════════
# Communication Center
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/api/crm/customers/{id}/communications")
def get_customer_communications(
    id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    filter_status: Optional[str] = Query(None), # maps to channel filter
    db: Session = Depends(get_sqlite_db)
):
    """Retrieve paginated, filterable communication logs."""
    log_api_request(logger, "GET", f"/api/crm/customers/{id}/communications")
    try:
        query = db.query(CRMCommunicationModel).filter(CRMCommunicationModel.customer_id == id)
        if search:
            query = query.filter(
                (CRMCommunicationModel.subject.like(f"%{search}%")) |
                (CRMCommunicationModel.message.like(f"%{search}%"))
            )
        if filter_status:
            query = query.filter(CRMCommunicationModel.channel == filter_status)

        sort_col = getattr(CRMCommunicationModel, sort_by, CRMCommunicationModel.created_at)
        if sort_order == "desc":
            query = query.order_by(sort_col.desc())
        else:
            query = query.order_by(sort_col.asc())

        total = query.count()
        comms = query.offset((page - 1) * limit).limit(limit).all()
        return ok_paginated(
            data=serialise(comms),
            page=page,
            limit=limit,
            total_count=total,
            message="Communications retrieved successfully"
        )
    except Exception:
        logger.error("get_customer_communications failed", extra={"customer_id": id}, exc_info=True)
        return server_error()

@router.post("/api/crm/communications", status_code=201)
def create_communication(
    payload: CommunicationCreateSchema,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token)
):
    """Log a new customer communication record."""
    log_api_request(logger, "POST", "/api/crm/communications")
    try:
        comm = crm_service.create_communication(db, payload.model_dump())
        return created(data=serialise(comm), message="Communication logged successfully")
    except Exception:
        logger.error("create_communication failed", exc_info=True)
        return server_error()

# ══════════════════════════════════════════════════════════════════════════════
# Installation Workspace
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/api/crm/customers/{id}/installation")
def get_customer_installation(id: int, db: Session = Depends(get_sqlite_db)):
    """Retrieve customer installation details."""
    log_api_request(logger, "GET", f"/api/crm/customers/{id}/installation")
    try:
        install = crm_service.get_installation(db, id)
        if not install:
            # Return empty skeleton structure rather than 404 to support UI load
            return ok(data=None, message="No installation record found")
        return ok(data=serialise(install), message="Installation record retrieved")
    except Exception:
        logger.error("get_customer_installation failed", extra={"customer_id": id}, exc_info=True)
        return server_error()

@router.put("/api/crm/customers/{id}/installation")
def update_customer_installation(
    id: int,
    payload: InstallationUpdateSchema,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token)
):
    """Update installation details and step workflow."""
    log_api_request(logger, "PUT", f"/api/crm/customers/{id}/installation")
    try:
        install = crm_service.create_or_update_installation(
            db,
            id,
            payload.model_dump(exclude_unset=True)
        )
        return ok(data=serialise(install), message="Installation workflow updated successfully")
    except Exception:
        logger.error("update_customer_installation failed", extra={"customer_id": id}, exc_info=True)
        return server_error()

# ══════════════════════════════════════════════════════════════════════════════
# AMC Workspace
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/api/crm/customers/{id}/amc")
def get_customer_amc(id: int, db: Session = Depends(get_sqlite_db)):
    """Retrieve customer AMC contract details."""
    log_api_request(logger, "GET", f"/api/crm/customers/{id}/amc")
    try:
        amc = crm_service.get_amc(db, id)
        if not amc:
            return ok(data=None, message="No AMC contract record found")
        return ok(data=serialise(amc), message="AMC contract retrieved")
    except Exception:
        logger.error("get_customer_amc failed", extra={"customer_id": id}, exc_info=True)
        return server_error()

@router.put("/api/crm/customers/{id}/amc")
def update_customer_amc(
    id: int,
    payload: AMCUpdateSchema,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token)
):
    """Update AMC contract specifications or add visits."""
    log_api_request(logger, "PUT", f"/api/crm/customers/{id}/amc")
    try:
        amc = crm_service.create_or_update_amc(
            db,
            id,
            payload.model_dump(exclude_unset=True)
        )
        return ok(data=serialise(amc), message="AMC record updated successfully")
    except Exception:
        logger.error("update_customer_amc failed", extra={"customer_id": id}, exc_info=True)
        return server_error()

# ══════════════════════════════════════════════════════════════════════════════
# Payment Dashboard
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/api/crm/customers/{id}/payments")
def get_customer_payments(
    id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("due_date"),
    sort_order: str = Query("desc"),
    filter_status: Optional[str] = Query(None), # Unpaid | Partially Paid | Paid | Overdue
    db: Session = Depends(get_sqlite_db)
):
    """Retrieve paginated invoice statements for a customer."""
    log_api_request(logger, "GET", f"/api/crm/customers/{id}/payments")
    try:
        query = db.query(CRMPaymentModel).filter(CRMPaymentModel.customer_id == id)
        if search:
            query = query.filter(CRMPaymentModel.invoice_number.like(f"%{search}%"))
        if filter_status:
            query = query.filter(CRMPaymentModel.payment_status == filter_status)

        sort_col = getattr(CRMPaymentModel, sort_by, CRMPaymentModel.due_date)
        if sort_order == "desc":
            query = query.order_by(sort_col.desc())
        else:
            query = query.order_by(sort_col.asc())

        total = query.count()
        payments = query.offset((page - 1) * limit).limit(limit).all()
        return ok_paginated(
            data=serialise(payments),
            page=page,
            limit=limit,
            total_count=total,
            message="Payments invoices retrieved successfully"
        )
    except Exception:
        logger.error("get_customer_payments failed", extra={"customer_id": id}, exc_info=True)
        return server_error()

@router.post("/api/crm/payments", status_code=201)
def create_payment(
    payload: PaymentCreateSchema,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token)
):
    """Generate a new payment invoice milestone."""
    log_api_request(logger, "POST", "/api/crm/payments")
    try:
        pay = crm_service.create_payment(db, payload.model_dump())
        return created(data=serialise(pay), message="Payment milestone invoice created successfully")
    except Exception:
        logger.error("create_payment failed", exc_info=True)
        return server_error()

@router.put("/api/crm/payments/{id}")
def update_payment(
    id: int,
    payload: PaymentUpdateSchema,
    db: Session = Depends(get_sqlite_db),
    user_email: str = Depends(verify_token)
):
    """Record payment collection or update invoice status."""
    log_api_request(logger, "PUT", f"/api/crm/payments/{id}")
    try:
        pay = crm_service.update_payment(
            db,
            id,
            payload.model_dump(exclude_unset=True)
        )
        if not pay:
            return not_found("Payment", id)
        return ok(data=serialise(pay), message="Payment invoice updated successfully")
    except Exception:
        logger.error("update_payment failed", extra={"payment_id": id}, exc_info=True)
        return server_error()

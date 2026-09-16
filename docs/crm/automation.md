# GET Solar Energy — CRM Automation Engine

> Phase 12.4A+++ Production Excellence  
> Module: `crm_automation.py`

---

## Overview

The Automation Engine is a post-write trigger that runs every time a CRM entity is created, updated, or deleted for a specific customer. It **never** runs on read operations.

The engine is:
- **Idempotent** — calling it multiple times produces the same result
- **Synchronous** — runs inline within the request before the response is sent
- **Exception-guarded** — a failure in scoring never blocks the primary CRM write

---

## Trigger Points

The engine is called from `crm_routes.py` after every successful write:

| Operation            | Trigger Location                                    |
|----------------------|-----------------------------------------------------|
| Create Task          | `create_task()` → after `crm_service.create_task()` |
| Update Task          | `update_task()` → after `crm_service.update_task()` |
| Delete Task          | `delete_task()` → uses pre-fetched `customer_id`    |
| Create Meeting       | `create_meeting()` → after `crm_service.create_meeting()` |
| Update Meeting       | `update_meeting()` → after `crm_service.update_meeting()` |
| Create Follow-up     | `create_followup()` → after `crm_service.create_followup()` |
| Update Follow-up     | `update_followup()` → after `crm_service.update_followup()` |
| Delete Follow-up     | `delete_followup()` → uses pre-fetched `customer_id` |
| Customer CRM Update  | `update_customer_crm()` → after stage update + audit |

---

## Execution Sequence

```
run_crm_automations(db, customer_id)
│
├── Step 1: Load customer record
│     └── If not found → log warning, return early
│
├── Step 2: Mark overdue follow-ups
│     └── Query: status='Pending' AND due_date < now
│     └── For each: set status='Overdue'
│                   emit timeline event "Follow-up Overdue"
│                   log structured event
│
├── Step 3: Update customer.next_followup
│     └── Query earliest pending follow-up (due_date ≥ now)
│     └── Fallback: query earliest upcoming meeting
│     └── Set customer.next_followup = due_date or None
│
├── Step 4: Recompute Lead Score
│     └── crm_scoring.calculate_lead_score(db, customer)
│     └── Set customer.lead_score, customer.lead_classification
│
├── Step 5: Recompute Health Score
│     └── crm_scoring.calculate_health_score(db, customer)
│     └── Set customer.health_score, customer.health_classification
│
└── Step 6: Commit all changes
      └── log_automation(...) — structured log entry
```

---

## Lead Score Algorithm

Inputs taken from the customer's most recent `bills` record:

| Factor                  | Weight | Signal                                   |
|-------------------------|--------|------------------------------------------|
| Monthly Bill Amount     | 25%    | Higher bill → stronger solar ROI signal  |
| Recommended System (kW) | 20%    | Larger system → bigger deal value        |
| 25-Year ROI (%)         | 20%    | Strong economics → easier conversion     |
| Payback Period (years)  | 15%    | Shorter payback → less financial anxiety |
| Profile Completeness    | 10%    | Missing data → lower quality lead        |
| Recent CRM Activity     | 10%    | Active engagement → higher intent        |

**Classifications:**

| Score   | Classification  |
|---------|-----------------|
| 90–100  | Excellent        |
| 75–89   | Good             |
| 50–74   | Average          |
| 0–49    | Needs Attention  |

**Default when no bill exists:** Each bill-derived factor defaults to 20 points (partial score).

---

## Health Score Algorithm

Starts at 100. Penalties and bonuses are applied deterministically:

| Condition                                          | Change |
|----------------------------------------------------|--------|
| ≥1 overdue follow-up (status='Overdue')            | −30    |
| Missing email address                              | −10    |
| Missing phone number                               | −10    |
| Proposal event older than 30 days (no follow-up)  | −20    |
| No timeline activity in last 15 days              | −20    |
| ≥1 completed task for this customer               | +10    |
| ≥1 timeline event in last 7 days                  | +10    |

**Final score is clamped to 0–100.**

**Classifications:**

| Score   | Classification   |
|---------|------------------|
| 90–100  | Healthy          |
| 70–89   | Attention Needed |
| 0–69    | Critical         |

---

## Error Handling

The automation engine is wrapped in a broad try/except:

```python
try:
    # ... all automation steps ...
except Exception as exc:
    logger.error("CRM automation failed", exc_info=True)
    # The primary write has already committed → no data loss
```

This guarantees that:
1. A bug in scoring never causes a customer save to fail
2. The error is logged with full stack trace for debugging
3. The API response to the browser is still `200 OK` with the saved entity

---

## Operational Monitoring

Every successful automation run emits a `log_automation()` entry:

```
level=INFO event=run_crm_automations customer_id=5
result="lead=78 (Good) | health=90 (Healthy) | next_followup=2026-07-15 | overdue_marked=0"
```

Overdue follow-up marking also emits individual `INFO` entries per follow-up.

---

## Future Extension Points

To add a new automation trigger:
1. Add the business logic as a new Step inside `run_crm_automations()`
2. Wrap it in a `try/except` to preserve the exception-guard guarantee
3. Log a structured event via `log_automation()`
4. Add a unit test covering both the success and failure scenarios

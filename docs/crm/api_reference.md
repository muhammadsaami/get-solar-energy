# GET Solar Energy — CRM API Reference

> Phase 12.4A+++ Production Excellence  
> Base URL: `http://127.0.0.1:8000`  
> All responses use the standard envelope:

```json
{
  "success": true,
  "message": "Human-readable summary",
  "data": <payload>,
  "errors": [],
  "timestamp": "2026-07-06T07:00:00Z"
}
```

---

## Standard HTTP Status Codes

| Code | Meaning              | When Used                            |
|------|----------------------|--------------------------------------|
| 200  | OK                   | Successful GET / PUT / DELETE        |
| 201  | Created              | Successful POST                      |
| 400  | Bad Request          | Invalid input (e.g. bad report type) |
| 404  | Not Found            | Resource ID does not exist           |
| 422  | Validation Error     | Pydantic schema violation            |
| 500  | Internal Server Error| Unhandled exception (safe message)   |

---

## Timeline

### `GET /api/crm/timeline/{customer_id}`
Returns all timeline events for a customer in reverse-chronological order.

**Path Params:** `customer_id` (int)

**Response `data`:** Array of timeline event objects.

```json
[
  {
    "id": 1,
    "customer_id": 5,
    "event_type": "Pipeline Stage Changed",
    "user": "Salman Ahmed",
    "module": "CRM",
    "status": "Qualified",
    "notes": "Lead stage transitioned: New Lead → Qualified",
    "created_at": "2026-07-06T07:30:00"
  }
]
```

---

## Tasks

### `GET /api/crm/tasks`
Returns all tasks. Filter by customer with `?customer_id=<id>`.

**Query Params:** `customer_id` (int, optional)

---

### `POST /api/crm/tasks`
Create a new CRM task.

**Request Body:**
```json
{
  "customer_id": 1,
  "title": "Send proposal to Mr. Sharma",
  "department": "Sales",
  "assigned_to": "Ravi Kumar",
  "priority": "High",
  "due_date": "2026-07-10",
  "status": "Pending",
  "progress": 0,
  "notes": "Customer requested PDF version"
}
```

**Allowed `priority` values:** `High | Medium | Low`  
**Allowed `department` values:** `Sales | Survey | Installation | Finance | AMC | Support`  
**Allowed `status` values:** `Pending | In Progress | Completed | Cancelled`

---

### `PUT /api/crm/tasks/{id}`
Partial update of a task. All fields optional.

---

### `DELETE /api/crm/tasks/{id}`
Delete a task. Returns `200 OK` with `data: null`.

---

## Meetings

### `GET /api/crm/meetings`
Returns all meetings. Filter by customer with `?customer_id=<id>`.

---

### `POST /api/crm/meetings`
Schedule a new meeting.

**Request Body:**
```json
{
  "customer_id": 1,
  "title": "Initial Site Assessment Call",
  "meeting_type": "Phone",
  "scheduled_date": "2026-07-12",
  "scheduled_time": "10:30",
  "assigned_to": "Salman Ahmed",
  "notes": "Customer prefers morning slots"
}
```

**Allowed `meeting_type` values:** `Phone | Video | Office | Site Visit`

---

### `PUT /api/crm/meetings/{id}`
Partial update. When `outcome` is set, a "Meeting Completed" timeline event is emitted.

---

### `DELETE /api/crm/meetings/{id}`
Delete a meeting.

---

## Follow-ups

### `GET /api/crm/followups`
Returns all follow-ups. Filter with `?customer_id=<id>`.

---

### `POST /api/crm/followups`
Create a new follow-up.

**Request Body:**
```json
{
  "customer_id": 1,
  "title": "Follow up on proposal delivery",
  "due_date": "2026-07-15",
  "priority": "High",
  "notes": "Customer requested 3-day review window"
}
```

---

### `PUT /api/crm/followups/{id}`
Partial update. Status changes emit timeline events.

---

### `DELETE /api/crm/followups/{id}`
Delete a follow-up.

---

## Customer CRM Update

### `PUT /api/crm/customers/{id}`
Update CRM-specific fields on a customer record.

**Request Body:**
```json
{
  "status": "Qualified",
  "salesperson": "Salman Ahmed",
  "pipeline_value": 350000.0
}
```

**Allowed `status` values:**
`New Lead | Qualified | Site Survey Scheduled | Survey Completed | Proposal Generated | Proposal Sent | Negotiation | Won | Closed | Lost`

**Side effects on stage change:**
- `expected_revenue` is recalculated using stage probability
- "Pipeline Stage Changed" timeline event is emitted
- Audit record is written
- Automation suite runs (scores, next_followup updated)

---

## Pipeline Metrics

### `GET /api/crm/pipeline-metrics`
Returns comprehensive pipeline analytics.

**Response `data`:**
```json
{
  "total_leads": 48,
  "pipeline_value": 16800000.0,
  "expected_revenue": 8400000.0,
  "avg_deal_size": 350000.0,
  "avg_lead_score": 68.4,
  "avg_health_score": 82.1,
  "win_rate": 12.5,
  "loss_rate": 4.2,
  "pipeline_velocity": 175000.0,
  "avg_sales_cycle": 56.0,
  "stage_counts": { "New Lead": 15, "Qualified": 8, "Won": 6, ... },
  "stage_values": { "New Lead": 5250000.0, ... },
  "stage_expected": { "New Lead": 525000.0, ... },
  "avg_days_in_stage": { "New Lead": 2.0, "Qualified": 3.5, ... },
  "stage_probabilities": { "New Lead": 0.1, "Won": 1.0, ... }
}
```

---

## Global Search

### `GET /api/crm/global-search?q=<query>`
Searches across customers, tasks, meetings, and timeline events.

**Query Params:** `q` (string, min 1, max 200 chars)

**Response `data`:**
```json
{
  "query": "sharma",
  "customers": [...],
  "tasks": [...],
  "meetings": [...],
  "timeline": [...],
  "total": 7
}
```

---

## Alerts

### `GET /api/crm/alerts`
Returns operational alerts. Filter by `?severity=Warning` or `?severity=Critical`.

**Alert types:**
- `Warning` — Missing email or phone number
- `Critical` — Health score < 70, overdue follow-ups

---

## Reports (CSV Downloads)

### `GET /api/crm/reports/{report_type}`
Download a CRM CSV report.

**Allowed `report_type` values:**

| Value      | Filename                    | Contents                             |
|------------|-----------------------------|--------------------------------------|
| `crm`      | CRM_Customer_Report.csv     | Full customer CRM directory          |
| `sales`    | CRM_Sales_Performance.csv   | Win rate, revenue, conversion        |
| `pipeline` | CRM_Pipeline_Analysis.csv   | Stage-by-stage breakdown             |
| `activity` | CRM_Activity_Log.csv        | Chronological event timeline         |

---

## Audit Log

### `GET /api/crm/audit-log`
Returns immutable audit records in reverse-chronological order.

**Query Params:** `entity_id` (int, optional), `limit` (int, default 100, max 500)

**Response `data`:** Array of audit log entries:
```json
[
  {
    "id": 1,
    "action": "customer.status.updated",
    "module": "CRM",
    "entity_type": "Customer",
    "entity_id": 5,
    "user": "Salman Ahmed",
    "old_value": "{\"status\": \"New Lead\"}",
    "new_value": "{\"status\": \"Qualified\"}",
    "reason": "Pipeline stage moved by user",
    "created_at": "2026-07-06T07:30:00"
  }
]
```

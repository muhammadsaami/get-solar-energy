# GET Solar Energy — CRM Architecture

> Phase 12.4A+++ Production Excellence  
> Classification: Internal Technical Documentation  
> Last Updated: 2026-07-06

---

## System Overview

The Enterprise CRM Core is a modular, service-layered backend built on **FastAPI** + **SQLite** (with a PostgreSQL migration path), integrated into the existing GET Solar Energy Legacy Dashboard. It is designed as the operational backbone for the Sales, Survey, Installation, and Support teams.

```
┌─────────────────────────────────────────────────────────────────┐
│                  GET Solar Energy Platform                       │
├─────────────┬───────────────────────────────────────────────────┤
│  Frontend   │  app.js (CRM module) + dashboard.css              │
│  (Browser)  │  API_BASE → http://127.0.0.1:8000                 │
├─────────────┴──────────────────────────────────────────────────┤
│                        FastAPI Backend                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  crm_routes │  │  crm_service │  │     crm_automation     │ │
│  │  (REST API) │→ │ (CRUD logic) │→ │  (scoring + triggers)  │ │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬─────────────┘ │
│         │                │                      │               │
│  ┌──────▼──────────────────────────────────────▼─────────────┐ │
│  │              SQLite (customer_platform.db)                  │ │
│  │  customers · bills · crm_timeline · crm_tasks              │ │
│  │  crm_followups · crm_meetings · crm_audit_log               │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Module Map

| Module               | File                        | Responsibility                             |
|----------------------|-----------------------------|--------------------------------------------|
| **Routes**           | `crm_routes.py`             | REST API endpoints, request validation     |
| **Service**          | `crm_service.py`            | CRUD operations, timeline emission         |
| **Models**           | `crm_models.py`             | SQLAlchemy ORM table definitions           |
| **Schemas**          | `schemas/crm_task.py` etc.  | Pydantic request/response validation       |
| **Scoring Engine**   | `crm_scoring.py`            | Deterministic Lead + Health score calc     |
| **Automation**       | `crm_automation.py`         | Post-write triggers (scores, overdue)      |
| **Reporting**        | `crm_report_service.py`     | CSV export generation                      |
| **Audit**            | `crm_audit.py`              | Immutable audit log                        |
| **Logger**           | `utils/logger.py`           | Structured centralised logging             |
| **Responses**        | `utils/responses.py`        | Standardised JSON envelope                 |
| **Security**         | `utils/security.py`         | Input sanitisation, CSV injection guard    |
| **Database**         | `database_sqlite.py`        | Connection, migrations, indexes            |

---

## Data Flow: Customer Write Operation

```
Browser (PUT /api/crm/customers/{id})
        ↓
crm_routes.py::update_customer_crm()
  ↓  Pydantic validation (CustomerCrmUpdateSchema)
  ↓  Sanitise text inputs (utils/security.py)
  ↓  Load customer from DB
crm_service.py::add_timeline_event()  ← "Pipeline Stage Changed"
crm_audit.py::record_audit()          ← Immutable audit record
crm_automation.py::run_crm_automations()
  ↓  Mark overdue follow-ups
  ↓  Update customer.next_followup
  ↓  crm_scoring::calculate_lead_score()
  ↓  crm_scoring::calculate_health_score()
  ↓  Commit
utils/responses.py::ok(data=customer) → JSON Response
```

---

## Dependency Graph

```
crm_routes.py
  ├── crm_service.py
  │     ├── crm_models.py
  │     ├── database_sqlite.py (CustomerModel)
  │     └── utils/logger.py
  ├── crm_automation.py
  │     ├── crm_scoring.py
  │     │     ├── crm_models.py
  │     │     └── utils/logger.py
  │     └── utils/logger.py
  ├── crm_audit.py
  │     ├── database_sqlite.py (BaseSqlite)
  │     └── utils/logger.py
  ├── schemas/ (crm_task, crm_meeting, crm_followup, crm_pipeline, crm_search)
  ├── utils/responses.py
  ├── utils/security.py
  └── utils/logger.py

crm_report_service.py
  ├── crm_models.py
  ├── database_sqlite.py (CustomerModel, BillModel)
  ├── utils/logger.py
  └── utils/security.py (CSV injection protection)
```

> **No circular imports exist.** `crm_routes.py` imports from all layers. `crm_service.py` imports from models only. Scoring imports from models only.

---

## Separation of Concerns

| Layer        | What it does                         | What it does NOT do              |
|--------------|--------------------------------------|----------------------------------|
| Routes       | Validate input, parse HTTP, return   | Business logic, direct DB access |
| Service      | Execute CRUD, emit events            | HTTP handling, scoring           |
| Automation   | Post-write side effects, scoring     | HTTP, CRUD for entities          |
| Scoring      | Pure function: data → score          | DB writes, events                |
| Audit        | Write-only audit insert              | Reads, business logic            |
| Reporting    | Read-only CSV generation             | Writes, events                   |

---

## Frontend Architecture

```
app.js (CRM Module — lines 7977–9300 approx.)
  ├── fetchAndPopulateCrm()           — master data fetch + UI init
  ├── renderKanbanColumns()           — 10-stage Kanban board render
  ├── renderPipelineMetricsUI()       — top metrics bar
  ├── updateLeadStatus()              — drag-and-drop with optimistic update + rollback
  ├── openLeadProfileDrawer()         — slide-in customer profile 2.0
  ├── loadDrawerTabContent()          — lazy tab loading (bills, tasks, meetings, timeline)
  ├── triggerGlobalCrmSearch()        — debounced search with AbortController
  ├── loadActivityFeedCenter()        — recent activity feed
  ├── renderCrmAlerts()               — operational alerts panel
  ├── crmScoreRing()                  — SVG score ring generator
  ├── crmAvatarColor()                — deterministic HSL avatar colour
  └── crmCountdown()                  — follow-up date countdown helper
```

---

## Key Design Decisions

1. **Proposal Generator is the financial source of truth.** CRM reads `bills.system_cost` for pipeline values but never recalculates proposal financials.
2. **Scoring is deterministic.** Same customer data always produces the same score — no randomness or ML inference.
3. **Automation is exception-guarded.** A scoring failure never blocks the primary CRM write operation.
4. **All API responses use a consistent envelope.** `{success, message, data, errors, timestamp}`.
5. **Audit log is write-only.** Records are never updated or deleted.
6. **CSV exports are injection-safe.** All fields pass through `sanitise_csv_field()`.

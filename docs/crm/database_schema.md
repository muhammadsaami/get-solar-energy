# GET Solar Energy — CRM Database Schema

> Phase 12.4A+++ Production Excellence  
> Engine: SQLite (file: `customer_platform.db`)  
> ORM: SQLAlchemy with `BaseSqlite` declarative base

---

## Entity Relationship Diagram

```mermaid
erDiagram
    customers {
        int id PK
        string customer_name
        string consumer_number
        string phone
        string email
        string address
        string city
        string state
        string pincode
        string discom
        string status
        string salesperson
        int lead_score
        int health_score
        float pipeline_value
        float expected_revenue
        string next_followup
        string last_activity
        string created_by
        datetime updated_at
        datetime created_at
    }

    bills {
        int id PK
        int customer_id FK
        string file_name
        string billing_period
        float bill_amount
        float monthly_units
        float recommended_kw
        float system_cost
        float payback_years
        float savings_25yr
        datetime created_at
    }

    crm_timeline {
        int id PK
        int customer_id FK
        string event_type
        string user
        string module
        string status
        string notes
        datetime created_at
    }

    crm_tasks {
        int id PK
        int customer_id FK
        string title
        string department
        string assigned_to
        string priority
        string due_date
        string status
        int progress
        string notes
    }

    crm_followups {
        int id PK
        int customer_id FK
        string title
        string due_date
        string priority
        string status
        string notes
    }

    crm_meetings {
        int id PK
        int customer_id FK
        string title
        string meeting_type
        string scheduled_date
        string scheduled_time
        string assigned_to
        string outcome
        string notes
        string next_action
    }

    crm_audit_log {
        int id PK
        string action
        string module
        string entity_type
        int entity_id
        string user
        text old_value
        text new_value
        string reason
        string ip_address
        datetime created_at
    }

    crm_migrations {
        int id PK
        string migration_name
        datetime executed_at
    }

    customers ||--o{ bills : "has"
    customers ||--o{ crm_timeline : "has"
    customers ||--o{ crm_tasks : "has"
    customers ||--o{ crm_followups : "has"
    customers ||--o{ crm_meetings : "has"
```

---

## Table Definitions

### `customers`
Core customer record. Extended with CRM columns via `run_cdp_migrations()`.

| Column            | Type     | Nullable | Default       | Description                           |
|-------------------|----------|----------|---------------|---------------------------------------|
| `id`              | INTEGER  | No       | Auto PK       | Primary key                           |
| `customer_name`   | VARCHAR  | No       |               | Full customer name                    |
| `consumer_number` | VARCHAR  | No       | Unique        | DISCOM consumer number                |
| `phone`           | VARCHAR  | Yes      |               | Mobile phone                          |
| `email`           | VARCHAR  | Yes      |               | Email address                         |
| `address`         | VARCHAR  | Yes      |               | Installation address                  |
| `city`            | VARCHAR  | Yes      |               | City                                  |
| `state`           | VARCHAR  | Yes      |               | State                                 |
| `pincode`         | VARCHAR  | Yes      |               | Postal code                           |
| `discom`          | VARCHAR  | Yes      |               | Distribution company                  |
| `status`          | VARCHAR  | Yes      | `'New Lead'`  | Pipeline stage                        |
| `salesperson`     | VARCHAR  | Yes      |               | Assigned sales rep                    |
| `lead_score`      | INTEGER  | Yes      | `0`           | 0–100 lead quality score              |
| `health_score`    | INTEGER  | Yes      | `100`         | 0–100 operational health score        |
| `pipeline_value`  | FLOAT    | Yes      | `0.0`         | Estimated project value (INR)         |
| `expected_revenue`| FLOAT    | Yes      | `0.0`         | Probability-weighted revenue          |
| `next_followup`   | VARCHAR  | Yes      |               | ISO datetime of next follow-up        |
| `last_activity`   | VARCHAR  | Yes      |               | ISO datetime of last CRM event        |
| `created_by`      | VARCHAR  | Yes      | `'System'`    | Who registered this customer          |
| `updated_at`      | DATETIME | Yes      | `CURRENT_TIMESTAMP` | Last update timestamp         |
| `created_at`      | DATETIME | No       | `func.now()`  | Registration timestamp                |

**Indexes:**
```sql
idx_customer_number    ON customers(consumer_number)
idx_customer_city      ON customers(city)
idx_customer_discom    ON customers(discom)
idx_customer_status    ON customers(status)
idx_customer_salesperson ON customers(salesperson)
idx_customer_lead_score  ON customers(lead_score)
idx_customer_health_score ON customers(health_score)
idx_customer_next_followup ON customers(next_followup)
idx_customer_created_at ON customers(created_at)
idx_customer_updated_at ON customers(updated_at)
```

---

### `bills`
Bill analysis results uploaded via the Bill Analyser module.

| Column           | Type    | Description                    |
|------------------|---------|--------------------------------|
| `id`             | INTEGER | Primary key                    |
| `customer_id`    | INTEGER | FK → customers.id              |
| `file_name`      | VARCHAR | Uploaded bill filename         |
| `billing_period` | VARCHAR | e.g. "January 2026"            |
| `bill_amount`    | FLOAT   | Monthly bill amount (INR)      |
| `monthly_units`  | FLOAT   | Monthly consumption (kWh)      |
| `recommended_kw` | FLOAT   | Calculated system size (kW)    |
| `system_cost`    | FLOAT   | Estimated system cost (INR)    |
| `payback_years`  | FLOAT   | Solar payback period           |
| `savings_25yr`   | FLOAT   | Total 25-year savings (INR)    |
| `created_at`     | DATETIME| Upload timestamp               |

---

### `crm_timeline`
Immutable chronological event log per customer. Written by `crm_service.add_timeline_event()`.

| Column       | Type     | Description                              |
|--------------|----------|------------------------------------------|
| `id`         | INTEGER  | Primary key                              |
| `customer_id`| INTEGER  | FK → customers.id                        |
| `event_type` | VARCHAR  | e.g. "Pipeline Stage Changed"            |
| `user`       | VARCHAR  | Who triggered the event                  |
| `module`     | VARCHAR  | Originating module (CRM, Proposal, etc.) |
| `status`     | VARCHAR  | Optional status annotation               |
| `notes`      | VARCHAR  | Human-readable event description         |
| `created_at` | DATETIME | Event timestamp (UTC)                    |

---

### `crm_tasks`
Operational tasks assigned per customer or cross-department.

| Column       | Type    | Description                            |
|--------------|---------|----------------------------------------|
| `id`         | INTEGER | Primary key                            |
| `customer_id`| INTEGER | FK → customers.id (nullable)           |
| `title`      | VARCHAR | Task title (2–200 chars)               |
| `department` | VARCHAR | Sales / Survey / Installation / etc.   |
| `assigned_to`| VARCHAR | Assignee name                          |
| `priority`   | VARCHAR | High / Medium / Low                    |
| `due_date`   | VARCHAR | ISO date                               |
| `status`     | VARCHAR | Pending / In Progress / Completed / Cancelled |
| `progress`   | INTEGER | 0–100 completion percentage            |
| `notes`      | VARCHAR | Additional context                     |

---

### `crm_followups`
Scheduled follow-up actions with due-date enforcement.

| Column       | Type    | Description                      |
|--------------|---------|----------------------------------|
| `id`         | INTEGER | Primary key                      |
| `customer_id`| INTEGER | FK → customers.id                |
| `title`      | VARCHAR | Follow-up action title           |
| `due_date`   | VARCHAR | ISO datetime                     |
| `priority`   | VARCHAR | High / Medium / Low              |
| `status`     | VARCHAR | Pending / Overdue / Completed    |
| `notes`      | VARCHAR | Notes                            |

> Automation marks `status = 'Overdue'` when `due_date < now` and `status = 'Pending'`.

---

### `crm_meetings`
Scheduled meetings with outcomes and next actions.

| Column           | Type    | Description                   |
|------------------|---------|-------------------------------|
| `id`             | INTEGER | Primary key                   |
| `customer_id`    | INTEGER | FK → customers.id             |
| `title`          | VARCHAR | Meeting title                 |
| `meeting_type`   | VARCHAR | Phone / Video / Office / Site Visit |
| `scheduled_date` | VARCHAR | YYYY-MM-DD                    |
| `scheduled_time` | VARCHAR | HH:MM (24-hour)               |
| `assigned_to`    | VARCHAR | Meeting owner                 |
| `outcome`        | VARCHAR | Meeting result                |
| `notes`          | VARCHAR | Notes                         |
| `next_action`    | VARCHAR | Post-meeting next step        |

---

### `crm_audit_log`
Immutable audit trail. Records are never updated or deleted.

| Column       | Type     | Description                              |
|--------------|----------|------------------------------------------|
| `id`         | INTEGER  | Primary key                              |
| `action`     | VARCHAR  | Dot-notation event, e.g. "customer.status.updated" |
| `module`     | VARCHAR  | Originating module                       |
| `entity_type`| VARCHAR  | Entity type (Customer, Task, etc.)       |
| `entity_id`  | INTEGER  | PK of affected entity                    |
| `user`       | VARCHAR  | Who triggered the action                 |
| `old_value`  | TEXT     | JSON-serialised previous state           |
| `new_value`  | TEXT     | JSON-serialised new state                |
| `reason`     | VARCHAR  | Human-readable explanation               |
| `ip_address` | VARCHAR  | Request origin (future use)              |
| `created_at` | DATETIME | UTC timestamp (server default)           |

---

## Migration Strategy

All schema changes go through `run_cdp_migrations()` in `database_sqlite.py`:

1. **Create** `crm_migrations` tracking table if not exists
2. **Check** if migration has already run (idempotent)
3. **Apply** `ALTER TABLE` for each new column (`IF NOT EXISTS` pattern for safety)
4. **Create** indexes with `CREATE INDEX IF NOT EXISTS`
5. **Record** migration as executed
6. Call `BaseSqlite.metadata.create_all(bind=engine)` to create new tables

### PostgreSQL Migration Path
The SQLAlchemy ORM is database-agnostic. To migrate to PostgreSQL:
1. Change `DATABASE_URL_SQLITE` to `postgresql://user:pass@host/db`
2. Replace `sqlite:///` driver with `psycopg2`
3. Run `create_all()` — all tables and indexes will be created
4. Re-run existing migrations for `ALTER TABLE` operations using PostgreSQL syntax

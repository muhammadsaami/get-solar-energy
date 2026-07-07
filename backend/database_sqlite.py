from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
import os
import logging

_log = logging.getLogger("database_sqlite")

DATABASE_URL_SQLITE = "sqlite:///./customer_platform.db"

engine_sqlite = create_engine(
    DATABASE_URL_SQLITE, connect_args={"check_same_thread": False}
)
SessionLocalSqlite = sessionmaker(autocommit=False, autoflush=False, bind=engine_sqlite)
BaseSqlite = declarative_base()

class CustomerModel(BaseSqlite):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    consumer_number = Column(String, unique=True, index=True, nullable=False)
    customer_name = Column(String, nullable=False)
    discom = Column(String, index=True, nullable=False)
    city = Column(String, index=True, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    
    # CRM Columns (Phase 12.4A+)
    status = Column(String, default="New Lead")
    salesperson = Column(String, nullable=True)
    lead_score = Column(Integer, default=0)
    health_score = Column(Integer, default=100)
    pipeline_value = Column(Float, default=0.0)
    expected_revenue = Column(Float, default=0.0)
    next_followup = Column(String, nullable=True)
    last_activity = Column(String, nullable=True)
    created_by = Column(String, default="System")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    bills = relationship("BillModel", back_populates="customer", cascade="all, delete-orphan")

class BillModel(BaseSqlite):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    file_name = Column(String, nullable=False)
    billing_period = Column(String, nullable=False)
    monthly_units = Column(Float, nullable=False)
    bill_amount = Column(Float, nullable=False)
    per_unit_rate = Column(Float, nullable=False)
    recommended_kw = Column(Float, nullable=False)
    monthly_savings = Column(Float, nullable=False)
    annual_savings = Column(Float, nullable=True)
    system_cost = Column(Float, nullable=False)
    subsidy = Column(Float, nullable=True)
    net_cost = Column(Float, nullable=True)
    payback_years = Column(Float, nullable=False)
    savings_25yr = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("CustomerModel", back_populates="bills")

# ─── Core Customer Indexes ────────────────────────────────────────────────────
Index("idx_customer_number",   CustomerModel.consumer_number)
Index("idx_customer_city",     CustomerModel.city)
Index("idx_customer_discom",   CustomerModel.discom)

# ─── CRM Performance Indexes (Phase 12.4A+++) ─────────────────────────────────
Index("idx_customer_status",       CustomerModel.status)
Index("idx_customer_salesperson",  CustomerModel.salesperson)
Index("idx_customer_lead_score",   CustomerModel.lead_score)
Index("idx_customer_health_score", CustomerModel.health_score)
Index("idx_customer_next_followup",CustomerModel.next_followup)
Index("idx_customer_created_at",   CustomerModel.created_at)
Index("idx_customer_updated_at",   CustomerModel.updated_at)


class CRMMigrationModel(BaseSqlite):
    """Tracks which schema migrations have already been applied."""
    __tablename__ = "crm_migrations"
    id             = Column(Integer, primary_key=True)
    migration_name = Column(String, unique=True, nullable=False)
    executed_at    = Column(DateTime(timezone=True), server_default=func.now())


def run_cdp_migrations(engine) -> None:
    """
    Idempotent migration runner.

    On every startup:
      1. Ensures ``crm_migrations`` tracking table exists.
      2. Skips if ``phase_12_4a_core_crm`` has already executed.
      3. Adds missing CRM columns to ``customers`` table.
      4. Adds missing CRM performance indexes.
      5. Records the migration as executed.
      6. Calls ``create_all`` to create any new tables
         (crm_timeline, crm_tasks, crm_followups, crm_meetings, crm_audit_log).
    """
    from sqlalchemy import text
    import crm_models   # registers models on BaseSqlite.metadata
    import crm_audit    # registers audit log model on BaseSqlite.metadata

    with engine.connect() as conn:
        # Ensure migration tracking table exists
        conn.execute(text(
            "CREATE TABLE IF NOT EXISTS crm_migrations "
            "(id INTEGER PRIMARY KEY, migration_name VARCHAR UNIQUE, "
            "executed_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
        ))
        conn.commit()

        already_run = conn.execute(
            text("SELECT id FROM crm_migrations WHERE migration_name = 'phase_12_4a_core_crm'")
        ).fetchone()

        if already_run:
            _log.info("Migration phase_12_4a_core_crm already executed — skipping column additions")
            # Still run create_all so new tables (audit log) are created
            BaseSqlite.metadata.create_all(bind=engine)
            return

        # ── Add CRM columns to customers table ────────────────────────────────
        crm_columns = [
            ("status",           "VARCHAR DEFAULT 'New Lead'"),
            ("salesperson",      "VARCHAR"),
            ("lead_score",       "INTEGER DEFAULT 0"),
            ("health_score",     "INTEGER DEFAULT 100"),
            ("pipeline_value",   "FLOAT DEFAULT 0.0"),
            ("expected_revenue", "FLOAT DEFAULT 0.0"),
            ("next_followup",    "VARCHAR"),
            ("last_activity",    "VARCHAR"),
            ("created_by",       "VARCHAR DEFAULT 'System'"),
            ("updated_at",       "DATETIME DEFAULT CURRENT_TIMESTAMP"),
        ]
        for col_name, col_type in crm_columns:
            try:
                conn.execute(text(f"ALTER TABLE customers ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                _log.info("Added column to customers", extra={"column": col_name})
            except Exception as col_err:
                _log.debug(f"Column '{col_name}' already exists or could not be added: {col_err}")

        # ── Add CRM performance indexes ────────────────────────────────────────
        crm_indexes = [
            ("idx_customer_status",        "customers", "status"),
            ("idx_customer_salesperson",   "customers", "salesperson"),
            ("idx_customer_lead_score",    "customers", "lead_score"),
            ("idx_customer_health_score",  "customers", "health_score"),
            ("idx_customer_next_followup", "customers", "next_followup"),
        ]
        for idx_name, table, col in crm_indexes:
            try:
                conn.execute(text(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table} ({col})"))
                conn.commit()
                _log.info("Index ensured", extra={"index": idx_name})
            except Exception as idx_err:
                _log.debug(f"Index '{idx_name}' skipped: {idx_err}")

        # ── Mark migration as applied ──────────────────────────────────────────
        conn.execute(text("INSERT INTO crm_migrations (migration_name) VALUES ('phase_12_4a_core_crm')"))
        conn.commit()
        _log.info("Migration applied successfully", extra={"migration": "phase_12_4a_core_crm"})

    # Create all tables: crm_timeline, crm_tasks, crm_followups, crm_meetings, crm_audit_log
    BaseSqlite.metadata.create_all(bind=engine)
    _log.info("All CRM tables verified / created via create_all")

def get_sqlite_db():
    db = SessionLocalSqlite()
    try:
        yield db
    finally:
        db.close()

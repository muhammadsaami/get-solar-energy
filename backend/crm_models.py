from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database_sqlite import BaseSqlite

class CRMActivityTimelineModel(BaseSqlite):
    __tablename__ = "crm_timeline"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    event_type = Column(String, nullable=False) # e.g. Customer Created, Bill Uploaded, etc.
    user = Column(String, default="System")
    module = Column(String, nullable=False) # e.g. CRM, Roof Analysis, Proposal Generator, etc.
    status = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CRMTaskModel(BaseSqlite):
    __tablename__ = "crm_tasks"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    title = Column(String, nullable=False)
    department = Column(String, nullable=False) # Sales, Survey, Installation, Finance, AMC, Support
    assigned_to = Column(String, nullable=True)
    priority = Column(String, nullable=False) # High, Medium, Low
    due_date = Column(String, nullable=False)
    status = Column(String, default="Pending") # Pending, In Progress, Completed, Cancelled
    progress = Column(Integer, default=0) # 0 to 100
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CRMFollowUpModel(BaseSqlite):
    __tablename__ = "crm_followups"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    title = Column(String, nullable=False) # Followup action
    due_date = Column(String, nullable=False) # ISO String or YYYY-MM-DD
    priority = Column(String, nullable=False) # High, Medium, Low
    status = Column(String, default="Pending") # Pending, Completed, Cancelled, Overdue
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CRMMeetingModel(BaseSqlite):
    __tablename__ = "crm_meetings"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    title = Column(String, nullable=False)
    meeting_type = Column(String, nullable=False) # Phone, Video, Office, Site Visit
    scheduled_date = Column(String, nullable=False) # YYYY-MM-DD
    scheduled_time = Column(String, nullable=False) # HH:MM
    assigned_to = Column(String, nullable=True)
    outcome = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    next_action = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CRMDocumentModel(BaseSqlite):
    __tablename__ = "crm_documents"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    uuid = Column(String, unique=True, nullable=False, index=True)
    document_type = Column(String, nullable=False, index=True)
    document_name = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    uploaded_by = Column(String, default="System")
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    checksum = Column(String, nullable=False)
    verification_status = Column(String, default="Pending", index=True) # Pending, Verified, Rejected
    remarks = Column(String, nullable=True)

class CRMCommunicationModel(BaseSqlite):
    __tablename__ = "crm_communications"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    channel = Column(String, nullable=False, index=True) # Email, SMS, WhatsApp, Phone Call, Internal Note
    subject = Column(String, nullable=True)
    message = Column(String, nullable=False)
    sender = Column(String, nullable=False)
    receiver = Column(String, nullable=False)
    delivery_status = Column(String, default="Sent")
    attachments = Column(String, nullable=True) # JSON list of metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class CRMInstallationModel(BaseSqlite):
    __tablename__ = "crm_installations"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    assigned_engineer = Column(String, nullable=True)
    current_stage = Column(String, default="Lead Won", index=True)
    completion_percentage = Column(Integer, default=0)
    expected_completion = Column(String, nullable=True) # YYYY-MM-DD
    inspection_date = Column(String, nullable=True) # YYYY-MM-DD
    panel_status = Column(String, default="Pending")
    inverter_status = Column(String, default="Pending")
    net_meter_status = Column(String, default="Pending")
    remarks = Column(String, nullable=True)
    history = Column(String, nullable=True) # JSON list of {stage, timestamp, completed_by, remarks, attachments}

class CRMAMCModel(BaseSqlite):
    __tablename__ = "crm_amc"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    contract_number = Column(String, unique=True, nullable=False)
    warranty_status = Column(String, default="Active")
    service_frequency = Column(String, default="Quarterly")
    next_service = Column(String, nullable=True) # YYYY-MM-DD
    expiry_date = Column(String, nullable=True) # YYYY-MM-DD
    assigned_engineer = Column(String, nullable=True)
    status = Column(String, default="Active", index=True)
    visits = Column(String, nullable=True) # JSON list of service records / visits

class CRMPaymentModel(BaseSqlite):
    __tablename__ = "crm_payments"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    invoice_number = Column(String, unique=True, nullable=False)
    invoice_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)
    outstanding_amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=True)
    payment_status = Column(String, default="Unpaid", index=True)
    due_date = Column(String, nullable=False) # YYYY-MM-DD
    paid_date = Column(String, nullable=True) # YYYY-MM-DD
    stage = Column(String, default="Quotation") # Quotation, Advance, Milestone, Final Payment, Completed
    history = Column(String, nullable=True) # JSON list of payment events


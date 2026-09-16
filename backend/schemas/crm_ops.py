from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict

class DocumentUpdateSchema(BaseModel):
    verification_status: str = Field(..., description="Pending | Verified | Rejected")
    remarks: Optional[str] = Field(None, max_length=1000)

    @field_validator("verification_status")
    @classmethod
    def validate_verification_status(cls, v: str) -> str:
        allowed = {"Pending", "Verified", "Rejected"}
        if v not in allowed:
            raise ValueError(f"verification_status must be one of {allowed}")
        return v

class CommunicationCreateSchema(BaseModel):
    customer_id: int = Field(..., description="Target customer ID")
    channel: str = Field(..., description="Email | SMS | WhatsApp | Phone Call | Internal Note")
    subject: Optional[str] = Field(None, max_length=200)
    message: str = Field(..., min_length=1, description="Message body")
    sender: str = Field(..., min_length=1, max_length=100)
    receiver: str = Field(..., min_length=1, max_length=100)
    delivery_status: str = Field("Sent", description="Delivery status of the message")

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, v: str) -> str:
        allowed = {"Email", "SMS", "WhatsApp", "Phone Call", "Internal Note"}
        if v not in allowed:
            raise ValueError(f"channel must be one of {allowed}")
        return v

class InstallationUpdateSchema(BaseModel):
    assigned_engineer: Optional[str] = Field(None, max_length=100)
    current_stage: Optional[str] = Field(None, description="Current workflow stage")
    completion_percentage: Optional[int] = Field(None, ge=0, le=100)
    expected_completion: Optional[str] = Field(None, description="Expected completion date YYYY-MM-DD")
    inspection_date: Optional[str] = Field(None, description="Inspection date YYYY-MM-DD")
    panel_status: Optional[str] = Field(None, max_length=50)
    inverter_status: Optional[str] = Field(None, max_length=50)
    net_meter_status: Optional[str] = Field(None, max_length=50)
    remarks: Optional[str] = Field(None, max_length=2000)

    @field_validator("current_stage")
    @classmethod
    def validate_stage(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = {
            "Lead Won",
            "Engineering Review",
            "Material Ordered",
            "Installation Scheduled",
            "Panels Installed",
            "Inverter Installed",
            "Inspection",
            "Net Meter Applied",
            "Net Meter Approved",
            "Commissioned",
            "Completed"
        }
        if v not in allowed:
            raise ValueError(f"current_stage must be one of {allowed}")
        return v

class AMCUpdateSchema(BaseModel):
    assigned_engineer: Optional[str] = Field(None, max_length=100)
    service_frequency: Optional[str] = Field(None, description="Monthly | Quarterly | Bi-Annual | Annual")
    next_service: Optional[str] = Field(None, description="YYYY-MM-DD")
    expiry_date: Optional[str] = Field(None, description="YYYY-MM-DD")
    status: Optional[str] = Field(None, description="Active | Expiring Soon | Expired | Cancelled")
    visits_json: Optional[str] = Field(None, description="JSON string list of service records")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = {"Active", "Expiring Soon", "Expired", "Cancelled"}
        if v not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v

class PaymentCreateSchema(BaseModel):
    customer_id: int
    invoice_number: str = Field(..., min_length=1, max_length=100)
    invoice_amount: float = Field(..., gt=0)
    due_date: str = Field(..., description="YYYY-MM-DD")
    stage: str = Field("Quotation", description="Quotation | Advance | Milestone | Final Payment | Completed")

    @field_validator("stage")
    @classmethod
    def validate_stage(cls, v: str) -> str:
        allowed = {"Quotation", "Advance", "Milestone", "Final Payment", "Completed"}
        if v not in allowed:
            raise ValueError(f"stage must be one of {allowed}")
        return v

class PaymentUpdateSchema(BaseModel):
    paid_amount: Optional[float] = Field(None, ge=0)
    payment_method: Optional[str] = Field(None, max_length=50)
    payment_status: Optional[str] = Field(None, description="Unpaid | Partially Paid | Paid | Overdue")
    paid_date: Optional[str] = Field(None, description="YYYY-MM-DD")
    stage: Optional[str] = Field(None, description="Quotation | Advance | Milestone | Final Payment | Completed")

    @field_validator("payment_status")
    @classmethod
    def validate_payment_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = {"Unpaid", "Partially Paid", "Paid", "Overdue"}
        if v not in allowed:
            raise ValueError(f"payment_status must be one of {allowed}")
        return v

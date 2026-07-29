"""
backend/schemas/crm_followup.py
=================================
GET Solar Energy — Pydantic Schemas for CRM Follow-ups.
Phase 12.4A+++ Production Excellence
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional


class FollowUpCreateSchema(BaseModel):
    """Schema for creating a new follow-up action."""

    customer_id: int           = Field(...,  description="Associated customer ID")
    title:       str           = Field(...,  min_length=2, max_length=200)
    due_date:    str           = Field(...,  description="ISO date string YYYY-MM-DD or YYYY-MM-DDTHH:MM")
    priority:    str           = Field(...,  description="High | Medium | Low")
    status:      str           = Field("Pending", description="Initial status")
    notes:       Optional[str] = Field(None, max_length=2000)

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        allowed = {"High", "Medium", "Low"}
        if v not in allowed:
            raise ValueError(f"priority must be one of {allowed}")
        return v

    model_config = {"json_schema_extra": {"examples": [{
        "customer_id": 1,
        "title": "Follow up on proposal delivery",
        "due_date": "2026-07-15",
        "priority": "High",
        "notes": "Customer requested 3-day window to review",
    }]}}


class FollowUpUpdateSchema(BaseModel):
    """Schema for partial follow-up update."""

    title:    Optional[str] = Field(None, max_length=200)
    due_date: Optional[str] = None
    priority: Optional[str] = None
    status:   Optional[str] = None
    notes:    Optional[str] = Field(None, max_length=2000)


class FollowUpResponseSchema(BaseModel):
    """Schema for follow-up response payload."""

    id:          int
    customer_id: int
    title:       str
    due_date:    str
    priority:    str
    status:      str
    notes:       Optional[str]

    model_config = {"from_attributes": True}

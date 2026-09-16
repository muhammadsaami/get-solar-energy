"""
backend/schemas/crm_meeting.py
================================
GET Solar Energy — Pydantic Schemas for CRM Meetings.
Phase 12.4A+++ Production Excellence
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional


class MeetingCreateSchema(BaseModel):
    """Schema for scheduling a new CRM meeting."""

    customer_id:    int            = Field(...,  description="Associated customer ID")
    title:          str            = Field(...,  min_length=2, max_length=200)
    meeting_type:   str            = Field(...,  description="Phone | Video | Office | Site Visit")
    scheduled_date: str            = Field(...,  description="YYYY-MM-DD")
    scheduled_time: str            = Field(...,  description="HH:MM (24-hour)")
    assigned_to:    Optional[str]  = Field(None, max_length=100)
    outcome:        Optional[str]  = Field(None, max_length=500)
    notes:          Optional[str]  = Field(None, max_length=2000)
    next_action:    Optional[str]  = Field(None, max_length=500)

    @field_validator("meeting_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        allowed = {"Phone", "Video", "Office", "Site Visit"}
        if v not in allowed:
            raise ValueError(f"meeting_type must be one of {allowed}")
        return v

    model_config = {"json_schema_extra": {"examples": [{
        "customer_id": 1,
        "title": "Initial Site Assessment Call",
        "meeting_type": "Phone",
        "scheduled_date": "2026-07-12",
        "scheduled_time": "10:30",
        "assigned_to": "Salman Ahmed",
    }]}}


class MeetingUpdateSchema(BaseModel):
    """Schema for partial meeting update."""

    title:          Optional[str] = Field(None, max_length=200)
    meeting_type:   Optional[str] = None
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    assigned_to:    Optional[str] = Field(None, max_length=100)
    outcome:        Optional[str] = Field(None, max_length=500)
    notes:          Optional[str] = Field(None, max_length=2000)
    next_action:    Optional[str] = Field(None, max_length=500)


class MeetingResponseSchema(BaseModel):
    """Schema for meeting response payload."""

    id:             int
    customer_id:    int
    title:          str
    meeting_type:   str
    scheduled_date: str
    scheduled_time: str
    assigned_to:    Optional[str]
    outcome:        Optional[str]
    notes:          Optional[str]
    next_action:    Optional[str]

    model_config = {"from_attributes": True}

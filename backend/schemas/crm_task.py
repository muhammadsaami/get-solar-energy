"""
backend/schemas/crm_task.py
============================
GET Solar Energy — Pydantic Request/Response Schemas for CRM Tasks.
Phase 12.4A+++ Production Excellence
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date


class TaskCreateSchema(BaseModel):
    """Schema for creating a new CRM task."""

    customer_id: Optional[int] = Field(None, description="Associated customer ID (optional for operational tasks)")
    title:       str           = Field(...,  min_length=2, max_length=200, description="Short task title")
    department:  str           = Field(...,  description="Owning department: Sales | Survey | Installation | Finance | AMC | Support")
    assigned_to: Optional[str] = Field(None, max_length=100, description="Assignee name")
    priority:    str           = Field(...,  description="Priority level: High | Medium | Low")
    due_date:    str           = Field(...,  description="ISO date string YYYY-MM-DD")
    status:      str           = Field("Pending", description="Initial status")
    progress:    int           = Field(0, ge=0, le=100, description="Completion percentage 0–100")
    notes:       Optional[str] = Field(None, max_length=2000)

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        allowed = {"High", "Medium", "Low"}
        if v not in allowed:
            raise ValueError(f"priority must be one of {allowed}")
        return v

    @field_validator("department")
    @classmethod
    def validate_department(cls, v: str) -> str:
        allowed = {"Sales", "Survey", "Installation", "Finance", "AMC", "Support"}
        if v not in allowed:
            raise ValueError(f"department must be one of {allowed}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {"Pending", "In Progress", "Completed", "Cancelled"}
        if v not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v

    model_config = {"json_schema_extra": {"examples": [{
        "customer_id": 1,
        "title": "Send solar proposal to Mr. Sharma",
        "department": "Sales",
        "assigned_to": "Ravi Kumar",
        "priority": "High",
        "due_date": "2026-07-10",
        "status": "Pending",
        "progress": 0,
        "notes": "Customer requested PDF version",
    }]}}


class TaskUpdateSchema(BaseModel):
    """Schema for partial update of a CRM task."""

    title:       Optional[str] = Field(None, min_length=2, max_length=200)
    department:  Optional[str] = None
    assigned_to: Optional[str] = Field(None, max_length=100)
    priority:    Optional[str] = None
    due_date:    Optional[str] = None
    status:      Optional[str] = None
    progress:    Optional[int] = Field(None, ge=0, le=100)
    notes:       Optional[str] = Field(None, max_length=2000)


class TaskResponseSchema(BaseModel):
    """Schema for task response payload."""

    id:          int
    customer_id: Optional[int]
    title:       str
    department:  str
    assigned_to: Optional[str]
    priority:    str
    due_date:    str
    status:      str
    progress:    int
    notes:       Optional[str]

    model_config = {"from_attributes": True}

"""
backend/schemas/crm_pipeline.py
=================================
GET Solar Energy — Pydantic Schemas for CRM Pipeline & Customer CRM Updates.
Phase 12.4A+++ Production Excellence
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, List

# ─── Valid Pipeline Stages ────────────────────────────────────────────────────
PIPELINE_STAGES = [
    "New Lead",
    "Qualified",
    "Site Survey Scheduled",
    "Survey Completed",
    "Proposal Generated",
    "Proposal Sent",
    "Negotiation",
    "Won",
    "Closed",
    "Lost",
]

# ─── Stage → Close Probability ────────────────────────────────────────────────
STAGE_PROBABILITIES: Dict[str, float] = {
    "New Lead":                0.10,
    "Qualified":               0.25,
    "Site Survey Scheduled":   0.40,
    "Survey Completed":        0.50,
    "Proposal Generated":      0.65,
    "Proposal Sent":           0.75,
    "Negotiation":             0.85,
    "Won":                     1.00,
    "Closed":                  1.00,
    "Lost":                    0.00,
}


class CustomerCrmUpdateSchema(BaseModel):
    """Schema for updating CRM-specific fields on a customer record."""

    status:           Optional[str]   = Field(None, description="Pipeline stage")
    salesperson:      Optional[str]   = Field(None, max_length=100, description="Assigned salesperson name")
    pipeline_value:   Optional[float] = Field(None, ge=0, description="Project value in INR")
    expected_revenue: Optional[float] = Field(None, ge=0, description="Weighted expected revenue in INR")

    @field_validator("status")
    @classmethod
    def validate_stage(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in PIPELINE_STAGES:
            raise ValueError(f"status must be one of {PIPELINE_STAGES}")
        return v


class PipelineMetricsResponseSchema(BaseModel):
    """Schema for the /api/crm/pipeline-metrics response."""

    total_leads:       int
    pipeline_value:    float
    expected_revenue:  float
    avg_deal_size:     float
    avg_lead_score:    float
    avg_health_score:  float
    win_rate:          float          # percentage
    loss_rate:         float          # percentage
    pipeline_velocity: float          # INR moved through pipeline per day
    avg_sales_cycle:   float          # average days from New Lead → Won/Closed
    stage_counts:      Dict[str, int]
    stage_values:      Dict[str, float]
    stage_expected:    Dict[str, float]
    avg_days_in_stage: Dict[str, float]
    stage_probabilities: Dict[str, float]

    model_config = {"from_attributes": True}

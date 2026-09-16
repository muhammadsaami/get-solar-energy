from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import date, datetime


STAGES = {"initiation", "design", "documentation", "approval", "pre-installation", "installation", "commissioning", "completed"}
PRIORITIES = {"low", "medium", "high", "critical"}
PROJECT_TYPES = {"residential", "commercial"}
RISK_FLAGS = {"supply_delay", "weather_delay", "budget_overrun", "permitting_issue", "structural_concern", "customer_change"}


class ProjectCreateSchema(BaseModel):
    title: str = Field(..., min_length=2, max_length=300)
    project_type: str = Field("residential")
    description: Optional[str] = Field(None, max_length=2000)
    customer_name: Optional[str] = Field(None, max_length=200)
    customer_email: Optional[str] = Field(None, max_length=200)
    customer_phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    pincode: Optional[str] = Field(None, max_length=20)
    status: str = Field("initiation")
    progress: Optional[int] = Field(0, ge=0, le=100)
    priority: str = Field("medium")
    start_date: Optional[str] = Field(None)
    target_date: Optional[str] = Field(None)
    completed_date: Optional[str] = Field(None)
    assigned_engineer: Optional[str] = Field(None, max_length=100)
    assigned_team: Optional[str] = Field(None, max_length=100)
    solar_system_size: Optional[float] = Field(0, ge=0)
    panel_count: Optional[int] = Field(0, ge=0)
    panel_capacity: Optional[int] = Field(0, ge=0)
    inverter_model: Optional[str] = Field(None, max_length=200)
    battery_model: Optional[str] = Field(None, max_length=200)
    total_budget: Optional[float] = Field(0, ge=0)
    project_value: Optional[float] = Field(0, ge=0)
    budget_variance: Optional[float] = Field(0)
    timeline_variance: Optional[int] = Field(0)
    health_score: Optional[int] = Field(80, ge=0, le=100)
    quality_score: Optional[int] = Field(80, ge=0, le=100)
    safety_score: Optional[int] = Field(80, ge=0, le=100)

    @field_validator("project_type")
    @classmethod
    def validate_project_type(cls, v: str) -> str:
        if v not in PROJECT_TYPES:
            raise ValueError(f"project_type must be one of {PROJECT_TYPES}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in STAGES:
            raise ValueError(f"status must be one of {STAGES}")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        if v not in PRIORITIES:
            raise ValueError(f"priority must be one of {PRIORITIES}")
        return v


class ProjectUpdateSchema(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=300)
    project_type: Optional[str] = Field(None)
    description: Optional[str] = Field(None, max_length=2000)
    customer_name: Optional[str] = Field(None, max_length=200)
    customer_email: Optional[str] = Field(None, max_length=200)
    customer_phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    pincode: Optional[str] = Field(None, max_length=20)
    status: Optional[str] = Field(None)
    progress: Optional[int] = Field(None, ge=0, le=100)
    priority: Optional[str] = Field(None)
    start_date: Optional[str] = Field(None)
    target_date: Optional[str] = Field(None)
    completed_date: Optional[str] = Field(None)
    assigned_engineer: Optional[str] = Field(None, max_length=100)
    assigned_team: Optional[str] = Field(None, max_length=100)
    solar_system_size: Optional[float] = Field(None, ge=0)
    panel_count: Optional[int] = Field(None, ge=0)
    panel_capacity: Optional[int] = Field(None, ge=0)
    inverter_model: Optional[str] = Field(None, max_length=200)
    battery_model: Optional[str] = Field(None, max_length=200)
    total_budget: Optional[float] = Field(None, ge=0)
    project_value: Optional[float] = Field(None, ge=0)
    budget_variance: Optional[float] = Field(None)
    timeline_variance: Optional[int] = Field(None)
    health_score: Optional[int] = Field(None, ge=0, le=100)
    quality_score: Optional[int] = Field(None, ge=0, le=100)
    safety_score: Optional[int] = Field(None, ge=0, le=100)
    notes: Optional[str] = Field(None)
    tasks: Optional[str] = Field(None)
    activities: Optional[str] = Field(None)
    documents: Optional[str] = Field(None)
    risk_flags: Optional[str] = Field(None)
    stage_start_dates: Optional[str] = Field(None)
    stage_completion_dates: Optional[str] = Field(None)

    @field_validator("project_type")
    @classmethod
    def validate_project_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in PROJECT_TYPES:
            raise ValueError(f"project_type must be one of {PROJECT_TYPES}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in STAGES:
            raise ValueError(f"status must be one of {STAGES}")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in PRIORITIES:
            raise ValueError(f"priority must be one of {PRIORITIES}")
        return v


class ProjectStageSchema(BaseModel):
    stage: str = Field(..., description="Target stage identifier")

    @field_validator("stage")
    @classmethod
    def validate_stage(cls, v: str) -> str:
        if v not in STAGES:
            raise ValueError(f"stage must be one of {STAGES}")
        return v


class ProjectMetricsResponseSchema(BaseModel):
    total_projects: int
    pipeline_value: float
    avg_health_score: float
    avg_progress: float
    stage_counts: Dict[str, int]
    project_type_counts: Dict[str, int]


class ProjectResponseSchema(BaseModel):
    id: str
    title: str
    projectType: str
    description: Optional[str] = None
    customerName: Optional[str] = None
    customerEmail: Optional[str] = None
    customerPhone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    status: str
    progress: Optional[int] = 0
    priority: str
    startDate: Optional[str] = None
    targetDate: Optional[str] = None
    completedDate: Optional[str] = None
    assignedEngineer: Optional[str] = None
    assignedTeam: Optional[str] = None
    solarSystemSize: Optional[float] = 0
    panelCount: Optional[int] = 0
    panelCapacity: Optional[int] = 0
    inverterModel: Optional[str] = None
    batteryModel: Optional[str] = None
    totalBudget: Optional[float] = 0
    projectValue: Optional[float] = 0
    currency: Optional[str] = "INR"
    budgetVariance: Optional[float] = 0
    timelineVariance: Optional[int] = 0
    healthScore: Optional[int] = 80
    qualityScore: Optional[int] = 80
    safetyScore: Optional[int] = 80
    notes: Any = []
    tasks: Any = []
    activities: Any = []
    documents: Any = []
    riskFlags: Any = []
    stageStartDates: Any = {}
    stageCompletionDates: Any = {}
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

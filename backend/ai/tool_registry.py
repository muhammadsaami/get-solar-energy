"""
backend/ai/tool_registry.py
=============================
GET Solar Energy — Enterprise AI Assistant Tool Registry
Phase 13.0D

Centralized registry of all tools the assistant can invoke.
Each tool wraps an existing service function — never duplicates logic.
"""

import logging
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class Tool:
    """Specification for a single tool."""
    name: str
    description: str
    category: str
    permissions: List[str] = field(default_factory=lambda: ["Administrator", "Premium User", "Free User"])
    input_schema: Optional[Dict[str, Any]] = None
    output_schema: Optional[Dict[str, Any]] = None
    requires_confirmation: bool = False
    supports_streaming: bool = False
    execute_fn: Optional[Callable] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "permissions": self.permissions,
            "input_schema": self.input_schema,
            "output_schema": self.output_schema,
            "requires_confirmation": self.requires_confirmation,
            "supports_streaming": self.supports_streaming,
        }


class ToolRegistry:
    """Registry of available tools."""

    _instance: Optional["ToolRegistry"] = None

    def __new__(cls) -> "ToolRegistry":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._tools: Dict[str, Tool] = {}
        self._register_defaults()
        self._initialized = True

    def _register_defaults(self) -> None:
        """Register all built-in tools."""
        _ADMIN_PREMIUM = ["Administrator", "Premium User"]
        _ALL = ["Administrator", "Premium User", "Free User"]

        self.register(Tool(
            name="c360_get",
            description="Retrieve the full Customer 360 view for a customer (profile, bills, tasks, meetings, installation, AMC, payments, timeline)",
            category="Customer360",
            permissions=_ALL,
            input_schema={"customer_id": {"type": "integer", "required": True}},
            output_schema={"customer360": {"type": "object"}},
        ))

        self.register(Tool(
            name="bill_analyze",
            description="Analyze an electricity bill using structured data (monthly units, rate, city) and return solar recommendations",
            category="Analysis",
            permissions=_ALL,
            input_schema={
                "monthly_units": {"type": "float", "required": True},
                "per_unit_rate": {"type": "float", "required": False, "default": 7.0},
                "city": {"type": "string", "required": False, "default": "Lucknow"},
                "billing_period": {"type": "string", "required": False},
            },
        ))

        self.register(Tool(
            name="roof_analyze",
            description="Analyze roof data for solar suitability and generate a 3kW layout",
            category="Analysis",
            permissions=_ALL,
            input_schema={
                "length_ft": {"type": "float", "required": True},
                "width_ft": {"type": "float", "required": True},
                "city": {"type": "string", "required": True},
            },
        ))

        self.register(Tool(
            name="roi_calculate",
            description="Calculate solar ROI: system cost, subsidy, payback, lifetime savings, CO2 reduction",
            category="Analysis",
            permissions=_ALL,
            input_schema={
                "monthly_bill": {"type": "float", "required": True},
                "system_size": {"type": "float", "required": True},
                "state": {"type": "string", "required": False, "default": "Uttar Pradesh"},
                "roof_type": {"type": "string", "required": False, "default": "flat"},
            },
        ))

        self.register(Tool(
            name="ai_analyze",
            description="Run full AI Intelligence Engine analysis: predictions, ROI, customer score, solar readiness, recommendations, explanations, risk indicators",
            category="AI",
            permissions=_ALL,
            input_schema={
                "customer_data": {"type": "object", "required": True},
            },
        ))

        self.register(Tool(
            name="ai_recommend",
            description="Generate AI-powered solar recommendations based on customer data and predictions",
            category="AI",
            permissions=_ALL,
            input_schema={
                "customer_data": {"type": "object", "required": True},
            },
        ))

        self.register(Tool(
            name="ai_explain",
            description="Generate a human-readable explanation of an ML prediction",
            category="AI",
            permissions=_ALL,
            input_schema={
                "model_name": {"type": "string", "required": True},
                "prediction": {"type": "float", "required": False},
                "features_used": {"type": "object", "required": False},
            },
        ))

        self.register(Tool(
            name="ai_customer_score",
            description="Calculate enterprise customer score (intent, financial, installation, follow-up scores, LTV, risk)",
            category="AI",
            permissions=_ALL,
            input_schema={
                "customer_data": {"type": "object", "required": True},
            },
        ))

        self.register(Tool(
            name="ai_solar_readiness",
            description="Assess solar readiness: consumption suitability, ROI potential, savings estimate, environmental impact",
            category="AI",
            permissions=_ALL,
            input_schema={
                "customer_data": {"type": "object", "required": True},
            },
        ))

        self.register(Tool(
            name="crm_create_task",
            description="Create a new CRM task (title, department, priority, due date, assigned to)",
            category="CRM",
            permissions=_ALL,
            requires_confirmation=True,
            input_schema={
                "title": {"type": "string", "required": True},
                "customer_id": {"type": "integer", "required": False},
                "department": {"type": "string", "required": False, "default": "Sales"},
                "assigned_to": {"type": "string", "required": False},
                "priority": {"type": "string", "required": False, "default": "Medium"},
                "due_date": {"type": "string", "required": False},
                "notes": {"type": "string", "required": False},
            },
        ))

        self.register(Tool(
            name="crm_update_customer",
            description="Update customer CRM fields (status, salesperson, pipeline value, expected revenue)",
            category="CRM",
            permissions=_ADMIN_PREMIUM,
            requires_confirmation=True,
            input_schema={
                "customer_id": {"type": "integer", "required": True},
                "status": {"type": "string", "required": False},
                "salesperson": {"type": "string", "required": False},
                "pipeline_value": {"type": "float", "required": False},
                "expected_revenue": {"type": "float", "required": False},
            },
        ))

        self.register(Tool(
            name="crm_get_customer",
            description="Retrieve a customer record by ID",
            category="CRM",
            permissions=_ALL,
            input_schema={"customer_id": {"type": "integer", "required": True}},
        ))

        self.register(Tool(
            name="crm_installation",
            description="View installation status and stage for a customer",
            category="Operations",
            permissions=_ALL,
            input_schema={"customer_id": {"type": "integer", "required": True}},
        ))

        self.register(Tool(
            name="crm_amc",
            description="View AMC (Annual Maintenance Contract) status for a customer",
            category="Operations",
            permissions=_ALL,
            input_schema={"customer_id": {"type": "integer", "required": True}},
        ))

        self.register(Tool(
            name="crm_payments",
            description="View payment history and outstanding amounts for a customer",
            category="Operations",
            permissions=_ALL,
            input_schema={"customer_id": {"type": "integer", "required": True}},
        ))

        self.register(Tool(
            name="reports_generate",
            description="Generate a CRM report (crm, sales, pipeline, activity). Returns CSV content.",
            category="Reports",
            permissions=_ADMIN_PREMIUM,
            requires_confirmation=True,
            input_schema={"report_type": {"type": "string", "required": True, "enum": ["crm", "sales", "pipeline", "activity"]}},
        ))

    def register(self, tool: Tool) -> None:
        self._tools[tool.name] = tool

    def get(self, name: str) -> Optional[Tool]:
        return self._tools.get(name)

    def list_all(self) -> List[Dict[str, Any]]:
        return [t.to_dict() for t in self._tools.values()]

    def list_for_role(self, role: str) -> List[Dict[str, Any]]:
        return [t.to_dict() for t in self._tools.values() if role in t.permissions]


def get_tool_registry() -> ToolRegistry:
    return ToolRegistry()

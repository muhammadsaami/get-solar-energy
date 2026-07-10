"""
backend/ai/assistant_planner.py
================================
GET Solar Energy — Enterprise AI Assistant Planner
Phase 13.0D

Orchestration planning layer. Takes an intent + context and produces
an ordered execution plan of tool calls. Does NOT execute tools.

Supports:
  - Sequential tool steps
  - Future parallel execution groups
  - Confirmation gates
  - Failure handling
"""

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class ToolStep:
    """A single step in an execution plan."""
    tool: str
    params: Dict[str, Any] = field(default_factory=dict)
    description: str = ""
    requires_confirmation: bool = False
    depends_on: List[str] = field(default_factory=list)
    parallel_group: Optional[str] = None
    optional: bool = False


@dataclass
class ExecutionPlan:
    """Ordered plan of tool steps to execute."""
    steps: List[ToolStep] = field(default_factory=list)
    summary: str = ""
    intent: str = ""
    requires_confirmation: bool = False


# Intent → default tool chain mappings
_DEFAULT_CHAINS: Dict[str, List[str]] = {
    "CUSTOMER360": ["c360_get", "ai_customer_score"],
    "BILL": ["bill_analyze"],
    "ROOF": ["roof_analyze"],
    "ROI": ["roi_calculate"],
    "AI_ANALYSIS": ["ai_analyze", "ai_recommend"],
    "RECOMMENDATION": ["ai_recommend"],
    "EXPLAINABILITY": ["ai_explain"],
    "CUSTOMER_SCORE": ["ai_customer_score"],
    "SOLAR_READINESS": ["ai_solar_readiness"],
    "INSTALLATION": ["crm_installation"],
    "AMC": ["crm_amc"],
    "PAYMENTS": ["crm_payments"],
    "REPORTS": ["reports_generate"],
    "CRM": ["crm_create_task"],
    "GENERAL": [],
}


class AssistantPlanner:
    """Builds execution plans from intents and context."""

    _instance: Optional["AssistantPlanner"] = None

    def __new__(cls) -> "AssistantPlanner":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._initialized = True

    def build_plan(
        self,
        intent_result: Dict[str, Any],
        context: Dict[str, Any],
        user_role: str,
    ) -> ExecutionPlan:
        """
        Build an execution plan from classified intent + context.

        Parameters
        ----------
        intent_result : dict
            From IntentRouter.classify — {intent, confidence, entities}
        context : dict
            The session's conversation_context
        user_role : str
            User's role for permission checks
        """
        intent = intent_result.get("intent", "GENERAL")
        confidence = intent_result.get("confidence", 0.0)
        entities = intent_result.get("entities", {})

        chain = _DEFAULT_CHAINS.get(intent, [])
        steps = self._build_steps(intent, chain, context, entities)
        requires_confirmation = any(s.requires_confirmation for s in steps)

        summary = self._build_summary(intent, steps, context)

        plan = ExecutionPlan(
            steps=steps,
            summary=summary,
            intent=intent,
            requires_confirmation=requires_confirmation,
        )

        logger.info(
            "Planner: intent=%s confidence=%.2f steps=%d requires_confirmation=%s",
            intent, confidence, len(steps), requires_confirmation,
        )

        return plan

    def _build_steps(
        self,
        intent: str,
        chain: List[str],
        context: Dict[str, Any],
        entities: Dict[str, Any],
    ) -> List[ToolStep]:
        """Map tool names to ToolStep objects with context-aware params."""
        customer = context.get("customer")
        customer_id = customer.get("id") if isinstance(customer, dict) else None
        steps: List[ToolStep] = []

        for tool_name in chain:
            step = self._make_step(tool_name, customer_id, context, entities)
            if step is not None:
                steps.append(step)

        return steps

    def _make_step(
        self,
        tool_name: str,
        customer_id: Optional[int],
        context: Dict[str, Any],
        entities: Dict[str, Any],
    ) -> Optional[ToolStep]:
        """Create a single ToolStep with appropriate parameters."""
        params: Dict[str, Any] = {}

        if customer_id and tool_name not in ("roi_calculate", "reports_generate"):
            params["customer_id"] = customer_id

        if tool_name == "c360_get":
            return ToolStep(
                tool=tool_name, params=params,
                description="Retrieve Customer360 view",
            )
        if tool_name == "crm_create_task":
            task_data = {
                "title": entities.get("task_title", "Follow-up from AI Assistant"),
                "priority": entities.get("priority", "Medium"),
                "department": entities.get("department", "Sales"),
            }
            if customer_id:
                task_data["customer_id"] = customer_id
            return ToolStep(
                tool=tool_name, params=task_data,
                description="Create CRM task",
                requires_confirmation=True,
            )
        if tool_name == "crm_installation":
            return ToolStep(
                tool=tool_name, params=params,
                description="View installation status",
            )
        if tool_name == "crm_amc":
            return ToolStep(
                tool=tool_name, params=params,
                description="View AMC status",
            )
        if tool_name == "crm_payments":
            return ToolStep(
                tool=tool_name, params=params,
                description="View payment history",
            )
        if tool_name == "reports_generate":
            report_type = entities.get("report_type", "crm")
            return ToolStep(
                tool=tool_name, params={"report_type": report_type},
                description=f"Generate {report_type} report",
                requires_confirmation=True,
            )
        if tool_name == "ai_analyze":
            customer_data = self._extract_customer_data(context)
            return ToolStep(
                tool=tool_name, params={"customer_data": customer_data},
                description="Run full AI analysis",
            )
        if tool_name == "ai_recommend":
            customer_data = self._extract_customer_data(context)
            return ToolStep(
                tool=tool_name, params={"customer_data": customer_data},
                description="Generate recommendations",
            )
        if tool_name == "ai_explain":
            return ToolStep(
                tool=tool_name, params=params,
                description="Explain predictions",
            )
        if tool_name == "ai_customer_score":
            customer_data = self._extract_customer_data(context)
            return ToolStep(
                tool=tool_name, params={"customer_data": customer_data},
                description="Calculate customer score",
            )
        if tool_name == "ai_solar_readiness":
            customer_data = self._extract_customer_data(context)
            return ToolStep(
                tool=tool_name, params={"customer_data": customer_data},
                description="Assess solar readiness",
            )
        if tool_name == "bill_analyze":
            return ToolStep(
                tool=tool_name, params=context.get("bill") or {},
                description="Analyze electricity bill",
            )
        if tool_name == "roof_analyze":
            return ToolStep(
                tool=tool_name, params=context.get("roof") or {},
                description="Analyze roof for solar",
            )
        if tool_name == "roi_calculate":
            return ToolStep(
                tool=tool_name, params=params,
                description="Calculate ROI",
            )

        # Unknown tool — skip
        return None

    def _extract_customer_data(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Pull customer_data from context for AI tools."""
        customer = context.get("customer") or {}
        predictions = context.get("predictions") or {}
        data: Dict[str, Any] = {}
        if isinstance(customer, dict):
            data.update(customer)
        if isinstance(predictions, dict):
            data.update(predictions)
        return data

    def _build_summary(self, intent: str, steps: List[ToolStep], context: Dict[str, Any]) -> str:
        """Human-readable summary of the plan."""
        if not steps:
            return f"Answering general query (intent: {intent})"
        tool_names = [s.tool for s in steps]
        return f"{intent}: {' → '.join(tool_names)}"


def get_planner() -> AssistantPlanner:
    return AssistantPlanner()

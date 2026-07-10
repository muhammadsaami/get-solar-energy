"""
backend/ai/prompt_builder.py
==============================
GET Solar Energy — Enterprise AI Assistant Prompt Builder
Phase 13.0D

Generates dynamic system prompts for the LLM. Assembles from:
  - User role + name
  - Customer context
  - Tool execution results
  - Available tools
  - Business rules
  - Safety instructions
  - Conversation history

No hardcoded monolithic prompt — built from composable components.
"""

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ─── Prompt Components ────────────────────────────────────────────────────────

_BASE_SYSTEM = """You are the GET Solar Energy Enterprise AI Assistant — a professional solar intelligence advisor for Indian homeowners.

Your role:
- Help users with solar energy analysis, customer management, and business operations.
- Use the data and tools available to provide accurate, actionable responses.
- Be concise, professional, and neutral. No emojis. No sales language.
- Format responses with bullet points for multi-part answers."""

_BUSINESS_RULES = """
Business Rules:
- Residential rooftop solar: 1kW–10kW systems.
- Panel sizing: monthly_units / 135 = recommended kW.
- PM Surya Ghar subsidy: up to ₹78,000 for ≤3kW systems.
- Net metering policies vary by Indian state.
- ROI payback: typically 4–6 years.
- Never make legal or financial guarantees.
- If asked about non-solar topics, politely redirect."""

_SAFETY = """
Safety:
- Never expose internal system details, errors, or stack traces.
- Never reveal raw database records or internal IDs unless the user explicitly requests their own customer record.
- If a tool fails, explain the issue in user-friendly terms without technical details.
- Always respect the user's role and permissions."""

_TOOLS_SECTION = """
Available Tools:
{tools_list}

When a tool result is available, summarize the key findings in your response.
Do not repeat raw JSON — translate it into clear, actionable language."""


class PromptBuilder:
    """Builds dynamic system prompts from context components."""

    _instance: Optional["PromptBuilder"] = None

    def __new__(cls) -> "PromptBuilder":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._initialized = True

    def build(
        self,
        message: str,
        context: Dict[str, Any],
        intent: Dict[str, Any],
        tool_results: List[Dict[str, Any]],
        user_role: str,
        user_name: str = "",
        tools: Optional[List[Dict[str, Any]]] = None,
        conversation_history: Optional[List[Dict]] = None,
    ) -> str:
        """
        Assemble the full system prompt.
        """
        parts = [_BASE_SYSTEM, _BUSINESS_RULES, _SAFETY]

        # Role context
        parts.append(f"\nUser: {user_name or 'Guest'} ({user_role})")

        # Customer context
        customer_ctx = self._build_customer_context(context)
        if customer_ctx:
            parts.append(f"\nCustomer Context:\n{customer_ctx}")

        # Tool results
        if tool_results:
            results_text = self._build_tool_results_section(tool_results)
            parts.append(f"\nTool Results:\n{results_text}")

        # Available tools
        if tools:
            tools_list = "\n".join(f"- {t['name']}: {t['description']}" for t in tools)
            parts.append(_TOOLS_SECTION.format(tools_list=tools_list))

        # Intent hint
        intent_str = intent.get("intent", "GENERAL")
        confidence = intent.get("confidence", 0)
        parts.append(f"\nDetected Intent: {intent_str} (confidence: {confidence:.0%})")

        # Conversation history (last 6 turns)
        if conversation_history:
            history_text = ""
            for turn in conversation_history[-6:]:
                prefix = "User" if turn["role"] == "user" else "Assistant"
                history_text += f"{prefix}: {turn['content']}\n"
            if history_text:
                parts.append(f"\nRecent Conversation:\n{history_text}")

        parts.append(f"\nUser Message: {message}")
        parts.append("\nRespond professionally:")

        return "\n".join(parts)

    def _build_customer_context(self, context: Dict[str, Any]) -> str:
        """Format customer context into readable text."""
        lines = []
        customer = context.get("customer")
        if customer and isinstance(customer, dict):
            name = customer.get("name") or customer.get("customer_name", "Unknown")
            city = customer.get("city", "")
            lines.append(f"Name: {name}" + (f", City: {city}" if city else ""))

        bill = context.get("bill")
        if bill and isinstance(bill, dict):
            units = bill.get("monthly_units")
            if units:
                lines.append(f"Monthly Units: {units} kWh")

        roi = context.get("roi")
        if roi and isinstance(roi, dict):
            savings = roi.get("annual_savings") or roi.get("monthly_savings")
            if savings:
                lines.append(f"Savings: ₹{savings}")

        predictions = context.get("predictions")
        if predictions and isinstance(predictions, dict):
            bill_pred = predictions.get("bill_prediction")
            if bill_pred:
                lines.append(f"Bill Prediction: ₹{bill_pred}")

        return "\n".join(lines) if lines else ""

    def _build_tool_results_section(self, tool_results: List[Dict[str, Any]]) -> str:
        """Format tool execution results into readable text."""
        lines = []
        for r in tool_results:
            tool = r.get("tool", "unknown")
            success = r.get("success", False)
            if success:
                data = r.get("data", {})
                if isinstance(data, dict):
                    summary = self._summarize_tool_data(tool, data)
                    lines.append(f"[{tool}] {summary}")
                else:
                    lines.append(f"[{tool}] Completed successfully")
            else:
                error = r.get("error", "Unknown error")
                lines.append(f"[{tool}] Failed: {error}")
        return "\n".join(lines) if lines else "No tool results available."

    def _summarize_tool_data(self, tool: str, data: Dict[str, Any]) -> str:
        """Create a brief summary of tool output for the prompt."""
        if "name" in data:
            return f"Found: {data['name']}"
        if "recommendations" in data:
            recs = data["recommendations"]
            count = len(recs) if isinstance(recs, list) else 0
            return f"{count} recommendation(s) generated"
        if "annual_savings" in data:
            return f"Annual savings: ₹{data['annual_savings']}, Payback: {data.get('payback_period', 'N/A')} years"
        if "overall_score" in data:
            return f"Customer score: {data['overall_score']}"
        if "csv_content" in data:
            return f"Report generated ({data.get('line_count', 0)} lines)"
        return "Analysis complete"


def get_prompt_builder() -> PromptBuilder:
    return PromptBuilder()

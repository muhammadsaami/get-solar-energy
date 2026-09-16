"""
backend/ai/response_formatter.py
==================================
GET Solar Energy — Enterprise AI Assistant Response Formatter
Phase 13.0D

Generates consistent, structured assistant responses with:
  - response text
  - tool_results
  - recommendations
  - next_actions
  - context
  - confidence
  - conversation_id
  - timestamp
  - warnings
  - errors
"""

import time
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


def format_response(
    *,
    llm_response: str,
    tool_results: Optional[List[Dict[str, Any]]] = None,
    intent: Optional[Dict[str, Any]] = None,
    recommendations: Optional[List[Dict[str, Any]]] = None,
    next_actions: Optional[List[str]] = None,
    conversation_id: str = "",
    request_id: str = "",
    elapsed_ms: float = 0.0,
    warnings: Optional[List[str]] = None,
    errors: Optional[List[str]] = None,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Build the structured API response envelope.
    """
    tool_results = tool_results or []
    intent = intent or {}
    recommendations = recommendations or []
    next_actions = next_actions or []
    warnings = warnings or []
    errors = errors or []

    # Extract tool-specific insights
    for tr in tool_results:
        if not tr.get("success") and tr.get("error"):
            warnings.append(f"Tool '{tr.get('tool')}': {tr['error']}")
        if tr.get("success") and tr.get("data"):
            recs = _extract_recommendations(tr)
            if recs:
                recommendations.extend(recs)
            actions = _extract_next_actions(tr)
            if actions:
                next_actions.extend(actions)

    # Compute confidence from tool results
    confidence = _compute_confidence(tool_results, intent)

    return {
        "response": llm_response,
        "tool_results": [_clean_tool_result(tr) for tr in tool_results],
        "recommendations": recommendations,
        "next_actions": next_actions,
        "context": context or intent,
        "confidence": confidence,
        "conversation_id": conversation_id,
        "request_id": request_id,
        "timestamp": time.time(),
        "elapsed_ms": round(elapsed_ms, 2),
        "warnings": warnings,
        "errors": errors,
    }


def _clean_tool_result(tr: Dict[str, Any]) -> Dict[str, Any]:
    """Remove large raw data from tool results for the response."""
    cleaned = {
        "tool": tr.get("tool"),
        "success": tr.get("success"),
        "latency_ms": tr.get("latency_ms"),
    }
    if not tr.get("success"):
        cleaned["error"] = tr.get("error")
    if tr.get("success") and tr.get("data"):
        data = tr["data"]
        if isinstance(data, dict):
            cleaned["summary"] = _summarize_data(data)
        else:
            cleaned["summary"] = "Completed"
    return cleaned


def _summarize_data(data: Dict[str, Any]) -> str:
    """Create a brief human-readable summary of tool data."""
    if "name" in data and "customer_name" not in data:
        return f"Found: {data.get('name', 'Unknown')}"
    if "annual_savings" in data:
        return f"Annual savings: ₹{data['annual_savings']}"
    if "overall_score" in data:
        return f"Score: {data['overall_score']}"
    if "recommendations" in data:
        count = len(data["recommendations"]) if isinstance(data["recommendations"], list) else 0
        return f"{count} recommendation(s)"
    if "csv_content" in data:
        return f"Report ({data.get('line_count', 0)} lines)"
    return "Analysis complete"


def _extract_recommendations(tr: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Pull recommendations from tool data."""
    data = tr.get("data", {})
    if isinstance(data, dict) and "recommendations" in data:
        recs = data["recommendations"]
        if isinstance(recs, list):
            return [
                {"title": r.get("title", ""), "category": r.get("category", ""), "priority": r.get("priority", "medium")}
                for r in recs[:5]
            ]
    return []


def _extract_next_actions(tr: Dict[str, Any]) -> List[str]:
    """Pull suggested next actions from tool data."""
    data = tr.get("data", {})
    actions = []
    if isinstance(data, dict):
        if data.get("next_best_action"):
            actions.append(data["next_best_action"])
        if data.get("status") == "No installation record found":
            actions.append("Schedule site survey for installation assessment")
    return actions


def _compute_confidence(tool_results: List[Dict], intent: Dict) -> float:
    """Compute overall response confidence from tool results."""
    if not tool_results:
        return intent.get("confidence", 0.5)

    successes = sum(1 for tr in tool_results if tr.get("success"))
    total = len(tool_results)
    if total == 0:
        return 0.5

    tool_confidence = successes / total
    intent_confidence = intent.get("confidence", 0.5)

    return round(tool_confidence * 0.6 + intent_confidence * 0.4, 2)

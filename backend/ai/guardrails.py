"""
backend/ai/guardrails.py
=========================
GET Solar Energy — Enterprise AI Assistant Guardrails
Phase 13.0D

Validates tool inputs, checks permissions, blocks unsafe actions,
and sanitizes user input.
"""

import re
import logging
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# Actions that require explicit confirmation
UNSAFE_ACTIONS = frozenset({
    "crm_create_task",
    "crm_update_customer",
    "reports_generate",
})

# Fields that should never be modified by the assistant
PROTECTED_FIELDS = frozenset({
    "id", "created_at", "updated_at", "password", "hash",
})


class Guardrails:
    """Permission and input validation for tool execution."""

    _instance: Optional["Guardrails"] = None

    def __new__(cls) -> "Guardrails":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._initialized = True

    def check_permissions(
        self,
        tool_permissions: List[str],
        user_role: str,
    ) -> Tuple[bool, Optional[str]]:
        """Check if the user's role is allowed to execute this tool."""
        if user_role in tool_permissions:
            return True, None
        return False, f"Insufficient permissions: role '{user_role}' not in {tool_permissions}"

    def validate_input(
        self,
        params: Dict[str, Any],
        schema: Optional[Dict[str, Any]],
    ) -> Tuple[bool, Optional[str]]:
        """Validate input parameters against the tool's schema."""
        if schema is None:
            return True, None

        for field_name, spec in schema.items():
            if spec.get("required", False):
                if field_name not in params or params[field_name] is None:
                    return False, f"Missing required field: {field_name}"

            if field_name in params and params[field_name] is not None:
                value = params[field_name]
                expected_type = spec.get("type")
                if expected_type == "integer" and not isinstance(value, (int, float)):
                    return False, f"Field '{field_name}' must be a number"
                if expected_type == "float" and not isinstance(value, (int, float)):
                    return False, f"Field '{field_name}' must be a number"
                if expected_type == "string" and not isinstance(value, str):
                    return False, f"Field '{field_name}' must be a string"
                if expected_type == "object" and not isinstance(value, dict):
                    return False, f"Field '{field_name}' must be an object"

        return True, None

    def is_unsafe_action(self, tool_name: str) -> bool:
        """Check if a tool requires confirmation."""
        return tool_name in UNSAFE_ACTIONS

    def sanitize_input(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize string values in the params dict."""
        sanitized = {}
        for k, v in params.items():
            if isinstance(v, str):
                # Strip control characters, limit length
                v = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', v)
                v = v[:2000]
            sanitized[k] = v
        return sanitized

    def block_protected_fields(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Remove protected fields that the assistant should not modify."""
        return {k: v for k, v in params.items() if k not in PROTECTED_FIELDS}

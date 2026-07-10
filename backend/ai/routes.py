"""
backend/ai/routes.py
=====================
GET Solar Energy — Enterprise AI Assistant API Routes
Phase 13.0D

FastAPI router exposing the 5 assistant endpoints.
Protected by verify_token (returns user email → AssistantContext).
"""

import hashlib
import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from security import verify_token
from auth import load_users
from database_sqlite import get_sqlite_db
from utils.responses import ok, bad_request, server_error, not_found

from .assistant_service import get_assistant_service
from .client import ASSISTANT_MODEL

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/assistant", tags=["Enterprise AI Assistant"])

ADMIN_EMAIL = "admin@getsolar.in"


# ─── Request / Response Models ────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class ToolRequest(BaseModel):
    tool: str
    params: Dict[str, Any] = {}


# ─── Auth Dependency ──────────────────────────────────────────────────────────

def _determine_role(email: str) -> str:
    """Replicate the role logic from main.py."""
    if email == ADMIN_EMAIL:
        return "Administrator"
    h = int(hashlib.md5(email.encode("utf-8")).hexdigest(), 16)
    if (h % 3) == 0:
        return "Premium User"
    return "Free User"


def get_current_user(token: str = Depends(verify_token)) -> Dict[str, Any]:
    """Build AssistantContext from the JWT token."""
    users = load_users()
    user = users.get(token)
    role = _determine_role(token)
    name = user.get("name", "") if isinstance(user, dict) else ""
    return {
        "email": token,
        "role": role,
        "name": name,
        "permissions": [role],
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/chat")
def chat_endpoint(
    request: ChatRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_sqlite_db),
):
    """Process a chat message through the Enterprise AI Assistant."""
    try:
        service = get_assistant_service()
        result = service.chat(
            message=request.message,
            user_email=user["email"],
            user_role=user["role"],
            user_name=user["name"],
            session_id=request.session_id,
            frontend_context=request.context,
        )
        return ok(data=result, message="Assistant response generated")
    except Exception as e:
        logger.exception("Assistant chat failed")
        return server_error(message="Assistant request failed")


@router.post("/tool")
def execute_tool_endpoint(
    request: ToolRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_sqlite_db),
):
    """Execute a single tool by name."""
    try:
        service = get_assistant_service()
        result = service.execute_tool(
            request.tool,
            request.params,
            user_email=user["email"],
            user_role=user["role"],
            db=db,
        )
        if not result.get("success"):
            return bad_request(message=result.get("error", "Tool execution failed"))
        return ok(data=result, message=f"Tool '{request.tool}' executed")
    except Exception as e:
        logger.exception("Tool execution failed")
        return server_error(message="Tool execution failed")


@router.get("/tools")
def list_tools_endpoint(
    user: Dict[str, Any] = Depends(get_current_user),
):
    """List available tools for the current user's role."""
    try:
        service = get_assistant_service()
        tools = service.get_tools(user["role"])
        return ok(data={"tools": tools, "model": ASSISTANT_MODEL, "role": user["role"]})
    except Exception as e:
        logger.exception("Failed to list tools")
        return server_error(message="Failed to list tools")


@router.get("/history")
def get_history_endpoint(
    session_id: str = Query(..., description="Session ID"),
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Get conversation history for a session."""
    try:
        service = get_assistant_service()
        history = service.get_history(session_id)
        return ok(data=history)
    except Exception as e:
        logger.exception("Failed to get history")
        return server_error(message="Failed to get history")


@router.delete("/history")
def clear_history_endpoint(
    session_id: str = Query(..., description="Session ID"),
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Clear conversation history for a session."""
    try:
        service = get_assistant_service()
        cleared = service.clear_history(session_id)
        if cleared:
            return ok(message="History cleared")
        return not_found(resource="Session", resource_id=session_id)
    except Exception as e:
        logger.exception("Failed to clear history")
        return server_error(message="Failed to clear history")

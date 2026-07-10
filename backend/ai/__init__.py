"""
backend/ai/__init__.py
======================
GET Solar Energy — Enterprise AI Assistant
Phase 13.0D

Orchestration layer on top of existing platform services.
"""

from .client import ASSISTANT_MODEL, get_genai_client
from .conversation_memory import (
    ConversationMemoryStore,
    InMemoryConversationMemory,
    get_memory_store,
)
from .assistant_service import AssistantService, get_assistant_service
from .intent_router import IntentRouter, get_intent_router
from .assistant_planner import AssistantPlanner, get_planner
from .tool_registry import ToolRegistry, get_tool_registry
from .tool_executor import ToolExecutor, get_tool_executor
from .guardrails import Guardrails
from .prompt_builder import PromptBuilder, get_prompt_builder
from .response_formatter import format_response
from .routes import router as assistant_router

__all__ = [
    "ASSISTANT_MODEL",
    "get_genai_client",
    "ConversationMemoryStore",
    "InMemoryConversationMemory",
    "get_memory_store",
    "AssistantService",
    "get_assistant_service",
    "IntentRouter",
    "get_intent_router",
    "AssistantPlanner",
    "get_planner",
    "ToolRegistry",
    "get_tool_registry",
    "ToolExecutor",
    "get_tool_executor",
    "Guardrails",
    "PromptBuilder",
    "get_prompt_builder",
    "format_response",
    "assistant_router",
]

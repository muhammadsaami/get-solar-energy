"""
backend/ai/__init__.py
======================
GET Solar Energy — Enterprise AI Assistant
Phase 2.0: Controlled Backend-Only Integration

Orchestration layer on top of existing platform services.
Provides provider-neutral LLM abstraction for Gemini, Mock, and OpenAI Luna providers.
"""

from .provider_base import (
    BaseAIProvider,
    AIRequest,
    AIResponse,
    AIUsage,
    AIProviderError,
    AIProviderAuthError,
    AIProviderRateLimitError,
    AIProviderTimeoutError,
    AIProviderUnavailableError,
    AIProviderResponseError,
)
from .provider_factory import (
    get_ai_provider,
    set_ai_provider,
    get_selected_provider,
    get_provider_status,
)
from .provider_selector import (
    ProviderSelector,
    ProviderConfig,
    AIProviderConfigError,
    EligibilityResult,
    FallbackProviderWrapper,
)
from .providers.gemini_provider import GeminiProvider
from .providers.mock_provider import MockAIProvider
from .providers.luna_provider import OpenAIProvider, LunaProvider
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
    # Provider Abstraction Core
    "BaseAIProvider",
    "AIRequest",
    "AIResponse",
    "AIUsage",
    "AIProviderError",
    "AIProviderAuthError",
    "AIProviderRateLimitError",
    "AIProviderTimeoutError",
    "AIProviderUnavailableError",
    "AIProviderResponseError",
    "get_ai_provider",
    "set_ai_provider",
    "get_selected_provider",
    "get_provider_status",
    "ProviderSelector",
    "ProviderConfig",
    "AIProviderConfigError",
    "EligibilityResult",
    "FallbackProviderWrapper",
    "GeminiProvider",
    "MockAIProvider",
    "OpenAIProvider",
    "LunaProvider",
    # Legacy / Compatibility
    "ASSISTANT_MODEL",
    "get_genai_client",
    # Memory & Orchestration
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

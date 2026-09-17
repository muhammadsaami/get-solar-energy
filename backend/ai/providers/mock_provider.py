"""
backend/ai/providers/mock_provider.py
====================================
GET Solar Energy — Deterministic Mock AI Provider
Phase 1: AI Provider Abstraction Foundation

Implements BaseAIProvider for unit and integration tests without network access,
external API keys, or unpredictable latency.
"""

import time
from typing import Any, Dict, List, Optional

from ..provider_base import (
    BaseAIProvider,
    AIRequest,
    AIResponse,
    AIUsage,
    AIProviderError,
    AIProviderResponseError,
)


class MockAIProvider(BaseAIProvider):
    """Deterministic, offline AI provider adapter for testing."""

    def __init__(
        self,
        model_name: str = "mock-luna-gemini-v1",
        default_response: str = "This is a deterministic mock AI assistant response for GET Solar Energy.",
        simulate_error: Optional[Exception] = None,
    ):
        self._model_name = model_name
        self._default_response = default_response
        self._simulate_error = simulate_error
        self._custom_responses: List[str] = []
        self._call_history: List[AIRequest] = []

    def set_custom_responses(self, responses: List[str]) -> None:
        """Queue custom responses to be returned sequentially."""
        self._custom_responses = list(responses)

    def set_simulate_error(self, error: Optional[Exception]) -> None:
        """Set or clear an exception to simulate provider failure."""
        self._simulate_error = error

    def get_call_history(self) -> List[AIRequest]:
        """Return history of requests processed by this mock."""
        return self._call_history

    def clear_history(self) -> None:
        """Clear recorded request history."""
        self._call_history.clear()

    def get_model_name(self) -> str:
        """Return the mock model identifier."""
        return self._model_name

    def generate_response(self, request: AIRequest) -> AIResponse:
        """Generate deterministic response or raise simulated error."""
        self._call_history.append(request)

        if self._simulate_error is not None:
            if isinstance(self._simulate_error, AIProviderError):
                raise self._simulate_error
            raise AIProviderError(
                str(self._simulate_error),
                provider="mock",
                original_error=self._simulate_error,
            )

        # Determine response text
        if self._custom_responses:
            content = self._custom_responses.pop(0)
        else:
            content = self._default_response

        # Estimate mock token usage
        prompt_len = len(request.prompt) + (len(request.system_instruction) if request.system_instruction else 0)
        prompt_tokens = max(1, prompt_len // 4)
        completion_tokens = max(1, len(content) // 4)

        return AIResponse(
            content=content,
            model=self._model_name,
            usage=AIUsage(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=prompt_tokens + completion_tokens,
            ),
            finish_reason="STOP",
            latency_ms=1.5,
            metadata={"mock": True, "provider": "mock", "model": self._model_name},
        )

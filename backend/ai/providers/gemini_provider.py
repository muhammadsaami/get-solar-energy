"""
backend/ai/providers/gemini_provider.py
======================================
GET Solar Energy — Google Gemini Provider Adapter
Phase 1: AI Provider Abstraction Foundation

Implements the BaseAIProvider interface for Google Gemini models.
Wraps the google-genai SDK with retry backoff, response normalization,
error mapping, and usage extraction.
"""

import os
import time
import logging
from typing import Any, Dict, List, Optional

from ..provider_base import (
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

logger = logging.getLogger(__name__)

DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite"


class GeminiProvider(BaseAIProvider):
    """Adapter for Google GenAI / Gemini models."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        client: Optional[Any] = None,
    ):
        self._api_key = api_key or os.getenv("GEMINI_API_KEY")
        self._model_name = model_name or os.getenv("ASSISTANT_MODEL", DEFAULT_GEMINI_MODEL)
        self._client = client
        self._max_retries = 3

    def _get_client(self) -> Any:
        """Lazily initialize the Google GenAI client."""
        if self._client is None:
            if not self._api_key:
                logger.warning("GEMINI_API_KEY is not set. GeminiProvider will fail live calls.")
            try:
                from google import genai
                self._client = genai.Client(api_key=self._api_key)
            except Exception as e:
                raise AIProviderAuthError(
                    f"Failed to initialize Google GenAI client: {str(e)}",
                    provider="gemini",
                    original_error=e,
                )
        return self._client

    def get_model_name(self) -> str:
        """Return the active model identifier."""
        return self._model_name

    def generate_response(self, request: AIRequest) -> AIResponse:
        """
        Execute generation using Google GenAI SDK with retry logic and error normalization.
        """
        client = self._get_client()

        # Build prompt string from request components
        full_prompt = self._build_prompt_payload(request)

        t0 = time.time()
        last_error = None

        for attempt in range(self._max_retries):
            try:
                raw_response = client.models.generate_content(
                    model=self._model_name,
                    contents=full_prompt,
                )
                latency_ms = (time.time() - t0) * 1000.0
                return self._normalize_response(raw_response, latency_ms)
            except AIProviderError:
                raise
            except Exception as e:
                last_error = e
                err_str = str(e).lower()

                # Check for retryable conditions
                if any(t in err_str for t in ["503", "429", "unavailable", "exhausted", "demand", "resource_exhausted"]):
                    logger.warning(
                        "Gemini generation attempt %d failed with retryable error (%s). Backing off...",
                        attempt + 1,
                        err_str[:120],
                    )
                    time.sleep(2 ** (attempt + 1))
                else:
                    # Non-retryable error
                    break

        # If loop exhausts, normalize and raise the final error
        latency_ms = (time.time() - t0) * 1000.0
        raise self._map_exception(last_error)

    def _build_prompt_payload(self, request: AIRequest) -> str:
        """Combine system instructions, history, and user prompt."""
        parts: List[str] = []
        if request.system_instruction:
            parts.append(request.system_instruction)

        if request.history:
            history_lines = []
            for turn in request.history[-10:]:
                role = "User" if turn.get("role") == "user" else "Assistant"
                content = turn.get("content", "")
                history_lines.append(f"{role}: {content}")
            if history_lines:
                parts.append("Recent Conversation:\n" + "\n".join(history_lines))

        parts.append(request.prompt)
        return "\n\n".join(parts)

    def _normalize_response(self, raw_response: Any, latency_ms: float) -> AIResponse:
        """Safely extract content, finish reason, and token usage from Gemini response."""
        content = ""
        try:
            if hasattr(raw_response, "text") and raw_response.text:
                content = raw_response.text.strip()
            elif hasattr(raw_response, "candidates") and raw_response.candidates:
                first_candidate = raw_response.candidates[0]
                if hasattr(first_candidate, "content") and hasattr(first_candidate.content, "parts"):
                    content = "".join(getattr(p, "text", "") for p in first_candidate.content.parts).strip()
        except Exception as e:
            logger.warning("Error reading text from Gemini response: %s", e)
            content = ""

        if not content:
            raise AIProviderResponseError(
                "Gemini returned an empty or blocked response.",
                provider="gemini",
            )

        # Extract usage metadata if present
        usage = None
        if hasattr(raw_response, "usage_metadata") and raw_response.usage_metadata:
            um = raw_response.usage_metadata
            usage = AIUsage(
                prompt_tokens=getattr(um, "prompt_token_count", None),
                completion_tokens=getattr(um, "candidates_token_count", None),
                total_tokens=getattr(um, "total_token_count", None),
            )

        finish_reason = None
        if hasattr(raw_response, "candidates") and raw_response.candidates:
            finish_reason = str(getattr(raw_response.candidates[0], "finish_reason", "STOP"))

        return AIResponse(
            content=content,
            model=self._model_name,
            usage=usage,
            finish_reason=finish_reason,
            latency_ms=round(latency_ms, 2),
            metadata={"provider": "gemini", "model": self._model_name},
        )

    def _map_exception(self, err: Optional[Exception]) -> AIProviderError:
        """Map raw SDK/HTTP exceptions to normalized AIProviderError hierarchy."""
        if err is None:
            return AIProviderError("Unknown generation error occurred.", provider="gemini")

        if isinstance(err, AIProviderError):
            return err

        err_str = str(err).lower()

        # Sanitize error message to prevent accidental key exposure
        safe_msg = str(err)
        if self._api_key and self._api_key in safe_msg:
            safe_msg = safe_msg.replace(self._api_key, "[REDACTED_API_KEY]")

        if any(t in err_str for t in ["401", "403", "api_key", "invalid api key", "unauthenticated", "permission_denied"]):
            return AIProviderAuthError(safe_msg, provider="gemini", original_error=err)
        if any(t in err_str for t in ["429", "quota", "exhausted", "rate_limit"]):
            return AIProviderRateLimitError(safe_msg, provider="gemini", original_error=err)
        if any(t in err_str for t in ["timeout", "timed out", "deadline"]):
            return AIProviderTimeoutError(safe_msg, provider="gemini", original_error=err)
        if any(t in err_str for t in ["503", "unavailable", "overloaded", "demand"]):
            return AIProviderUnavailableError(safe_msg, provider="gemini", original_error=err)

        return AIProviderError(safe_msg, provider="gemini", original_error=err)

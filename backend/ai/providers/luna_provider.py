"""
backend/ai/providers/luna_provider.py
====================================
GET Solar Energy — OpenAI Provider Adapter (Model: GPT-5.6 Luna)

Implements the BaseAIProvider interface for OpenAI endpoints with the official
model identifier 'gpt-5.6-luna'.
Normalizes request payloads (text-only and multimodal image+text), translates
OpenAI Chat Completions responses, maps errors into the standard AIProviderError
hierarchy, and extracts usage metadata.
Provides backward-compatible LunaProvider alias.
"""

import base64
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

DEFAULT_OPENAI_MODEL = "gpt-5.6-luna"
DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1"
DEFAULT_TIMEOUT_SECONDS = 30.0


class OpenAIProvider(BaseAIProvider):
    """
    Adapter for OpenAI models (including official model gpt-5.6-luna)
    conforming to the provider-neutral BaseAIProvider interface.

    Supports both text-only and multimodal (image + text) requests.
    Image inputs are encoded as base64 data URLs and submitted via the
    OpenAI Vision API message format.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: Optional[float] = None,
        client: Optional[Any] = None,
    ):
        self._api_key = (
            api_key
            or os.getenv("OPENAI_API_KEY")
            or os.getenv("LUNA_API_KEY")
        )
        self._model_name = (
            model_name
            or os.getenv("OPENAI_MODEL")
            or os.getenv("LUNA_MODEL")
            or DEFAULT_OPENAI_MODEL
        )
        self._base_url = (
            base_url
            or os.getenv("OPENAI_BASE_URL")
            or os.getenv("LUNA_API_BASE")
            or DEFAULT_OPENAI_BASE_URL
        )
        timeout_env = (
            os.getenv("OPENAI_TIMEOUT_SECONDS")
            or os.getenv("OPENAI_TIMEOUT")
            or os.getenv("LUNA_TIMEOUT_SECONDS")
        )
        self._timeout = timeout or (float(timeout_env) if timeout_env else DEFAULT_TIMEOUT_SECONDS)
        self._client = client
        logger.info("AI Provider initialized: OpenAIProvider (Model: %s)", self._model_name)

    def _get_client(self) -> Any:
        """Lazily initialize the OpenAI client."""
        if self._client is None:
            if not self._api_key:
                raise AIProviderAuthError(
                    "OPENAI_API_KEY or LUNA_API_KEY is not configured.",
                    provider="openai",
                )
            try:
                from openai import OpenAI
                client_kwargs: Dict[str, Any] = {
                    "api_key": self._api_key,
                    "timeout": self._timeout,
                }
                if self._base_url:
                    client_kwargs["base_url"] = self._base_url
                self._client = OpenAI(**client_kwargs)
            except ImportError as e:
                raise AIProviderError(
                    "The 'openai' Python package is required for OpenAIProvider. Install it via `pip install openai`.",
                    provider="openai",
                    original_error=e,
                )
            except Exception as e:
                raise self._map_exception(e)
        return self._client

    def get_model_name(self) -> str:
        """Return the active model identifier."""
        return self._model_name

    def get_base_url(self) -> str:
        """Return the active API base URL."""
        return self._base_url

    def generate_response(self, request: AIRequest) -> AIResponse:
        """
        Execute generation using the OpenAI Chat Completions API.

        Supports both text-only and multimodal (image + text) requests:
        - Text-only: standard Chat Completions with string content.
        - Multimodal: Vision API with base64-encoded image_url parts.

        Parameters
        ----------
        request : AIRequest
            Normalized request.  When request.is_multimodal is True,
            request.image_inputs contains image bytes and mime types.
        """
        client = self._get_client()
        messages = self._build_messages(request)

        kwargs: Dict[str, Any] = {
            "model": self._model_name,
            "messages": messages,
        }

        # Parameter normalization: gpt-5.6-luna and reasoning models reject custom
        # temperatures (HTTP 400 unsupported_value) and legacy max_tokens (HTTP 400 unsupported_parameter).
        is_luna_or_reasoning = self._model_name in ("gpt-5.6-luna",) or self._model_name.startswith(("o1", "o3", "o4"))
        if is_luna_or_reasoning:
            if request.temperature == 1.0:
                kwargs["temperature"] = 1.0
            # Use max_completion_tokens for gpt-5.6-luna
            if request.max_tokens is not None:
                kwargs["max_completion_tokens"] = request.max_tokens
        else:
            if request.temperature is not None:
                kwargs["temperature"] = request.temperature
            if request.max_tokens is not None:
                kwargs["max_tokens"] = request.max_tokens

        t0 = time.time()
        try:
            raw_response = client.chat.completions.create(**kwargs)
            latency_ms = (time.time() - t0) * 1000.0
            return self._normalize_response(raw_response, latency_ms)
        except AIProviderError:
            raise
        except Exception as e:
            raise self._map_exception(e)

    # ─── Message Builders ─────────────────────────────────────────────────────

    def _build_messages(self, request: AIRequest) -> List[Dict[str, Any]]:
        """
        Translate normalized AIRequest into OpenAI Chat Completion messages.

        For text-only requests the content field is a plain string.
        For multimodal requests the user message content is a list of parts
        following the OpenAI Vision API format:
          - image_url parts (base64 data URL) for each AIImageInput
          - a text part for the prompt text
        """
        messages: List[Dict[str, Any]] = []

        if request.system_instruction:
            messages.append({"role": "system", "content": request.system_instruction})

        for turn in request.history[-10:]:
            role = turn.get("role", "user")
            if role not in ("user", "assistant", "system"):
                role = "user"
            messages.append({"role": role, "content": turn.get("content", "")})

        if request.is_multimodal:
            # Build a Vision API user message with image(s) + text
            content_parts: List[Dict[str, Any]] = []
            for img in request.image_inputs:
                b64 = base64.b64encode(img.data).decode("utf-8")
                content_parts.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{img.mime_type};base64,{b64}",
                        "detail": "high",
                    },
                })
            content_parts.append({"type": "text", "text": request.prompt})
            messages.append({"role": "user", "content": content_parts})
        else:
            messages.append({"role": "user", "content": request.prompt})

        return messages

    # ─── Response Normalization ───────────────────────────────────────────────

    def _normalize_response(self, raw_response: Any, latency_ms: float) -> AIResponse:
        """Safely extract text, finish reason, and token usage from OpenAI response."""
        content = ""
        finish_reason = None

        if hasattr(raw_response, "choices") and raw_response.choices:
            choice = raw_response.choices[0]
            if hasattr(choice, "message") and hasattr(choice.message, "content"):
                content = (choice.message.content or "").strip()
            finish_reason = getattr(choice, "finish_reason", "stop")

        if not content:
            raise AIProviderResponseError(
                "OpenAI returned an empty or malformed response.",
                provider="openai",
            )

        usage = None
        if hasattr(raw_response, "usage") and raw_response.usage:
            u = raw_response.usage
            usage = AIUsage(
                prompt_tokens=getattr(u, "prompt_tokens", None),
                completion_tokens=getattr(u, "completion_tokens", None),
                total_tokens=getattr(u, "total_tokens", None),
            )

        model = getattr(raw_response, "model", self._model_name)

        return AIResponse(
            content=content,
            model=model,
            usage=usage,
            finish_reason=str(finish_reason).upper() if finish_reason else "STOP",
            latency_ms=round(latency_ms, 2),
            metadata={"provider": "openai", "model": self._model_name},
        )

    # ─── Exception Mapping ────────────────────────────────────────────────────

    def _map_exception(self, err: Optional[Exception]) -> AIProviderError:
        """Map raw SDK/HTTP exceptions to normalized AIProviderError hierarchy."""
        if err is None:
            return AIProviderError("Unknown generation error occurred.", provider="openai")

        if isinstance(err, AIProviderError):
            return err

        err_str = str(err).lower()

        # Redact API key if present in error message
        safe_msg = str(err)
        if self._api_key and self._api_key in safe_msg:
            safe_msg = safe_msg.replace(self._api_key, "[REDACTED_API_KEY]")

        # Error class detection by name or message
        err_type_name = type(err).__name__.lower()

        if (
            "authenticationerror" in err_type_name
            or any(t in err_str for t in ["401", "invalid_api_key", "incorrect api key", "unauthorized", "auth"])
        ):
            return AIProviderAuthError(safe_msg, provider="openai", original_error=err)

        if (
            "ratelimiterror" in err_type_name
            or any(t in err_str for t in ["429", "quota", "rate_limit", "exceeded your current quota", "tokens per min"])
        ):
            return AIProviderRateLimitError(safe_msg, provider="openai", original_error=err)

        if (
            "apitimeouterror" in err_type_name
            or "timeouterror" in err_type_name
            or any(t in err_str for t in ["timeout", "timed out", "deadline"])
        ):
            return AIProviderTimeoutError(safe_msg, provider="openai", original_error=err)

        if (
            "internalservererror" in err_type_name
            or "apiconnectionerror" in err_type_name
            or any(t in err_str for t in ["500", "502", "503", "504", "unavailable", "server error", "connection error"])
        ):
            return AIProviderUnavailableError(safe_msg, provider="openai", original_error=err)

        return AIProviderError(safe_msg, provider="openai", original_error=err)


# Backward-compatible alias for existing code
LunaProvider = OpenAIProvider

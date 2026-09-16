"""
backend/ai/provider_base.py
===========================
GET Solar Energy — Provider-Neutral AI Abstraction Base
Phase 1: AI Provider Abstraction Foundation

Defines the normalized request/response contracts, usage tracking,
error hierarchy, and abstract provider interface.
Decouples the Enterprise AI Assistant from specific LLM SDKs (e.g. OpenAI Luna).
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


# ─── Data Contracts ───────────────────────────────────────────────────────────

@dataclass
class AIUsage:
    """Normalized token / character usage metadata."""
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    total_tokens: Optional[int] = None


@dataclass
class AIImageInput:
    """
    A single image input for multimodal AI requests.

    Attributes
    ----------
    data : bytes
        Raw image bytes.
    mime_type : str
        MIME type of the image (e.g. "image/jpeg", "image/png", "image/webp",
        "application/pdf").
    """
    data: bytes
    mime_type: str = "image/jpeg"


@dataclass
class AIRequest:
    """
    Normalized AI generation request payload.

    Fields
    ------
    prompt : str
        User-facing text prompt.
    system_instruction : str | None
        Optional system-level instruction prepended to the conversation.
    history : list[dict]
        Prior conversation turns, each with keys 'role' and 'content'.
    temperature : float
        Sampling temperature (default 0.2).
    max_tokens : int | None
        Optional hard limit on generated tokens.
    metadata : dict
        Arbitrary caller metadata forwarded transparently.
    image_inputs : list[AIImageInput]
        Optional image(s) for multimodal requests.  Empty list means text-only.
        Backward-compatible: defaults to empty list so all existing callers
        continue to work without modification.
    """
    prompt: str
    system_instruction: Optional[str] = None
    history: List[Dict[str, str]] = field(default_factory=list)
    temperature: float = 0.2
    max_tokens: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    image_inputs: List[AIImageInput] = field(default_factory=list)

    @property
    def is_multimodal(self) -> bool:
        """True when the request contains at least one image input."""
        return bool(self.image_inputs)


@dataclass
class AIResponse:
    """Normalized AI generation response payload."""
    content: str
    model: str
    usage: Optional[AIUsage] = None
    finish_reason: Optional[str] = None
    latency_ms: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


# ─── Error Hierarchy ──────────────────────────────────────────────────────────

class AIProviderError(Exception):
    """Base exception for all provider-normalized AI errors."""
    def __init__(self, message: str, provider: str = "unknown", original_error: Optional[Exception] = None):
        super().__init__(message)
        self.message = message
        self.provider = provider
        self.original_error = original_error

    def __str__(self) -> str:
        return f"[{self.provider}] {self.message}"


class AIProviderAuthError(AIProviderError):
    """Raised when provider authentication (API key, token) fails."""
    pass


class AIProviderRateLimitError(AIProviderError):
    """Raised when provider rate limits or quotas are exceeded."""
    pass


class AIProviderTimeoutError(AIProviderError):
    """Raised when a generation request times out."""
    pass


class AIProviderUnavailableError(AIProviderError):
    """Raised when the provider service is unavailable (e.g., 503, overload)."""
    pass


class AIProviderResponseError(AIProviderError):
    """Raised when the provider returns a malformed or blocked response."""
    pass


# ─── Abstract Provider Interface ──────────────────────────────────────────────

class BaseAIProvider(ABC):
    """Abstract base class for all AI LLM providers."""

    @abstractmethod
    def generate_response(self, request: AIRequest) -> AIResponse:
        """
        Generate a text response given a normalized AIRequest.

        Parameters
        ----------
        request : AIRequest
            Normalized request payload containing prompt, history, and config.
            When request.is_multimodal is True, image_inputs contains image data
            for vision-capable providers.

        Returns
        -------
        AIResponse
            Normalized response payload containing content, model, and metadata.

        Raises
        ------
        AIProviderError
            Normalized provider exception on failure.
        """
        pass

    @abstractmethod
    def get_model_name(self) -> str:
        """Return the active model identifier for this provider."""
        pass

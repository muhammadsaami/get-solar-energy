"""
backend/ai/provider_factory.py
==============================
GET Solar Energy — AI Provider Factory & Selector
OpenAI-First Production Architecture

Provides centralized provider selection based on configuration and eligibility.
Supports lazy initialization, environment overrides, fallback orchestration, and test mocking.

Production default: OpenAI GPT-5.6 Luna (AI_PROVIDER=openai or unset / auto).
No Gemini runtime fallback when AI_PROVIDER=openai or when unset.

Registered providers: OpenAI Luna (production default), Mock (offline tests), Gemini (explicit selection only).
"""

import os
import logging
from typing import Any, Dict, Optional

from .provider_base import BaseAIProvider, AIProviderError
from .providers.gemini_provider import GeminiProvider
from .providers.mock_provider import MockAIProvider
from .providers.luna_provider import OpenAIProvider, LunaProvider
from .provider_selector import (
    ProviderSelector,
    ProviderConfig,
    AIProviderConfigError,
    EligibilityResult,
    FallbackProviderWrapper,
)

logger = logging.getLogger(__name__)

# Active singleton provider cache
_current_provider: Optional[BaseAIProvider] = None


def get_ai_provider(provider_name: Optional[str] = None) -> BaseAIProvider:
    """
    Return the active BaseAIProvider instance.

    Parameters
    ----------
    provider_name : str | None
        Optional explicit provider name. If None, resolves via provider selector
        using AI_PROVIDER environment variable.
        - AI_PROVIDER unset → OpenAIProvider (production default)
        - AI_PROVIDER=openai → OpenAIProvider
        - AI_PROVIDER=auto → ProviderSelector (OpenAI first)
        - AI_PROVIDER=mock → MockAIProvider (offline tests)
        - AI_PROVIDER=gemini → GeminiProvider (explicit only, not a production default)

    Returns
    -------
    BaseAIProvider
        Configured provider instance.

    Raises
    ------
    AIProviderError
        If an unsupported provider name is specified.
    """
    global _current_provider

    if _current_provider is not None and provider_name is None:
        return _current_provider

    provider: BaseAIProvider

    if provider_name is not None:
        name = provider_name.strip().lower()
        if name in ("gemini", "google", "google-genai"):
            provider = GeminiProvider()
            logger.info("AI Provider initialized: GeminiProvider (model=%s)", provider.get_model_name())
        elif name in ("mock", "test", "dummy"):
            provider = MockAIProvider()
            logger.info("AI Provider initialized: MockAIProvider (model=%s)", provider.get_model_name())
        elif name in ("luna", "openai", "openai_luna"):
            provider = OpenAIProvider()
            logger.info("AI Provider initialized: OpenAIProvider (model=%s)", provider.get_model_name())
        else:
            supported = "auto, gemini, mock, luna, openai, openai_luna"
            raise AIProviderError(
                f"Unsupported AI provider '{name}'. Supported providers: {supported}.",
                provider=name,
            )
        return provider

    # Resolve active provider when provider_name is None
    env_provider = os.getenv("AI_PROVIDER", "").strip().lower()

    if env_provider in ("", "openai", "luna", "openai_luna"):
        # Production default: OpenAI is always used when unset or explicitly configured
        provider = OpenAIProvider()
        logger.info(
            "AI Provider initialized: OpenAIProvider [production default] (model=%s)",
            provider.get_model_name(),
        )
    elif env_provider == "auto":
        provider = ProviderSelector.select_provider(fallback_to_default=True)
        logger.info(
            "AI Provider initialized: %s via ProviderSelector (model=%s)",
            provider.__class__.__name__,
            provider.get_model_name(),
        )
    elif env_provider in ("gemini", "google", "google-genai"):
        provider = GeminiProvider()
        logger.info("AI Provider initialized: GeminiProvider (model=%s)", provider.get_model_name())
    elif env_provider in ("mock", "test", "dummy"):
        provider = MockAIProvider()
        logger.info("AI Provider initialized: MockAIProvider (model=%s)", provider.get_model_name())
    else:
        supported = "auto, gemini, mock, luna, openai, openai_luna"
        raise AIProviderError(
            f"Unsupported AI provider '{env_provider}'. Supported providers: {supported}.",
            provider=env_provider,
        )

    _current_provider = provider
    return provider


def get_selected_provider(
    env: Optional[Dict[str, str]] = None,
    strict: bool = True,
) -> BaseAIProvider:
    """
    Return the active provider strictly validating eligibility and priority.
    """
    return ProviderSelector.select_provider(env=env, fallback_to_default=not strict)


def get_provider_status(env: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Return safe provider status metadata with zero credentials or authorization headers.
    """
    return ProviderSelector.get_provider_status(env=env)


def set_ai_provider(provider: Optional[BaseAIProvider]) -> None:
    """Explicitly set or clear the active provider instance (primarily for tests)."""
    global _current_provider
    _current_provider = provider

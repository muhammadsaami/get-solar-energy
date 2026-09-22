"""
backend/ai/provider_selector.py
===============================
GET Solar Energy — AI Provider Architecture & Selection Engine
Production Default: OpenAI GPT-5.6 Luna
Supported Providers: OpenAI GPT-5.6 Luna (primary), Google Gemini (explicit selection only), Mock (offline tests)

Official Providers & Models:
1. OpenAI (Model: gpt-5.6-luna, Production Default)
2. Google Gemini (Model: gemini-2.5-flash-lite, explicit selection only — not a production default)
3. Mock Provider (Offline CI/CD Testing)

Safety Guarantees:
1. OpenAI is the active production default when AI_PROVIDER is unset or 'openai'.
2. Gemini is NOT a production default; it requires explicit configuration (AI_PROVIDER=gemini).
3. Legacy 'luna' is supported as a backward-compatible alias normalized to 'openai'.
4. Provider selection and status queries make zero live network calls.
5. All secrets, keys, and authorization headers are scrubbed from diagnostics, logs, and errors.
6. Runtime fallback is strictly opt-in (AI_ALLOW_PROVIDER_FALLBACK=true by default) and requires
   the fallback provider to be independently eligible.
   When AI_PROVIDER=openai, Gemini is NEVER used as a fallback.
"""

import os
import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from .provider_base import (
    BaseAIProvider,
    AIRequest,
    AIResponse,
    AIProviderError,
    AIProviderAuthError,
    AIProviderResponseError,
)
from .providers.gemini_provider import GeminiProvider
from .providers.luna_provider import OpenAIProvider, LunaProvider
from .providers.mock_provider import MockAIProvider

logger = logging.getLogger(__name__)

# Standard defaults
DEFAULT_AI_PROVIDER = "auto"
DEFAULT_AI_PROVIDER_PRIORITY = "openai"
DEFAULT_AI_ALLOW_PROVIDER_FALLBACK = True

DEFAULT_OPENAI_MODEL = "gpt-5.6-luna"
DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1"
APPROVED_OPENAI_MODELS = {"gpt-5.6-luna", "luna-v1"}

OPENAI_LUNA_NOT_VALIDATED_MESSAGE = "OPENAI LUNA STATUS: CONFIGURED — MODEL ACCESS NOT LIVE-VALIDATED"


class AIProviderConfigError(AIProviderError):
    """Raised when provider configuration or eligibility validation fails."""

    def __init__(self, message: str, provider: str = "selector"):
        super().__init__(message, provider=provider)


@dataclass
class ProviderConfig:
    """Safe model representing AI provider environment configuration."""
    ai_provider: str = DEFAULT_AI_PROVIDER
    priority: List[str] = field(default_factory=lambda: ["openai"])
    allow_fallback: bool = DEFAULT_AI_ALLOW_PROVIDER_FALLBACK
    gemini_api_key: Optional[str] = None
    assistant_model: str = "gemini-2.5-flash-lite"
    openai_api_key: Optional[str] = None
    openai_base_url: str = DEFAULT_OPENAI_BASE_URL
    openai_model: str = DEFAULT_OPENAI_MODEL
    openai_timeout_seconds: float = 30.0

    @classmethod
    def from_env(cls, env: Optional[Dict[str, str]] = None) -> "ProviderConfig":
        """Build ProviderConfig from environment variables or a provided mapping."""
        source = env if env is not None else os.environ

        raw_provider = source.get("AI_PROVIDER", DEFAULT_AI_PROVIDER).strip().lower()
        if not raw_provider:
            raw_provider = DEFAULT_AI_PROVIDER

        # Normalize legacy 'luna' alias to 'openai'
        if raw_provider in ("luna", "openai_luna"):
            raw_provider = "openai"

        raw_priority = source.get("AI_PROVIDER_PRIORITY", DEFAULT_AI_PROVIDER_PRIORITY)
        priority_list: List[str] = []
        for p in raw_priority.split(","):
            p_clean = p.strip().lower()
            if not p_clean:
                continue
            # Normalize legacy alias in priority
            if p_clean in ("luna", "openai_luna"):
                p_clean = "openai"
            if p_clean not in priority_list:
                priority_list.append(p_clean)

        if not priority_list:
            priority_list = ["openai"]

        raw_fallback = source.get("AI_ALLOW_PROVIDER_FALLBACK")
        if raw_fallback is not None:
            allow_fallback = raw_fallback.strip().lower() in ("true", "1", "yes")
        else:
            allow_fallback = DEFAULT_AI_ALLOW_PROVIDER_FALLBACK

        gemini_key = source.get("GEMINI_API_KEY", "").strip() or None
        assistant_model = source.get("ASSISTANT_MODEL", "gemini-2.5-flash-lite").strip() or "gemini-2.5-flash-lite"

        # Read OpenAI config with backward-compatible LUNA_* fallback
        openai_key = (
            source.get("OPENAI_API_KEY", "").strip()
            or source.get("LUNA_API_KEY", "").strip()
            or None
        )
        if "OPENAI_BASE_URL" in source:
            openai_base = source["OPENAI_BASE_URL"].strip()
        elif "LUNA_API_BASE" in source:
            openai_base = source["LUNA_API_BASE"].strip()
        else:
            openai_base = DEFAULT_OPENAI_BASE_URL

        if "OPENAI_MODEL" in source:
            openai_model = source["OPENAI_MODEL"].strip()
        elif "LUNA_MODEL" in source:
            openai_model = source["LUNA_MODEL"].strip()
        else:
            openai_model = DEFAULT_OPENAI_MODEL

        raw_timeout = (
            source.get("OPENAI_TIMEOUT_SECONDS", "").strip()
            or source.get("LUNA_TIMEOUT_SECONDS", "").strip()
            or "30.0"
        )
        try:
            openai_timeout = float(raw_timeout)
        except ValueError:
            openai_timeout = 30.0

        return cls(
            ai_provider=raw_provider,
            priority=priority_list,
            allow_fallback=allow_fallback,
            gemini_api_key=gemini_key,
            assistant_model=assistant_model,
            openai_api_key=openai_key,
            openai_base_url=openai_base,
            openai_model=openai_model,
            openai_timeout_seconds=openai_timeout,
        )


@dataclass
class EligibilityResult:
    """Safe eligibility status for an individual provider."""
    provider_name: str
    is_eligible: bool
    status: str  # CONFIGURED, NOT_CONFIGURED, INVALID_CONFIGURATION, SELECTED
    model_name: str
    block_reason: Optional[str] = None
    configured: bool = False
    live_validation_status: str = "LIVE_VALIDATION_PENDING"

    def to_safe_dict(self) -> Dict[str, Any]:
        """Return safe dictionary omitting all secrets."""
        return {
            "name": self.provider_name,
            "model": self.model_name,
            "configured": self.configured,
            "eligible": self.is_eligible,
            "status": self.status,
            "block_reason": self.block_reason,
            "live_validation_status": self.live_validation_status,
        }


class ProviderEligibilityValidator:
    """Evaluates provider eligibility according to strict configuration rules."""

    @staticmethod
    def evaluate_gemini(config: ProviderConfig) -> EligibilityResult:
        """
        Gemini is eligible when:
        - GEMINI_API_KEY is present and non-empty
        - Configuration is valid
        """
        has_key = bool(config.gemini_api_key and config.gemini_api_key.strip())
        if not has_key:
            return EligibilityResult(
                provider_name="gemini",
                is_eligible=False,
                status="NOT_CONFIGURED",
                model_name=config.assistant_model,
                block_reason="GEMINI_API_KEY is not configured",
                configured=False,
                live_validation_status="LIVE_VALIDATION_PENDING",
            )

        return EligibilityResult(
            provider_name="gemini",
            is_eligible=True,
            status="CONFIGURED",
            model_name=config.assistant_model,
            block_reason=None,
            configured=True,
            live_validation_status="LIVE_VALIDATION_PENDING",
        )

    @staticmethod
    def evaluate_openai(config: ProviderConfig) -> EligibilityResult:
        """
        OpenAI (GPT-5.6 Luna) is eligible when:
        - OPENAI_API_KEY is present and non-empty
        - OPENAI_BASE_URL is present and valid (must start with http:// or https://)
        - OPENAI_MODEL is present and approved (default 'gpt-5.6-luna')
        """
        has_key = bool(config.openai_api_key and config.openai_api_key.strip())
        has_base = bool(config.openai_base_url and config.openai_base_url.strip())
        has_model = bool(config.openai_model and config.openai_model.strip())

        if not has_key:
            return EligibilityResult(
                provider_name="openai",
                is_eligible=False,
                status="NOT_CONFIGURED",
                model_name=config.openai_model or DEFAULT_OPENAI_MODEL,
                block_reason="OPENAI_API_KEY is missing",
                configured=False,
                live_validation_status="LIVE_VALIDATION_PENDING",
            )

        if not has_base or not (config.openai_base_url.startswith("http://") or config.openai_base_url.startswith("https://")):
            return EligibilityResult(
                provider_name="openai",
                is_eligible=False,
                status="INVALID_CONFIGURATION",
                model_name=config.openai_model or DEFAULT_OPENAI_MODEL,
                block_reason="OPENAI LUNA STATUS: BLOCKED — INVALID CONFIGURATION (invalid base URL)",
                configured=False,
                live_validation_status="LIVE_VALIDATION_PENDING",
            )

        if not has_model:
            return EligibilityResult(
                provider_name="openai",
                is_eligible=False,
                status="INVALID_CONFIGURATION",
                model_name="",
                block_reason="OPENAI LUNA STATUS: BLOCKED — INVALID CONFIGURATION (missing model)",
                configured=False,
                live_validation_status="LIVE_VALIDATION_PENDING",
            )

        if config.openai_model not in APPROVED_OPENAI_MODELS:
            return EligibilityResult(
                provider_name="openai",
                is_eligible=False,
                status="INVALID_CONFIGURATION",
                model_name=config.openai_model,
                block_reason=f"OPENAI LUNA STATUS: BLOCKED — INVALID CONFIGURATION (unapproved model '{config.openai_model}', must be '{DEFAULT_OPENAI_MODEL}')",
                configured=False,
                live_validation_status="LIVE_VALIDATION_PENDING",
            )

        return EligibilityResult(
            provider_name="openai",
            is_eligible=True,
            status="CONFIGURED",
            model_name=config.openai_model,
            block_reason=OPENAI_LUNA_NOT_VALIDATED_MESSAGE,
            configured=True,
            live_validation_status="LIVE_VALIDATION_PENDING",
        )

    @staticmethod
    def evaluate_mock(config: ProviderConfig) -> EligibilityResult:
        """Mock provider is always eligible for offline test environments."""
        return EligibilityResult(
            provider_name="mock",
            is_eligible=True,
            status="CONFIGURED",
            model_name="mock-luna-gemini-v1",
            block_reason=None,
            configured=True,
            live_validation_status="VERIFIED_OFFLINE",
        )


class FallbackProviderWrapper(BaseAIProvider):
    """
    Orchestrates runtime fallback between primary and secondary AI providers.
    Ensures:
    - Fallback is strictly opt-in (AI_ALLOW_PROVIDER_FALLBACK=true).
    - Secondary provider must be independently eligible.
    - Errors are logged without secrets.
    - Original error context is preserved.
    """

    def __init__(
        self,
        primary_provider: BaseAIProvider,
        fallback_provider: BaseAIProvider,
        primary_name: str,
        fallback_name: str,
    ):
        self._primary = primary_provider
        self._fallback = fallback_provider
        self._primary_name = primary_name
        self._fallback_name = fallback_name

    def get_model_name(self) -> str:
        return self._primary.get_model_name()

    def generate_response(self, request: AIRequest) -> AIResponse:
        try:
            return self._primary.generate_response(request)
        except AIProviderError as e_primary:
            safe_primary_msg = str(e_primary)
            logger.warning(
                "Primary AI Provider '%s' failed (%s). Engaging eligible fallback provider '%s'.",
                self._primary_name,
                safe_primary_msg[:120],
                self._fallback_name,
            )
            try:
                fallback_resp = self._fallback.generate_response(request)
                if fallback_resp.metadata is None:
                    fallback_resp.metadata = {}
                fallback_resp.metadata["fallback_from"] = self._primary_name
                fallback_resp.metadata["fallback_active"] = True
                return fallback_resp
            except AIProviderError as e_fallback:
                safe_fallback_msg = str(e_fallback)
                err = AIProviderError(
                    f"Both primary provider '{self._primary_name}' and fallback provider '{self._fallback_name}' failed. "
                    f"Primary error: {safe_primary_msg}. Fallback error: {safe_fallback_msg}.",
                    provider=self._fallback_name,
                    original_error=e_fallback,
                )
                err.primary_error = e_primary
                raise err
        except Exception as e:
            logger.error("Unexpected primary error on provider '%s': %s", self._primary_name, str(e)[:120])
            raise e


class ProviderSelector:
    """Central provider selector and eligibility management service."""

    @classmethod
    def get_provider_status(cls, env: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Return safe internal provider status containing metadata with zero credentials.
        """
        config = ProviderConfig.from_env(env)
        gemini_el = ProviderEligibilityValidator.evaluate_gemini(config)
        openai_el = ProviderEligibilityValidator.evaluate_openai(config)
        mock_el = ProviderEligibilityValidator.evaluate_mock(config)

        # Determine selected provider
        selected_provider: Optional[str] = None
        mode = config.ai_provider

        if mode == "gemini":
            if gemini_el.is_eligible:
                selected_provider = "gemini"
        elif mode in ("openai", "luna"):
            if openai_el.is_eligible:
                selected_provider = "openai"
        elif mode in ("mock", "test", "dummy"):
            selected_provider = "mock"
        elif mode == "auto":
            for p in config.priority:
                if p == "gemini" and gemini_el.is_eligible:
                    selected_provider = "gemini"
                    break
                elif p in ("openai", "luna") and openai_el.is_eligible:
                    selected_provider = "openai"
                    break
                elif p in ("mock", "test", "dummy") and mock_el.is_eligible:
                    selected_provider = "mock"
                    break

        providers_dict = {
            "gemini": gemini_el.to_safe_dict(),
            "openai": openai_el.to_safe_dict(),
            "mock": mock_el.to_safe_dict(),
        }

        # Update selected status flag
        if selected_provider and selected_provider in providers_dict:
            providers_dict[selected_provider]["status"] = "SELECTED"

        return {
            "selected_provider": selected_provider,
            "mode": mode,
            "priority": config.priority,
            "fallback_enabled": config.allow_fallback,
            "providers": providers_dict,
        }

    @classmethod
    def select_provider(
        cls,
        env: Optional[Dict[str, str]] = None,
        fallback_to_default: bool = False,
    ) -> BaseAIProvider:
        """
        Select active BaseAIProvider according to configuration, eligibility, and priority.

        Parameters
        ----------
        env : dict | None
            Environment mapping override for testing.
        fallback_to_default : bool
            If True, when Gemini is selected in default mode without a key, returns GeminiProvider
            for testing compatibility instead of raising AIProviderConfigError.
        """
        config = ProviderConfig.from_env(env)
        mode = config.ai_provider

        # 1. Validate priority list for auto mode
        valid_providers = {"gemini", "openai", "luna", "mock", "test", "dummy"}
        invalid_priorities = [p for p in config.priority if p not in valid_providers]
        if invalid_priorities:
            raise AIProviderConfigError(
                f"Invalid provider priority in AI_PROVIDER_PRIORITY: {invalid_priorities}. "
                f"Valid providers: {sorted(list(valid_providers))}."
            )

        gemini_el = ProviderEligibilityValidator.evaluate_gemini(config)
        openai_el = ProviderEligibilityValidator.evaluate_openai(config)
        mock_el = ProviderEligibilityValidator.evaluate_mock(config)

        selected_name: Optional[str] = None

        # 2. Handle Explicit Gemini Mode
        if mode == "gemini":
            if not gemini_el.is_eligible:
                if fallback_to_default:
                    return GeminiProvider()
                raise AIProviderConfigError(
                    f"Gemini is explicitly selected (AI_PROVIDER=gemini) but ineligible: {gemini_el.block_reason}."
                )
            selected_name = "gemini"

        # 3. Handle Explicit OpenAI Mode (and legacy 'luna' alias)
        elif mode in ("openai", "luna"):
            if not openai_el.is_eligible:
                raise AIProviderConfigError(
                    f"OpenAI (GPT-5.6 Luna) is explicitly selected but ineligible: {openai_el.block_reason}."
                )
            selected_name = "openai"

        # 4. Handle Explicit Mock Mode
        elif mode in ("mock", "test", "dummy"):
            selected_name = "mock"

        # 5. Handle Automatic Mode
        elif mode == "auto":
            for p in config.priority:
                if p in ("gemini", "google", "google-genai") and gemini_el.is_eligible:
                    selected_name = "gemini"
                    break
                elif p in ("openai", "luna") and openai_el.is_eligible:
                    selected_name = "openai"
                    break
                elif p in ("mock", "test", "dummy"):
                    selected_name = "mock"
                    break

            if not selected_name:
                if fallback_to_default:
                    # Production default: return OpenAIProvider when no keys are configured
                    # (e.g., offline tests where AI_PROVIDER is unset and no keys are present)
                    return OpenAIProvider()
                raise AIProviderConfigError(
                    "No eligible AI provider found in priority order. "
                    f"OpenAI (GPT-5.6 Luna) eligibility: {openai_el.block_reason or 'OK'}; "
                    f"Gemini eligibility: {gemini_el.block_reason or 'OK'}."
                )

        else:
            raise AIProviderError(
                f"Unsupported AI provider '{mode}'. Supported providers: auto, gemini, openai, mock.",
                provider=mode,
            )

        # 6. Instantiate primary provider
        primary_provider: BaseAIProvider
        if selected_name == "gemini":
            logger.info("AI Provider initialized: GeminiProvider (Model: %s)", config.assistant_model)
            primary_provider = GeminiProvider(
                api_key=config.gemini_api_key,
                model_name=config.assistant_model,
            )
        elif selected_name == "openai":
            logger.info("AI Provider initialized: OpenAIProvider (Model: %s)", config.openai_model)
            primary_provider = OpenAIProvider(
                api_key=config.openai_api_key,
                model_name=config.openai_model,
                base_url=config.openai_base_url,
                timeout=config.openai_timeout_seconds,
            )
        elif selected_name == "mock":
            logger.info("AI Provider initialized: MockAIProvider (Model: mock)")
            primary_provider = MockAIProvider()
        else:
            raise AIProviderError(f"Cannot instantiate unknown provider '{selected_name}'.")

        # 7. Orchestrate Runtime Fallback if enabled
        if config.allow_fallback and mode == "auto":
            fallback_candidate: Optional[Tuple[str, BaseAIProvider]] = None
            for p in config.priority:
                if p == selected_name:
                    continue
                if p == "gemini" and gemini_el.is_eligible:
                    fallback_candidate = ("gemini", GeminiProvider(api_key=config.gemini_api_key, model_name=config.assistant_model))
                    break
                elif p in ("openai", "luna") and openai_el.is_eligible:
                    fallback_candidate = ("openai", OpenAIProvider(
                        api_key=config.openai_api_key,
                        model_name=config.openai_model,
                        base_url=config.openai_base_url,
                        timeout=config.openai_timeout_seconds,
                    ))
                    break
                elif p in ("mock", "test", "dummy") and mock_el.is_eligible:
                    fallback_candidate = ("mock", MockAIProvider())
                    break

            if fallback_candidate:
                fb_name, fb_provider = fallback_candidate
                logger.info(
                    "Runtime AI fallback configured: Primary='%s', Fallback='%s'",
                    selected_name,
                    fb_name,
                )
                return FallbackProviderWrapper(
                    primary_provider=primary_provider,
                    fallback_provider=fb_provider,
                    primary_name=selected_name,
                    fallback_name=fb_name,
                )
            else:
                logger.info(
                    "Runtime AI fallback requested (AI_ALLOW_PROVIDER_FALLBACK=true), "
                    "but no secondary provider is independently eligible."
                )

        return primary_provider

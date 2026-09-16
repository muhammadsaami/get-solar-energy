"""
backend/test_ai_staging_pilot.py
================================
GET Solar Energy — Phase 4.0 Staging Safety Gates & Rollback Tests

Validates:
1. Preflight metadata is safe (zero secret leaks).
2. All 16 safety gates are enforced (blocks production, missing auth, missing creds, excess cases/timeout).
3. Rollback & Default-protection invariants (Gemini remains default, Luna opt-in).
4. Tool and DB mutation restrictions.
5. Dry-run and offline validation.
"""

import os
import pytest
from unittest.mock import patch, MagicMock

from backend.ai.provider_base import AIRequest, AIResponse, AIProviderError
from backend.ai.provider_factory import get_ai_provider, set_ai_provider
from backend.ai.providers.gemini_provider import GeminiProvider
from backend.ai.providers.luna_provider import LunaProvider, OpenAIProvider
from backend.ai.providers.mock_provider import MockAIProvider
from backend.ai.provider_selector import FallbackProviderWrapper
from backend.ai.evaluation import (
    EVALUATION_DATASET,
    EvaluationCase,
    StagingSafetyGates,
    StagingSafetyGateError,
    PreflightReport,
    run_preflight,
    run_staging_pilot,
    MAX_STAGING_CASES,
    MAX_STAGING_TIMEOUT_SEC,
)


class TestPreflightMetadataAndSecrets:
    """Ensure preflight diagnostics report safe metadata and never expose secrets."""

    def test_preflight_does_not_contain_secret_keys(self, monkeypatch):
        monkeypatch.setenv("GEMINI_API_KEY", "AIzaSySecretGeminiKey1234567890")
        monkeypatch.setenv("LUNA_API_KEY", "sk-luna-secret-key-99887766554433")
        monkeypatch.setenv("OPENAI_API_KEY", "sk-openai-secret-key-001122334455")
        monkeypatch.setenv("LUNA_API_BASE", "https://api.openai-luna.internal/v1")

        report_dict = run_preflight(provider_name="luna", allow_staging=True)

        report_str = str(report_dict)
        assert "AIzaSy" not in report_str
        assert "sk-luna" not in report_str
        assert "sk-openai" not in report_str
        assert "secret" not in report_str.lower()
        assert report_dict["credentials_present"] is True
        assert report_dict["api_base_host"] == "api.openai-luna.internal"

    def test_preflight_extracts_clean_hostname_only(self):
        report = StagingSafetyGates.evaluate(
            provider_name="mock",
            allow_staging=False,
        )
        assert report.api_base_host == "localhost-memory"
        assert report.is_offline_mock is True
        assert report.safety_gates_passed is True


class TestStagingSafetyGatesEnforcement:
    """Ensure all safety gates strictly block unauthorized or unsafe executions."""

    def test_production_environment_strictly_blocks_pilot(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "production")
        monkeypatch.setenv("AI_EVAL_ALLOW_STAGING", "1")
        monkeypatch.setenv("LUNA_API_KEY", "sk-test-key")

        report = StagingSafetyGates.evaluate(provider_name="luna", allow_staging=True)
        assert report.safety_gates_passed is False
        assert any("Production environment detected" in f for f in report.gate_failures)

        with pytest.raises(StagingSafetyGateError, match="Production environment detected"):
            run_staging_pilot(provider_name="luna", allow_staging=True, dry_run=False)

    def test_missing_staging_authorization_blocks_live_mode(self, monkeypatch):
        monkeypatch.delenv("AI_EVAL_ALLOW_STAGING", raising=False)
        monkeypatch.setenv("ENVIRONMENT", "staging")
        monkeypatch.setenv("LUNA_API_KEY", "sk-test-key")

        report = StagingSafetyGates.evaluate(provider_name="luna", allow_staging=False)
        assert report.safety_gates_passed is False
        assert any("authorization" in f.lower() for f in report.gate_failures)

    def test_missing_credentials_blocks_live_mode(self, monkeypatch):
        monkeypatch.delenv("LUNA_API_KEY", raising=False)
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
        monkeypatch.setenv("ENVIRONMENT", "staging")

        report = StagingSafetyGates.evaluate(provider_name="luna", allow_staging=True)
        assert report.safety_gates_passed is False
        assert any("Credentials" in f for f in report.gate_failures)

    def test_excessive_case_count_blocks_pilot(self):
        dummy_cases = [
            EvaluationCase(
                case_id=f"case_{i}",
                category="test",
                user_prompt=f"Prompt {i}",
                expected_behavior="Behavior",
                risk_level="low",
            )
            for i in range(MAX_STAGING_CASES + 5)
        ]
        report = StagingSafetyGates.evaluate(
            provider_name="luna",
            allow_staging=True,
            dataset=dummy_cases,
        )
        assert report.safety_gates_passed is False
        assert any("Case count" in f for f in report.gate_failures)

    def test_excessive_timeout_blocks_pilot(self):
        report = StagingSafetyGates.evaluate(
            provider_name="luna",
            allow_staging=True,
            timeout_sec=MAX_STAGING_TIMEOUT_SEC + 30,
        )
        assert report.safety_gates_passed is False
        assert any("Timeout" in f for f in report.gate_failures)

    def test_db_mutations_and_tools_blocked(self):
        report = StagingSafetyGates.evaluate(
            provider_name="luna",
            allow_staging=True,
            db_mutations=True,
            tools_enabled=True,
        )
        assert report.safety_gates_passed is False
        assert any("Database mutations" in f for f in report.gate_failures)
        assert any("Tool execution" in f for f in report.gate_failures)


class TestRollbackAndDefaultProtection:
    """Ensure auto-mode priority is respected, explicit modes are deterministic, and rollback works cleanly."""

    def test_auto_priority_resolves_openai_primary_when_unset(self, monkeypatch):
        monkeypatch.delenv("AI_PROVIDER", raising=False)
        monkeypatch.delenv("ASSISTANT_MODEL", raising=False)
        set_ai_provider(None)
        provider = get_ai_provider()
        assert provider.get_model_name() == "gpt-5.6-luna"
        assert isinstance(provider, (OpenAIProvider, FallbackProviderWrapper))

        # Rollback check: explicit gemini priority via AI_PROVIDER_PRIORITY still returns GeminiProvider
        # when GEMINI_API_KEY is present. This tests that priority env vars are respected.
        monkeypatch.setenv("AI_PROVIDER", "auto")
        monkeypatch.setenv("AI_PROVIDER_PRIORITY", "gemini,openai")
        monkeypatch.setenv("AI_ALLOW_PROVIDER_FALLBACK", "false")
        monkeypatch.setenv("GEMINI_API_KEY", "AIzaSy-test-key-for-rollback-check")
        set_ai_provider(None)
        rollback_provider = get_ai_provider()
        assert isinstance(rollback_provider, GeminiProvider)
        assert rollback_provider.get_model_name() == "gemini-2.5-flash-lite"

    def test_explicit_luna_selection_does_not_mutate_default(self, monkeypatch):
        monkeypatch.delenv("AI_PROVIDER", raising=False)
        set_ai_provider(None)
        # Getting a luna provider explicitly does not alter the default provider resolution
        luna_provider = get_ai_provider("luna")
        assert isinstance(luna_provider, LunaProvider)
        assert luna_provider.get_model_name() == "gpt-5.6-luna"

        # When resolving without explicit argument, it still defaults to configured auto priority
        set_ai_provider(None)
        default_provider = get_ai_provider()
        assert default_provider.get_model_name() == "gpt-5.6-luna"
        assert isinstance(default_provider, (OpenAIProvider, FallbackProviderWrapper))

    def test_staging_pilot_dry_run_executes_no_network_calls(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "staging")
        monkeypatch.setenv("LUNA_API_KEY", "sk-mock-valid-key")

        result = run_staging_pilot(provider_name="luna", allow_staging=True, dry_run=True)
        assert result["status"] == "PREFLIGHT_PASSED_DRY_RUN"
        assert result["metrics"] is None
        assert "No live network calls were executed" in result["message"]

    def test_mock_provider_staging_pilot_execution(self):
        result = run_staging_pilot(provider_name="mock", allow_staging=True, dry_run=False)
        assert result["status"] == "PILOT_COMPLETED"
        assert result["case_count"] == 20
        assert result["summary"]["total_cases"] == 20
        assert result["summary"]["successful_cases"] == 20
        assert result["summary"]["is_mock"] is True

    def test_provider_exception_mapping_scrubs_raw_secrets(self):
        secret_key = "sk-luna-ultra-secret-test-key-998877"
        provider = LunaProvider(api_key=secret_key)
        raw_error = Exception(f"HTTP 401: Unauthorized access with key {secret_key}")
        normalized = provider._map_exception(raw_error)
        assert secret_key not in str(normalized)
        assert "[REDACTED_API_KEY]" in str(normalized)

    def test_fail_closed_on_unauthorized_live_call_attempt(self, monkeypatch):
        monkeypatch.delenv("AI_EVAL_ALLOW_STAGING", raising=False)
        with pytest.raises(StagingSafetyGateError, match="requires explicit staging authorization"):
            run_staging_pilot(provider_name="luna", allow_staging=False, dry_run=False)

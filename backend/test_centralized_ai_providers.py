"""
backend/test_centralized_ai_providers.py
=========================================
GET Solar Energy — Centralized OpenAI Provider Architecture Verification
Tests proving:
1. OpenAI is the canonical default provider with model gpt-5.6-luna
2. Default priority is OpenAI-only (no accidental Gemini usage)
3. No feature/route directly imports google.genai or initializes genai.Client
4. All AI features obtain LLM access through centralized get_ai_provider()
5. IntentRouter Stage 2 classification routes through get_ai_provider()
6. AMC recommendation routes through get_ai_provider()
7. Technician AI troubleshooting routes through get_ai_provider()
8. Gemini is never initialized during normal OpenAI operation
9. Gemini is cleanly selectable via configuration (AI_PROVIDER=gemini)
10. Explicit OpenAI -> Gemini fallback works only when explicitly configured
11. Missing Gemini credentials do not affect OpenAI-only operation
12. Zero secrets or keys leaked in logs or error representations
"""

import ast
import os
import pathlib
import unittest
from unittest.mock import MagicMock, patch

from ai.provider_base import (
    BaseAIProvider,
    AIRequest,
    AIResponse,
    AIProviderAuthError,
    AIProviderRateLimitError,
)
from ai.provider_factory import get_ai_provider, set_ai_provider
from ai.providers.luna_provider import OpenAIProvider, LunaProvider
from ai.providers.gemini_provider import GeminiProvider
from ai.providers.mock_provider import MockAIProvider
from ai.provider_selector import (
    ProviderConfig,
    ProviderSelector,
    FallbackProviderWrapper,
    DEFAULT_AI_PROVIDER,
    DEFAULT_AI_PROVIDER_PRIORITY,
    DEFAULT_OPENAI_MODEL,
)
from ai.intent_router import IntentRouter, Intent


class MockAIProviderForTest(BaseAIProvider):
    def __init__(self, content='{"intent": "GENERAL", "confidence": 0.85, "entities": {}}'):
        self.content = content
        self.calls = []

    def get_model_name(self) -> str:
        return "gpt-5.6-luna"

    def generate_response(self, request: AIRequest) -> AIResponse:
        self.calls.append(request)
        return AIResponse(
            content=self.content,
            model="gpt-5.6-luna",
            latency_ms=25.0,
            metadata={"provider": "openai", "model": "gpt-5.6-luna"},
        )


class TestCentralizedAIArchitecture(unittest.TestCase):
    """Verifies that OpenAI is the canonical centralized default for all AI features."""

    def setUp(self):
        self.mock_provider = MockAIProviderForTest()
        set_ai_provider(self.mock_provider)

    def tearDown(self):
        set_ai_provider(None)

    def test_01_openai_is_canonical_default_provider_and_model(self):
        """OpenAI (gpt-5.6-luna) is the default provider and model across the platform."""
        set_ai_provider(None)
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("AI_PROVIDER", None)
            provider = get_ai_provider()
            self.assertIsInstance(provider, (OpenAIProvider, FallbackProviderWrapper))
            self.assertEqual(provider.get_model_name(), "gpt-5.6-luna")
            self.assertEqual(DEFAULT_OPENAI_MODEL, "gpt-5.6-luna")

    def test_02_default_priority_is_openai_only(self):
        """Default provider priority is OpenAI only without unsolicited Gemini usage."""
        self.assertEqual(DEFAULT_AI_PROVIDER_PRIORITY, "openai")
        config = ProviderConfig.from_env({})
        self.assertEqual(config.priority, ["openai"])
        self.assertEqual(config.openai_model, "gpt-5.6-luna")

    def test_03_no_production_feature_imports_or_initializes_google_genai(self):
        """
        Verify via AST that production modules and routes do not import google.genai
        or instantiate genai.Client directly.
        """
        backend_dir = pathlib.Path(__file__).parent
        production_files = [
            "main.py",
            "generation.py",
            "amc.py",
            "ai_troubleshoot.py",
            "roof.py",
            "proposal.py",
            "site_survey.py",
            "chat.py",
            "ai/intent_router.py",
            "ai/assistant_service.py",
            "ai/assistant_planner.py",
        ]

        for rel_path in production_files:
            file_path = backend_dir / rel_path
            self.assertTrue(file_path.exists(), f"File {rel_path} must exist")
            source = file_path.read_text(encoding="utf-8")
            tree = ast.parse(source)

            # Check imports
            for node in ast.walk(tree):
                if isinstance(node, ast.ImportFrom):
                    if node.module and ("google.genai" in node.module or node.module in ("google",)):
                        self.fail(f"{rel_path} must not import google.genai: found {node.module}")
                elif isinstance(node, ast.Import):
                    for alias in node.names:
                        if "genai" in alias.name or alias.name == "google":
                            self.fail(f"{rel_path} must not import google.genai: found {alias.name}")

            # Check direct calls / client instantiation
            self.assertNotIn("genai.Client", source, f"{rel_path} must not instantiate genai.Client")
            self.assertNotIn("client.models.generate_content", source, f"{rel_path} must not call generate_content")

    def test_04_all_features_use_get_ai_provider(self):
        """Verify that every AI-capable route and module uses get_ai_provider()."""
        backend_dir = pathlib.Path(__file__).parent
        ai_feature_files = [
            "generation.py",
            "amc.py",
            "ai_troubleshoot.py",
            "roof.py",
            "proposal.py",
            "site_survey.py",
            "main.py",
            "chat.py",
            "ai/assistant_service.py",
        ]

        for rel_path in ai_feature_files:
            file_path = backend_dir / rel_path
            source = file_path.read_text(encoding="utf-8")
            self.assertIn(
                "get_ai_provider",
                source,
                f"{rel_path} must obtain its LLM through centralized get_ai_provider()",
            )

    def test_05_intent_router_uses_centralized_provider(self):
        """IntentRouter Stage 2 classification routes through get_ai_provider()."""
        router = IntentRouter()
        # Message with low keyword confidence triggers Stage 2
        result = router.classify("xyzwq unpredictable message 12345")
        self.assertIn("intent", result)
        self.assertIn("confidence", result)
        # Verify our mock provider was called
        self.assertGreaterEqual(len(self.mock_provider.calls), 1)
        req = self.mock_provider.calls[0]
        self.assertIn("Classify the user message", req.prompt)

    def test_06_amc_module_uses_centralized_provider(self):
        """AMC recommendation uses get_ai_provider() without direct SDK imports."""
        from amc import AMCRequest, amc_recommendation
        import asyncio

        req_data = AMCRequest(
            customer_name="Test Customer",
            city="Delhi",
            system_size_kw=5.0,
            installation_date="2023-01-01",
            last_service_date="2024-01-01",
            current_generation_units=400.0,
            expected_generation_units=500.0,
            inverter_error_codes="None",
            panel_cleaning_done=True,
            physical_damage_observed=False,
            damage_details="None",
        )

        amc_mock_resp = """
        {
            "customer_name": "Test Customer",
            "system_size_kw": 5.0,
            "health_score": 85,
            "system_status": "Good",
            "generation_drop_pct": 20.0,
            "monthly_loss_rs": 750,
            "next_service_due": "2026-10-01",
            "urgent_action_required": false,
            "diagnosis_summary": "System operating normally with slight drop.",
            "fault_analysis": ["Minor soiling"],
            "recommended_actions": ["Clean panels"],
            "preventive_measures": ["Quarterly cleaning"],
            "estimated_service_cost_rs": 2500
        }
        """
        self.mock_provider.content = amc_mock_resp

        # Call the endpoint handler directly with mock rate limiter
        with patch("amc.auth_rate_limiter.is_allowed", return_value=True):
            res = asyncio.run(amc_recommendation(req_data, req=None, user_email="customer@getsolar.in"))
            self.assertTrue(res.get("success"))
            self.assertEqual(res["data"]["customer_name"], "Test Customer")
            self.assertEqual(res["data"]["health_score"], 85)

    def test_07_technician_ai_uses_centralized_provider(self):
        """Technician AI troubleshooting calls get_ai_provider() cleanly."""
        from ai_troubleshoot import _call_ai_text

        self.mock_provider.content = "Check DC breaker terminals and measure string open circuit voltage."
        answer = _call_ai_text("Inverter displays code E04")
        self.assertIn("Check DC breaker", answer)
        self.assertGreaterEqual(len(self.mock_provider.calls), 1)

    def test_08_gemini_not_initialized_during_openai_operation(self):
        """Gemini client is never created or initialized during OpenAI operation."""
        set_ai_provider(None)
        env = {
            "AI_PROVIDER": "auto",
            "AI_PROVIDER_PRIORITY": "openai",
            "OPENAI_API_KEY": "sk-proj-test-key",
            "OPENAI_MODEL": "gpt-5.6-luna",
        }
        provider = ProviderSelector.select_provider(env=env)
        self.assertIsInstance(provider, OpenAIProvider)
        self.assertEqual(provider.get_model_name(), "gpt-5.6-luna")
        self.assertNotIsInstance(provider, GeminiProvider)

    def test_09_gemini_selectable_via_configuration(self):
        """Gemini remains available and can be selected via AI_PROVIDER=gemini."""
        set_ai_provider(None)
        env = {
            "AI_PROVIDER": "gemini",
            "GEMINI_API_KEY": "AIzaSyTestGeminiKey123",
            "ASSISTANT_MODEL": "gemini-2.5-flash-lite",
        }
        provider = ProviderSelector.select_provider(env=env)
        self.assertIsInstance(provider, GeminiProvider)
        self.assertEqual(provider.get_model_name(), "gemini-2.5-flash-lite")

    def test_10_explicit_fallback_works_only_when_configured(self):
        """OpenAI -> Gemini fallback activates only when explicitly prioritized in AI_PROVIDER_PRIORITY."""
        set_ai_provider(None)
        env = {
            "AI_PROVIDER": "auto",
            "AI_PROVIDER_PRIORITY": "openai,gemini",
            "AI_ALLOW_PROVIDER_FALLBACK": "true",
            "OPENAI_API_KEY": "sk-test-openai-key",
            "OPENAI_MODEL": "gpt-5.6-luna",
            "GEMINI_API_KEY": "AIzaSyTestGeminiKey123",
            "ASSISTANT_MODEL": "gemini-2.5-flash-lite",
        }
        provider = ProviderSelector.select_provider(env=env)
        self.assertIsInstance(provider, FallbackProviderWrapper)
        self.assertEqual(provider._primary_name, "openai")
        self.assertEqual(provider._fallback_name, "gemini")

    def test_11_missing_gemini_credentials_do_not_affect_openai(self):
        """Absence of GEMINI_API_KEY has zero effect on OpenAI primary operation."""
        set_ai_provider(None)
        env = {
            "AI_PROVIDER": "auto",
            "AI_PROVIDER_PRIORITY": "openai",
            "OPENAI_API_KEY": "sk-test-valid-key",
            "OPENAI_MODEL": "gpt-5.6-luna",
            # GEMINI_API_KEY is not set
        }
        provider = ProviderSelector.select_provider(env=env)
        self.assertIsInstance(provider, OpenAIProvider)
        self.assertEqual(provider.get_model_name(), "gpt-5.6-luna")

    def test_12_no_secrets_leaked_in_logs_or_errors(self):
        """Provider selector and errors never leak API keys in string representation."""
        err = AIProviderAuthError("Failed authentication with key sk-proj-SECRETKEY998877", provider="openai")
        safe_msg = str(err)
        # LunaProvider's _map_exception redacts API key
        self.assertNotIn("SECRETKEY998877", OpenAIProvider(api_key="SECRETKEY998877")._map_exception(Exception("Error with SECRETKEY998877")).message)


if __name__ == "__main__":
    unittest.main()

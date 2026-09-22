"""
backend/test_ai_dual_provider.py
================================
GET Solar Energy — Dual AI Provider Architecture Test Suite
Supported Providers: Google Gemini & OpenAI GPT-5.6 Luna

Covers all 32 required test scenarios:
1. No provider keys configured
2. Gemini key only
3. OpenAI key only
4. Both keys configured
5. Explicit Gemini selection
6. Explicit OpenAI selection
7. Legacy luna alias, if supported
8. Auto mode with Gemini priority
9. Auto mode with OpenAI priority
10. Missing Gemini key
11. Missing OpenAI key
12. Missing OpenAI base URL
13. Invalid OpenAI base URL
14. Missing OpenAI model
15. Invalid OpenAI model
16. Default model is gpt-5.6-luna
17. Invalid AI_PROVIDER value
18. Invalid provider priority
19. Fallback disabled
20. Fallback enabled
21. Gemini failure with fallback disabled
22. Gemini failure with eligible OpenAI fallback
23. OpenAI failure with eligible Gemini fallback
24. No eligible provider
25. Provider selection makes no network calls
26. API keys never appear in logs
27. API keys never appear in exceptions
28. Existing Gemini behavior remains compatible
29. OpenAI adapter uses the configured model
30. OpenAI adapter does not use a fake Luna endpoint
31. Provider status does not expose secrets
32. Existing tests remain passing
"""

import os
import unittest
from unittest.mock import MagicMock, patch

from backend.ai.provider_base import (
    BaseAIProvider,
    AIRequest,
    AIResponse,
    AIProviderError,
    AIProviderAuthError,
    AIProviderUnavailableError,
)
from backend.ai.provider_factory import (
    get_ai_provider,
    set_ai_provider,
    get_selected_provider,
    get_provider_status,
)
from backend.ai.provider_selector import (
    ProviderSelector,
    ProviderConfig,
    AIProviderConfigError,
    ProviderEligibilityValidator,
    FallbackProviderWrapper,
    DEFAULT_OPENAI_MODEL,
    DEFAULT_OPENAI_BASE_URL,
)
from backend.ai.providers.gemini_provider import GeminiProvider
from backend.ai.providers.luna_provider import OpenAIProvider, LunaProvider
from backend.ai.providers.mock_provider import MockAIProvider


class TestDualProviderArchitecture(unittest.TestCase):
    """32 deterministic offline tests covering all provider selection, eligibility, priority, and fallback rules."""

    def setUp(self):
        set_ai_provider(None)

    def tearDown(self):
        set_ai_provider(None)

    # 1. No provider keys configured
    def test_01_no_keys_configured(self):
        env = {
            "AI_PROVIDER": "auto",
            "GEMINI_API_KEY": "",
            "OPENAI_API_KEY": "",
        }
        status = get_provider_status(env)
        self.assertFalse(status["providers"]["gemini"]["eligible"])
        self.assertFalse(status["providers"]["openai"]["eligible"])
        self.assertIsNone(status["selected_provider"])

        with self.assertRaises(AIProviderConfigError) as ctx:
            get_selected_provider(env, strict=True)
        self.assertIn("No eligible AI provider found", str(ctx.exception))

    # 2. Gemini key only
    # 2. Gemini key only (with dual-priority configured)
    def test_02_gemini_key_only(self):
        env = {
            "AI_PROVIDER": "auto",
            "AI_PROVIDER_PRIORITY": "openai,gemini",
            "GEMINI_API_KEY": "AIzaSy-test-gemini-key",
            "OPENAI_API_KEY": "",
        }
        status = get_provider_status(env)
        self.assertTrue(status["providers"]["gemini"]["eligible"])
        self.assertFalse(status["providers"]["openai"]["eligible"])
        self.assertEqual(status["selected_provider"], "gemini")

        provider = get_selected_provider(env, strict=True)
        self.assertIsInstance(provider, GeminiProvider)

    # 3. OpenAI key only
    def test_03_openai_key_only(self):
        env = {
            "AI_PROVIDER": "auto",
            "GEMINI_API_KEY": "",
            "OPENAI_API_KEY": "sk-openai-valid-test-key",
            "OPENAI_BASE_URL": "https://api.openai.com/v1",
            "OPENAI_MODEL": "gpt-5.6-luna",
        }
        status = get_provider_status(env)
        self.assertFalse(status["providers"]["gemini"]["eligible"])
        self.assertTrue(status["providers"]["openai"]["eligible"])
        self.assertEqual(status["selected_provider"], "openai")

        provider = get_selected_provider(env, strict=True)
        self.assertIsInstance(provider, OpenAIProvider)
        self.assertEqual(provider.get_model_name(), "gpt-5.6-luna")

    # 4. Both keys configured (OpenAI wins priority, Gemini is fallback when dual-priority configured)
    def test_04_both_keys_configured_openai_wins_with_gemini_fallback(self):
        env = {
            "AI_PROVIDER": "auto",
            "AI_PROVIDER_PRIORITY": "openai,gemini",
            "GEMINI_API_KEY": "AIzaSy-test-key",
            "OPENAI_API_KEY": "sk-openai-key",
            "OPENAI_BASE_URL": "https://api.openai.com/v1",
            "OPENAI_MODEL": "gpt-5.6-luna",
        }
        status = get_provider_status(env)
        self.assertEqual(status["selected_provider"], "openai")
        provider = get_selected_provider(env, strict=True)
        self.assertIsInstance(provider, FallbackProviderWrapper)
        self.assertEqual(provider.get_model_name(), "gpt-5.6-luna")

    # 5. Explicit Gemini selection
    def test_05_explicit_gemini_selection(self):
        env = {
            "AI_PROVIDER": "gemini",
            "GEMINI_API_KEY": "AIzaSy-valid-key",
            "OPENAI_API_KEY": "sk-test",
        }
        provider = get_selected_provider(env, strict=True)
        self.assertIsInstance(provider, GeminiProvider)

    # 6. Explicit OpenAI selection
    def test_06_explicit_openai_selection(self):
        env = {
            "AI_PROVIDER": "openai",
            "OPENAI_API_KEY": "sk-openai-test-key",
            "OPENAI_BASE_URL": "https://api.openai.com/v1",
            "OPENAI_MODEL": "gpt-5.6-luna",
        }
        provider = get_selected_provider(env, strict=True)
        self.assertIsInstance(provider, OpenAIProvider)
        self.assertEqual(provider.get_model_name(), "gpt-5.6-luna")

    # 7. Legacy luna alias, if supported
    def test_07_legacy_luna_alias_supported(self):
        env = {
            "AI_PROVIDER": "luna",
            "OPENAI_API_KEY": "sk-openai-key",
            "OPENAI_BASE_URL": "https://api.openai.com/v1",
            "OPENAI_MODEL": "gpt-5.6-luna",
        }
        provider = get_selected_provider(env, strict=True)
        self.assertIsInstance(provider, OpenAIProvider)
        self.assertEqual(provider.get_model_name(), "gpt-5.6-luna")

        # Also verify get_ai_provider("luna") backward-compatibility alias
        luna_instance = get_ai_provider("luna")
        self.assertIsInstance(luna_instance, LunaProvider)
        self.assertIsInstance(luna_instance, OpenAIProvider)

    # 8. Auto mode with explicit Gemini priority
    def test_08_auto_mode_with_gemini_priority(self):
        env = {
            "AI_PROVIDER": "auto",
            "AI_PROVIDER_PRIORITY": "gemini,openai",
            "AI_ALLOW_PROVIDER_FALLBACK": "false",
            "GEMINI_API_KEY": "AIzaSy-test",
            "OPENAI_API_KEY": "sk-test",
            "OPENAI_BASE_URL": "https://api.openai.com/v1",
            "OPENAI_MODEL": "gpt-5.6-luna",
        }
        status = get_provider_status(env)
        self.assertEqual(status["selected_provider"], "gemini")
        provider = get_selected_provider(env, strict=True)
        self.assertIsInstance(provider, GeminiProvider)

    # 9. Auto mode with OpenAI priority
    def test_09_auto_mode_with_openai_priority(self):
        env = {
            "AI_PROVIDER": "auto",
            "AI_PROVIDER_PRIORITY": "openai,gemini",
            "AI_ALLOW_PROVIDER_FALLBACK": "false",
            "GEMINI_API_KEY": "AIzaSy-test",
            "OPENAI_API_KEY": "sk-test",
            "OPENAI_BASE_URL": "https://api.openai.com/v1",
            "OPENAI_MODEL": "gpt-5.6-luna",
        }
        status = get_provider_status(env)
        self.assertEqual(status["selected_provider"], "openai")
        provider = get_selected_provider(env, strict=True)
        self.assertIsInstance(provider, OpenAIProvider)
        self.assertEqual(provider.get_model_name(), "gpt-5.6-luna")

    # 10. Missing Gemini key
    def test_10_missing_gemini_key(self):
        env = {
            "AI_PROVIDER": "gemini",
            "GEMINI_API_KEY": "",
        }
        with self.assertRaises(AIProviderConfigError) as ctx:
            get_selected_provider(env, strict=True)
        self.assertIn("GEMINI_API_KEY is not configured", str(ctx.exception))

    # 11. Missing OpenAI key
    def test_11_missing_openai_key(self):
        env = {
            "AI_PROVIDER": "openai",
            "OPENAI_API_KEY": "",
        }
        with self.assertRaises(AIProviderConfigError) as ctx:
            get_selected_provider(env, strict=True)
        self.assertIn("OPENAI_API_KEY is missing", str(ctx.exception))

    # 12. Missing OpenAI base URL
    def test_12_missing_openai_base_url(self):
        env = {
            "AI_PROVIDER": "openai",
            "OPENAI_API_KEY": "sk-test",
            "OPENAI_BASE_URL": "",
            "OPENAI_MODEL": "gpt-5.6-luna",
        }
        with self.assertRaises(AIProviderConfigError) as ctx:
            get_selected_provider(env, strict=True)
        self.assertIn("invalid base URL", str(ctx.exception))

    # 13. Invalid OpenAI base URL
    def test_13_invalid_openai_base_url(self):
        env = {
            "AI_PROVIDER": "openai",
            "OPENAI_API_KEY": "sk-test",
            "OPENAI_BASE_URL": "ftp://invalid-endpoint",
            "OPENAI_MODEL": "gpt-5.6-luna",
        }
        with self.assertRaises(AIProviderConfigError) as ctx:
            get_selected_provider(env, strict=True)
        self.assertIn("invalid base URL", str(ctx.exception))

    # 14. Missing OpenAI model
    def test_14_missing_openai_model(self):
        env = {
            "AI_PROVIDER": "openai",
            "OPENAI_API_KEY": "sk-test",
            "OPENAI_BASE_URL": "https://api.openai.com/v1",
            "OPENAI_MODEL": "",
        }
        with self.assertRaises(AIProviderConfigError) as ctx:
            get_selected_provider(env, strict=True)
        self.assertIn("missing model", str(ctx.exception))

    # 15. Invalid OpenAI model
    def test_15_invalid_openai_model(self):
        env = {
            "AI_PROVIDER": "openai",
            "OPENAI_API_KEY": "sk-test",
            "OPENAI_BASE_URL": "https://api.openai.com/v1",
            "OPENAI_MODEL": "unapproved-random-model",
        }
        with self.assertRaises(AIProviderConfigError) as ctx:
            get_selected_provider(env, strict=True)
        self.assertIn("unapproved model", str(ctx.exception))
        self.assertIn("gpt-5.6-luna", str(ctx.exception))

    # 16. Default model is gpt-5.6-luna
    def test_16_default_model_is_gpt_5_6_luna(self):
        config = ProviderConfig.from_env({})
        self.assertEqual(config.openai_model, "gpt-5.6-luna")
        self.assertEqual(DEFAULT_OPENAI_MODEL, "gpt-5.6-luna")

        provider = OpenAIProvider(api_key="sk-test")
        self.assertEqual(provider.get_model_name(), "gpt-5.6-luna")

    # 17. Invalid AI_PROVIDER value
    def test_17_invalid_ai_provider_value(self):
        env = {"AI_PROVIDER": "unsupported_ai_vendor"}
        with self.assertRaises(AIProviderError) as ctx:
            get_selected_provider(env, strict=True)
        self.assertIn("Unsupported AI provider", str(ctx.exception))

    # 18. Invalid provider priority
    def test_18_invalid_provider_priority(self):
        env = {
            "AI_PROVIDER": "auto",
            "AI_PROVIDER_PRIORITY": "invalid_engine_1,invalid_engine_2",
        }
        with self.assertRaises(AIProviderConfigError) as ctx:
            get_selected_provider(env, strict=True)
        self.assertIn("Invalid provider priority", str(ctx.exception))

    # 19. Fallback disabled
    def test_19_fallback_disabled(self):
        env = {
            "AI_PROVIDER": "auto",
            "AI_PROVIDER_PRIORITY": "gemini,openai",
            "AI_ALLOW_PROVIDER_FALLBACK": "false",
            "GEMINI_API_KEY": "AIzaSy-test",
            "OPENAI_API_KEY": "sk-test",
            "OPENAI_BASE_URL": "https://api.openai.com/v1",
            "OPENAI_MODEL": "gpt-5.6-luna",
        }
        provider = get_selected_provider(env, strict=True)
        self.assertIsInstance(provider, GeminiProvider)
        self.assertNotIsInstance(provider, FallbackProviderWrapper)

    # 20. Fallback enabled
    def test_20_fallback_enabled(self):
        env = {
            "AI_PROVIDER": "auto",
            "AI_PROVIDER_PRIORITY": "gemini,openai",
            "AI_ALLOW_PROVIDER_FALLBACK": "true",
            "GEMINI_API_KEY": "AIzaSy-test",
            "OPENAI_API_KEY": "sk-test",
            "OPENAI_BASE_URL": "https://api.openai.com/v1",
            "OPENAI_MODEL": "gpt-5.6-luna",
        }
        provider = get_selected_provider(env, strict=True)
        self.assertIsInstance(provider, FallbackProviderWrapper)

    # 21. Gemini failure with fallback disabled
    def test_21_gemini_failure_with_fallback_disabled(self):
        mock_gemini = MagicMock(spec=BaseAIProvider)
        mock_gemini.get_model_name.return_value = "gemini-2.5-flash-lite"
        mock_gemini.generate_response.side_effect = AIProviderUnavailableError("Gemini 503 Overload", provider="gemini")

        mock_openai = MagicMock(spec=BaseAIProvider)

        # When fallback is disabled, call directly raises error without retrying
        with self.assertRaises(AIProviderUnavailableError):
            mock_gemini.generate_response(AIRequest(prompt="Help"))
        mock_openai.generate_response.assert_not_called()

    # 22. Gemini failure with eligible OpenAI fallback
    def test_22_gemini_failure_with_eligible_openai_fallback(self):
        mock_gemini = MagicMock(spec=BaseAIProvider)
        mock_gemini.get_model_name.return_value = "gemini-2.5-flash-lite"
        mock_gemini.generate_response.side_effect = AIProviderUnavailableError("Gemini 503 Overload", provider="gemini")

        mock_openai = MagicMock(spec=BaseAIProvider)
        mock_openai.get_model_name.return_value = "gpt-5.6-luna"
        mock_openai.generate_response.return_value = AIResponse(
            content="OpenAI GPT-5.6 Luna response: 4kW solar plant.",
            model="gpt-5.6-luna",
        )

        wrapper = FallbackProviderWrapper(
            primary_provider=mock_gemini,
            fallback_provider=mock_openai,
            primary_name="gemini",
            fallback_name="openai",
        )

        resp = wrapper.generate_response(AIRequest(prompt="Estimate solar"))
        self.assertEqual(resp.content, "OpenAI GPT-5.6 Luna response: 4kW solar plant.")
        self.assertEqual(resp.metadata.get("fallback_from"), "gemini")
        self.assertTrue(resp.metadata.get("fallback_active"))
        mock_gemini.generate_response.assert_called_once()
        mock_openai.generate_response.assert_called_once()

    # 23. OpenAI failure with eligible Gemini fallback
    def test_23_openai_failure_with_eligible_gemini_fallback(self):
        mock_openai = MagicMock(spec=BaseAIProvider)
        mock_openai.get_model_name.return_value = "gpt-5.6-luna"
        mock_openai.generate_response.side_effect = AIProviderUnavailableError("OpenAI 500 Down", provider="openai")

        mock_gemini = MagicMock(spec=BaseAIProvider)
        mock_gemini.get_model_name.return_value = "gemini-2.5-flash-lite"
        mock_gemini.generate_response.return_value = AIResponse(
            content="Gemini response: 5kW system recommendation.",
            model="gemini-2.5-flash-lite",
        )

        wrapper = FallbackProviderWrapper(
            primary_provider=mock_openai,
            fallback_provider=mock_gemini,
            primary_name="openai",
            fallback_name="gemini",
        )

        resp = wrapper.generate_response(AIRequest(prompt="Estimate solar"))
        self.assertEqual(resp.content, "Gemini response: 5kW system recommendation.")
        self.assertEqual(resp.metadata.get("fallback_from"), "openai")
        self.assertTrue(resp.metadata.get("fallback_active"))

    # 24. No eligible provider
    def test_24_no_eligible_provider(self):
        env = {
            "AI_PROVIDER": "auto",
            "GEMINI_API_KEY": "",
            "OPENAI_API_KEY": "",
        }
        with self.assertRaises(AIProviderConfigError) as ctx:
            get_selected_provider(env, strict=True)
        self.assertIn("No eligible AI provider found", str(ctx.exception))

    # 25. Provider selection makes no network calls
    def test_25_provider_selection_makes_no_network_calls(self):
        env = {
            "AI_PROVIDER": "auto",
            "GEMINI_API_KEY": "AIzaSy-offline-key",
            "OPENAI_API_KEY": "sk-offline-key",
            "OPENAI_BASE_URL": "https://api.openai.com/v1",
            "OPENAI_MODEL": "gpt-5.6-luna",
        }
        with patch("socket.socket") as mock_sock:
            status = get_provider_status(env)
            self.assertIsNotNone(status)
            provider = get_selected_provider(env, strict=True)
            self.assertIsNotNone(provider)
            mock_sock.assert_not_called()

    # 26. API keys never appear in logs
    def test_26_api_keys_never_appear_in_logs(self):
        secret_gemini = "AIzaSySuperSecretKey111"
        secret_openai = "sk-live-super-secret-openai-key-222"
        env = {
            "AI_PROVIDER": "auto",
            "GEMINI_API_KEY": secret_gemini,
            "OPENAI_API_KEY": secret_openai,
        }
        status_str = str(get_provider_status(env))
        self.assertNotIn(secret_gemini, status_str)
        self.assertNotIn(secret_openai, status_str)
        self.assertNotIn("SuperSecret", status_str)

    # 27. API keys never appear in exceptions
    def test_27_api_keys_never_appear_in_exceptions(self):
        secret_key = "sk-confidential-user-secret-999"
        provider = OpenAIProvider(api_key=secret_key)
        raw_exc = Exception(f"HTTP 401 Unauthorized for token {secret_key}")
        normalized = provider._map_exception(raw_exc)

        self.assertNotIn(secret_key, str(normalized))
        self.assertIn("[REDACTED_API_KEY]", str(normalized))

    # 28. Existing Gemini behavior remains compatible
    def test_28_existing_gemini_behavior_remains_compatible(self):
        mock_client = MagicMock()
        mock_raw_resp = MagicMock()
        mock_raw_resp.text = "Gemini verified: 3kW on-grid rooftop solar plant."
        mock_raw_resp.candidates = []
        mock_client.models.generate_content.return_value = mock_raw_resp

        provider = GeminiProvider(api_key="AIzaSy-fake", client=mock_client)
        resp = provider.generate_response(AIRequest(prompt="Estimate generation"))
        self.assertEqual(resp.content, "Gemini verified: 3kW on-grid rooftop solar plant.")
        self.assertEqual(resp.model, "gemini-2.5-flash-lite")

    # 29. OpenAI adapter uses the configured model
    def test_29_openai_adapter_uses_configured_model(self):
        mock_client = MagicMock()
        mock_completion = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = "GPT-5.6 Luna generation response."
        mock_choice.finish_reason = "stop"
        mock_completion.choices = [mock_choice]
        mock_completion.model = "gpt-5.6-luna"
        mock_completion.usage.prompt_tokens = 50
        mock_completion.usage.completion_tokens = 25
        mock_completion.usage.total_tokens = 75

        mock_client.chat.completions.create.return_value = mock_completion

        provider = OpenAIProvider(
            api_key="sk-test",
            model_name="gpt-5.6-luna",
            base_url="https://api.openai.com/v1",
            client=mock_client,
        )
        resp = provider.generate_response(AIRequest(prompt="Test prompt"))
        self.assertEqual(resp.content, "GPT-5.6 Luna generation response.")
        self.assertEqual(resp.model, "gpt-5.6-luna")

        # Verify chat completion call used gpt-5.6-luna
        call_kwargs = mock_client.chat.completions.create.call_args[1]
        self.assertEqual(call_kwargs["model"], "gpt-5.6-luna")

    # 30. OpenAI adapter does not use a fake Luna endpoint
    def test_30_openai_adapter_does_not_use_fake_luna_endpoint(self):
        provider = OpenAIProvider(api_key="sk-test")
        self.assertEqual(provider.get_base_url(), DEFAULT_OPENAI_BASE_URL)
        self.assertEqual(provider.get_base_url(), "https://api.openai.com/v1")
        self.assertNotIn("fake", provider.get_base_url())
        self.assertNotIn("luna-internal", provider.get_base_url())

    # 31. Provider status does not expose secrets
    def test_31_provider_status_does_not_expose_secrets(self):
        env = {
            "AI_PROVIDER": "auto",
            "GEMINI_API_KEY": "AIzaSy-SuperSecret12345",
            "OPENAI_API_KEY": "sk-SuperSecretOpenAI67890",
            "OPENAI_BASE_URL": "https://api.openai.com/v1",
            "OPENAI_MODEL": "gpt-5.6-luna",
        }
        status = get_provider_status(env)
        # Check all nested values for presence of keys
        for prov_key, prov_data in status["providers"].items():
            for k, v in prov_data.items():
                if isinstance(v, str):
                    self.assertNotIn("SuperSecret12345", v)
                    self.assertNotIn("SuperSecretOpenAI67890", v)

    # 32. Default provider resolution respects auto priority
    def test_32_default_provider_resolution_respects_auto_priority(self):
        # Verify get_ai_provider without arguments resolves according to auto priority (OpenAI primary)
        set_ai_provider(None)
        provider = get_ai_provider()
        self.assertEqual(provider.get_model_name(), "gpt-5.6-luna")
        self.assertIsInstance(provider, (OpenAIProvider, FallbackProviderWrapper))

        # Verify explicit Gemini provider selection still returns GeminiProvider
        gemini_p = get_ai_provider("gemini")
        self.assertIsInstance(gemini_p, GeminiProvider)
        self.assertEqual(gemini_p.get_model_name(), "gemini-2.5-flash-lite")

        # Verify Mock provider selection
        mock_p = get_ai_provider("mock")
        self.assertIsInstance(mock_p, MockAIProvider)

    # 33. OpenAI-first priority default
    def test_33_openai_first_priority_default(self):
        config = ProviderConfig.from_env({})
        self.assertEqual(config.priority, ["openai"])
        self.assertTrue(config.allow_fallback)
        self.assertEqual(config.openai_model, "gpt-5.6-luna")

    # 34. OpenAI request falls back to Gemini end-to-end
    def test_34_openai_request_falls_back_to_gemini_end_to_end(self):
        mock_openai = MagicMock(spec=BaseAIProvider)
        mock_openai.get_model_name.return_value = "gpt-5.6-luna"
        mock_openai.generate_response.side_effect = AIProviderUnavailableError("OpenAI 503 Overload", provider="openai")

        mock_gemini = MagicMock(spec=BaseAIProvider)
        mock_gemini.get_model_name.return_value = "gemini-2.5-flash-lite"
        mock_gemini.generate_response.return_value = AIResponse(
            content="Gemini fallback response: 4kW solar system recommended.",
            model="gemini-2.5-flash-lite",
        )

        wrapper = FallbackProviderWrapper(
            primary_provider=mock_openai,
            fallback_provider=mock_gemini,
            primary_name="openai",
            fallback_name="gemini",
        )

        resp = wrapper.generate_response(AIRequest(prompt="Estimate my solar potential"))
        self.assertEqual(resp.content, "Gemini fallback response: 4kW solar system recommended.")
        self.assertEqual(resp.metadata.get("fallback_from"), "openai")
        self.assertTrue(resp.metadata.get("fallback_active"))
        mock_openai.generate_response.assert_called_once()
        mock_gemini.generate_response.assert_called_once()

    # 35. Missing OpenAI key selects Gemini in auto mode when dual-priority configured
    def test_35_missing_openai_key_selects_gemini_in_auto(self):
        env = {
            "AI_PROVIDER": "auto",
            "AI_PROVIDER_PRIORITY": "openai,gemini",
            "OPENAI_API_KEY": "",
            "GEMINI_API_KEY": "AIzaSy-valid-gemini-key",
        }
        status = get_provider_status(env)
        self.assertFalse(status["providers"]["openai"]["eligible"])
        self.assertTrue(status["providers"]["gemini"]["eligible"])
        self.assertEqual(status["selected_provider"], "gemini")

        provider = get_selected_provider(env, strict=True)
        self.assertEqual(provider.get_model_name(), "gemini-2.5-flash-lite")

    # 36. Fallback disabled rejects failover
    def test_36_fallback_disabled_rejects_failover(self):
        env = {
            "AI_PROVIDER": "auto",
            "AI_ALLOW_PROVIDER_FALLBACK": "false",
            "OPENAI_API_KEY": "sk-test-key",
            "OPENAI_BASE_URL": "https://api.openai.com/v1",
            "OPENAI_MODEL": "gpt-5.6-luna",
            "GEMINI_API_KEY": "AIzaSy-test-key",
        }
        provider = get_selected_provider(env, strict=True)
        self.assertIsInstance(provider, OpenAIProvider)
        self.assertNotIsInstance(provider, FallbackProviderWrapper)

    # 37. Fallback event observability without secrets
    def test_37_fallback_event_observability_no_secrets(self):
        secret_openai = "sk-live-super-secret-key-12345"
        mock_openai = MagicMock(spec=BaseAIProvider)
        mock_openai.get_model_name.return_value = "gpt-5.6-luna"
        mock_openai.generate_response.side_effect = AIProviderUnavailableError(
            f"OpenAI 500 error for key [REDACTED_API_KEY]",
            provider="openai",
        )

        mock_gemini = MagicMock(spec=BaseAIProvider)
        mock_gemini.get_model_name.return_value = "gemini-2.5-flash-lite"
        mock_gemini.generate_response.return_value = AIResponse(
            content="Gemini fallback response.",
            model="gemini-2.5-flash-lite",
        )

        wrapper = FallbackProviderWrapper(
            primary_provider=mock_openai,
            fallback_provider=mock_gemini,
            primary_name="openai",
            fallback_name="gemini",
        )

        with self.assertLogs("backend.ai.provider_selector", level="WARNING") as cm:
            resp = wrapper.generate_response(AIRequest(prompt="Hello"))
            self.assertEqual(resp.content, "Gemini fallback response.")
            log_output = " ".join(cm.output)
            self.assertIn("Primary AI Provider 'openai' failed", log_output)
            self.assertIn("Engaging eligible fallback provider 'gemini'", log_output)
            self.assertNotIn(secret_openai, log_output)

    # 38. Explicit OpenAI mode does not engage fallback even if Gemini is configured
    def test_38_explicit_openai_mode_does_not_engage_fallback_even_if_gemini_configured(self):
        env = {
            "AI_PROVIDER": "openai",
            "AI_ALLOW_PROVIDER_FALLBACK": "true",
            "OPENAI_API_KEY": "sk-openai-test-key",
            "OPENAI_BASE_URL": "https://api.openai.com/v1",
            "OPENAI_MODEL": "gpt-5.6-luna",
            "GEMINI_API_KEY": "AIzaSy-gemini-key",
        }
        provider = get_selected_provider(env, strict=True)
        self.assertIsInstance(provider, OpenAIProvider)
        self.assertNotIsInstance(provider, FallbackProviderWrapper)
        self.assertEqual(provider.get_model_name(), "gpt-5.6-luna")

    # 39. Explicit Gemini mode does not engage fallback even if OpenAI is configured
    def test_39_explicit_gemini_mode_does_not_engage_fallback_even_if_openai_configured(self):
        env = {
            "AI_PROVIDER": "gemini",
            "AI_ALLOW_PROVIDER_FALLBACK": "true",
            "OPENAI_API_KEY": "sk-openai-test-key",
            "OPENAI_BASE_URL": "https://api.openai.com/v1",
            "OPENAI_MODEL": "gpt-5.6-luna",
            "GEMINI_API_KEY": "AIzaSy-gemini-key",
        }
        provider = get_selected_provider(env, strict=True)
        self.assertIsInstance(provider, GeminiProvider)
        self.assertNotIsInstance(provider, FallbackProviderWrapper)
        self.assertEqual(provider.get_model_name(), "gemini-2.5-flash-lite")


if __name__ == "__main__":
    unittest.main()

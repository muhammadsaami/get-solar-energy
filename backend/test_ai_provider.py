"""
backend/test_ai_provider.py
===========================
GET Solar Energy — AI Provider Abstraction Test Suite
Phase 2.0: Controlled Backend-Only Integration

Covers:
  1. Provider-neutral contracts (AIRequest, AIResponse, AIUsage, Error Hierarchy)
  2. MockAIProvider deterministic behavior and error simulation
  3. GeminiProvider adapter response normalization, error mapping, and retry logic (mocked)
  4. LunaProvider adapter response normalization, message building, error mapping, and key redaction (mocked)
  5. ProviderFactory provider selection (Gemini, Mock, Luna, aliases), environment overrides, and error handling
  6. AssistantService end-to-end integration and regression tests with Mock and Luna providers
"""

import os
import unittest
from unittest.mock import MagicMock, patch

from ai.provider_base import (
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
from ai.providers.gemini_provider import GeminiProvider
from ai.providers.mock_provider import MockAIProvider
from ai.providers.luna_provider import LunaProvider
from ai.provider_factory import get_ai_provider, set_ai_provider
from ai.assistant_service import AssistantService, get_assistant_service


class TestAIProviderContracts(unittest.TestCase):
    """Test normalized AI data contracts and error hierarchy."""

    def test_ai_request_defaults(self):
        req = AIRequest(prompt="Hello GET Solar")
        self.assertEqual(req.prompt, "Hello GET Solar")
        self.assertIsNone(req.system_instruction)
        self.assertEqual(req.history, [])
        self.assertEqual(req.temperature, 0.2)
        self.assertIsNone(req.max_tokens)
        self.assertEqual(req.metadata, {})

    def test_ai_request_full(self):
        history = [{"role": "user", "content": "Hi"}, {"role": "assistant", "content": "Hello"}]
        req = AIRequest(
            prompt="Analyze bill",
            system_instruction="You are a solar expert.",
            history=history,
            temperature=0.7,
            max_tokens=500,
            metadata={"source": "test"},
        )
        self.assertEqual(req.prompt, "Analyze bill")
        self.assertEqual(req.system_instruction, "You are a solar expert.")
        self.assertEqual(len(req.history), 2)
        self.assertEqual(req.temperature, 0.7)
        self.assertEqual(req.max_tokens, 500)
        self.assertEqual(req.metadata["source"], "test")

    def test_ai_response_and_usage(self):
        usage = AIUsage(prompt_tokens=50, completion_tokens=25, total_tokens=75)
        resp = AIResponse(
            content="Solar savings are ₹25,000/yr.",
            model="test-model",
            usage=usage,
            finish_reason="STOP",
            latency_ms=120.5,
            metadata={"cached": False},
        )
        self.assertEqual(resp.content, "Solar savings are ₹25,000/yr.")
        self.assertEqual(resp.model, "test-model")
        self.assertIsNotNone(resp.usage)
        self.assertEqual(resp.usage.total_tokens, 75)
        self.assertEqual(resp.finish_reason, "STOP")
        self.assertEqual(resp.latency_ms, 120.5)

    def test_error_hierarchy(self):
        err = AIProviderError("Generic error", provider="test_provider")
        self.assertEqual(str(err), "[test_provider] Generic error")
        self.assertIsInstance(AIProviderAuthError("Auth failed", provider="gemini"), AIProviderError)
        self.assertIsInstance(AIProviderRateLimitError("Rate limit", provider="gemini"), AIProviderError)
        self.assertIsInstance(AIProviderTimeoutError("Timed out", provider="gemini"), AIProviderError)
        self.assertIsInstance(AIProviderUnavailableError("503 Overload", provider="gemini"), AIProviderError)
        self.assertIsInstance(AIProviderResponseError("Empty response", provider="gemini"), AIProviderError)


class TestMockAIProvider(unittest.TestCase):
    """Test MockAIProvider deterministic outputs and simulated failure modes."""

    def setUp(self):
        self.provider = MockAIProvider(model_name="mock-test-model")

    def test_deterministic_default_response(self):
        req = AIRequest(prompt="What is solar subsidy?")
        resp = self.provider.generate_response(req)
        self.assertIsInstance(resp, AIResponse)
        self.assertEqual(resp.model, "mock-test-model")
        self.assertTrue(len(resp.content) > 0)
        self.assertEqual(resp.finish_reason, "STOP")
        self.assertEqual(len(self.provider.get_call_history()), 1)

    def test_custom_queued_responses(self):
        self.provider.set_custom_responses(["First answer", "Second answer"])
        resp1 = self.provider.generate_response(AIRequest(prompt="Query 1"))
        resp2 = self.provider.generate_response(AIRequest(prompt="Query 2"))
        self.assertEqual(resp1.content, "First answer")
        self.assertEqual(resp2.content, "Second answer")

    def test_simulated_error(self):
        self.provider.set_simulate_error(AIProviderUnavailableError("Simulated server down", provider="mock"))
        with self.assertRaises(AIProviderUnavailableError):
            self.provider.generate_response(AIRequest(prompt="Query"))

    def test_simulated_generic_exception_normalized(self):
        self.provider.set_simulate_error(RuntimeError("Unexpected mock crash"))
        with self.assertRaises(AIProviderError):
            self.provider.generate_response(AIRequest(prompt="Query"))


class TestGeminiProviderAdapter(unittest.TestCase):
    """Test GeminiProvider normalization and exception handling using mocks."""

    def test_successful_response_normalization(self):
        mock_client = MagicMock()
        mock_raw_resp = MagicMock()
        mock_raw_resp.text = "Rooftop solar can generate 4.5 kWh/kW/day."
        mock_raw_resp.usage_metadata.prompt_token_count = 100
        mock_raw_resp.usage_metadata.candidates_token_count = 40
        mock_raw_resp.usage_metadata.total_token_count = 140
        mock_candidate = MagicMock()
        mock_candidate.finish_reason = "STOP"
        mock_raw_resp.candidates = [mock_candidate]

        mock_client.models.generate_content.return_value = mock_raw_resp

        provider = GeminiProvider(api_key="fake-test-key", model_name="gemini-2.5-flash-lite", client=mock_client)
        req = AIRequest(prompt="Estimate generation", system_instruction="Solar advisor")
        resp = provider.generate_response(req)

        self.assertEqual(resp.content, "Rooftop solar can generate 4.5 kWh/kW/day.")
        self.assertEqual(resp.model, "gemini-2.5-flash-lite")
        self.assertIsNotNone(resp.usage)
        self.assertEqual(resp.usage.total_tokens, 140)
        self.assertEqual(resp.finish_reason, "STOP")

    def test_empty_response_raises_response_error(self):
        mock_client = MagicMock()
        mock_raw_resp = MagicMock()
        mock_raw_resp.text = ""
        mock_raw_resp.candidates = []
        mock_client.models.generate_content.return_value = mock_raw_resp

        provider = GeminiProvider(api_key="fake-test-key", client=mock_client)
        with self.assertRaises(AIProviderResponseError):
            provider.generate_response(AIRequest(prompt="Hello"))

    def test_auth_error_mapping_and_key_redaction(self):
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = Exception("401 Unauthorized API key secret_12345 invalid")

        provider = GeminiProvider(api_key="secret_12345", client=mock_client)
        with self.assertRaises(AIProviderAuthError) as ctx:
            provider.generate_response(AIRequest(prompt="Test"))

        self.assertNotIn("secret_12345", str(ctx.exception))
        self.assertIn("[REDACTED_API_KEY]", str(ctx.exception))

    def test_rate_limit_error_mapping(self):
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = Exception("ResourceExhausted: 429 Quota exceeded")

        provider = GeminiProvider(api_key="fake-key", client=mock_client)
        with patch("time.sleep", return_value=None):
            with self.assertRaises(AIProviderRateLimitError):
                provider.generate_response(AIRequest(prompt="Test"))

    def test_retry_backoff_on_503(self):
        mock_client = MagicMock()
        mock_raw_resp = MagicMock()
        mock_raw_resp.text = "Recovered after retry"
        mock_raw_resp.candidates = []
        mock_raw_resp.usage_metadata = None

        mock_client.models.generate_content.side_effect = [
            Exception("503 Service Unavailable: High demand"),
            mock_raw_resp,
        ]

        provider = GeminiProvider(api_key="fake-key", client=mock_client)

        with patch("time.sleep", return_value=None):
            resp = provider.generate_response(AIRequest(prompt="Test retry"))
            self.assertEqual(resp.content, "Recovered after retry")
            self.assertEqual(mock_client.models.generate_content.call_count, 2)


class TestLunaProviderAdapter(unittest.TestCase):
    """Test LunaProvider adapter behavior, request translation, and error mapping with mocks."""

    def test_luna_implements_base_provider(self):
        provider = LunaProvider(api_key="test-luna-key", model_name="luna-v1")
        self.assertIsInstance(provider, BaseAIProvider)
        self.assertEqual(provider.get_model_name(), "luna-v1")

    def test_lazy_client_initialization_missing_key_fails_on_call(self):
        with patch.dict(os.environ, {}, clear=True):
            provider = LunaProvider(api_key=None)
            with self.assertRaises(AIProviderAuthError) as ctx:
                provider.generate_response(AIRequest(prompt="Hello"))
            self.assertIn("LUNA_API_KEY", str(ctx.exception))

    def test_successful_response_normalization(self):
        mock_client = MagicMock()
        mock_completion = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = "OpenAI Luna recommends a 3kW on-grid solar plant."
        mock_choice.finish_reason = "stop"
        mock_completion.choices = [mock_choice]
        mock_completion.model = "luna-v1"
        mock_completion.usage.prompt_tokens = 85
        mock_completion.usage.completion_tokens = 35
        mock_completion.usage.total_tokens = 120

        mock_client.chat.completions.create.return_value = mock_completion

        provider = LunaProvider(api_key="sk-luna-test", model_name="luna-v1", client=mock_client)
        req = AIRequest(
            prompt="What system do I need?",
            system_instruction="You are a solar engineer.",
            history=[{"role": "user", "content": "Hi"}, {"role": "assistant", "content": "Hello"}],
            temperature=0.3,
            max_tokens=250,
        )

        resp = provider.generate_response(req)

        self.assertEqual(resp.content, "OpenAI Luna recommends a 3kW on-grid solar plant.")
        self.assertEqual(resp.model, "luna-v1")
        self.assertEqual(resp.finish_reason, "STOP")
        self.assertIsNotNone(resp.usage)
        self.assertEqual(resp.usage.prompt_tokens, 85)
        self.assertEqual(resp.usage.completion_tokens, 35)
        self.assertEqual(resp.usage.total_tokens, 120)

        # Verify chat completion call arguments
        call_kwargs = mock_client.chat.completions.create.call_args[1]
        self.assertEqual(call_kwargs["model"], "luna-v1")
        self.assertEqual(call_kwargs["temperature"], 0.3)
        self.assertEqual(call_kwargs["max_tokens"], 250)
        messages = call_kwargs["messages"]
        self.assertEqual(len(messages), 4)
        self.assertEqual(messages[0], {"role": "system", "content": "You are a solar engineer."})
        self.assertEqual(messages[1], {"role": "user", "content": "Hi"})
        self.assertEqual(messages[2], {"role": "assistant", "content": "Hello"})
        self.assertEqual(messages[3], {"role": "user", "content": "What system do I need?"})

    def test_empty_response_raises_response_error(self):
        mock_client = MagicMock()
        mock_completion = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = ""
        mock_choice.finish_reason = "stop"
        mock_completion.choices = [mock_choice]
        mock_completion.usage = None

        mock_client.chat.completions.create.return_value = mock_completion

        provider = LunaProvider(api_key="sk-test", client=mock_client)
        with self.assertRaises(AIProviderResponseError):
            provider.generate_response(AIRequest(prompt="Test"))

    def test_missing_usage_metadata_does_not_crash(self):
        mock_client = MagicMock()
        mock_completion = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = "Valid response text"
        mock_choice.finish_reason = "stop"
        mock_completion.choices = [mock_choice]
        mock_completion.usage = None

        mock_client.chat.completions.create.return_value = mock_completion

        provider = LunaProvider(api_key="sk-test", client=mock_client)
        resp = provider.generate_response(AIRequest(prompt="Test"))
        self.assertEqual(resp.content, "Valid response text")
        self.assertIsNone(resp.usage)

    def test_auth_error_mapping_and_key_redaction(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("Incorrect API key provided: secret_luna_key_99")

        provider = LunaProvider(api_key="secret_luna_key_99", client=mock_client)
        with self.assertRaises(AIProviderAuthError) as ctx:
            provider.generate_response(AIRequest(prompt="Test"))

        self.assertNotIn("secret_luna_key_99", str(ctx.exception))
        self.assertIn("[REDACTED_API_KEY]", str(ctx.exception))

    def test_rate_limit_error_mapping(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("RateLimitError: 429 You exceeded your current quota")

        provider = LunaProvider(api_key="sk-test", client=mock_client)
        with self.assertRaises(AIProviderRateLimitError):
            provider.generate_response(AIRequest(prompt="Test"))

    def test_timeout_error_mapping(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("APITimeoutError: Request timed out.")

        provider = LunaProvider(api_key="sk-test", client=mock_client)
        with self.assertRaises(AIProviderTimeoutError):
            provider.generate_response(AIRequest(prompt="Test"))

    def test_unavailable_error_mapping(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("503 Service Unavailable: Backend overloaded")

        provider = LunaProvider(api_key="sk-test", client=mock_client)
        with self.assertRaises(AIProviderUnavailableError):
            provider.generate_response(AIRequest(prompt="Test"))


class TestProviderFactory(unittest.TestCase):
    """Test provider factory selection, overrides, and error handling."""

    def setUp(self):
        set_ai_provider(None)

    def tearDown(self):
        set_ai_provider(None)

    def test_default_is_openai(self):
        """Production default: when AI_PROVIDER is unset, OpenAIProvider must be returned."""
        with patch.dict(os.environ, {}, clear=True):
            set_ai_provider(None)
            provider = get_ai_provider()
            self.assertIsInstance(provider, LunaProvider)  # LunaProvider is alias for OpenAIProvider
            self.assertEqual(provider.get_model_name(), "gpt-5.6-luna")

    def test_gemini_never_default_without_explicit_selection(self):
        """Gemini must NOT be returned when AI_PROVIDER is unset or 'openai'."""
        with patch.dict(os.environ, {}, clear=True):
            set_ai_provider(None)
            provider = get_ai_provider()
            self.assertNotIsInstance(provider, GeminiProvider)

        with patch.dict(os.environ, {"AI_PROVIDER": "openai"}):
            set_ai_provider(None)
            provider = get_ai_provider()
            self.assertNotIsInstance(provider, GeminiProvider)

    def test_explicit_gemini_selection(self):
        provider = get_ai_provider("gemini")
        self.assertIsInstance(provider, GeminiProvider)

    def test_explicit_mock_selection(self):
        provider = get_ai_provider("mock")
        self.assertIsInstance(provider, MockAIProvider)

    def test_explicit_luna_selection(self):
        provider = get_ai_provider("luna")
        self.assertIsInstance(provider, LunaProvider)

    def test_explicit_openai_aliases_selection(self):
        self.assertIsInstance(get_ai_provider("openai"), LunaProvider)
        self.assertIsInstance(get_ai_provider("openai_luna"), LunaProvider)

    def test_env_var_openai_selection(self):
        """AI_PROVIDER=openai must resolve to OpenAIProvider."""
        with patch.dict(os.environ, {"AI_PROVIDER": "openai"}):
            set_ai_provider(None)
            provider = get_ai_provider()
            self.assertIsInstance(provider, LunaProvider)
            self.assertEqual(provider.get_model_name(), "gpt-5.6-luna")

    def test_env_var_luna_selection(self):
        with patch.dict(os.environ, {"AI_PROVIDER": "luna"}):
            set_ai_provider(None)
            provider = get_ai_provider()
            self.assertIsInstance(provider, LunaProvider)

    def test_env_var_mock_selection(self):
        with patch.dict(os.environ, {"AI_PROVIDER": "mock"}):
            set_ai_provider(None)
            provider = get_ai_provider()
            self.assertIsInstance(provider, MockAIProvider)

    def test_unsupported_provider_raises_error(self):
        with self.assertRaises(AIProviderError) as ctx:
            get_ai_provider("unknown_ai_engine")
        self.assertIn("Unsupported AI provider", str(ctx.exception))

class TestAssistantServiceRegression(unittest.TestCase):
    """Test Enterprise AI Assistant orchestration with the provider abstraction."""

    def setUp(self):
        self.mock_provider = MockAIProvider(
            default_response="GET Solar rooftop analysis indicates 5kW system recommendation."
        )
        set_ai_provider(self.mock_provider)
        self.service = AssistantService()
        self.service._provider = self.mock_provider

    def tearDown(self):
        set_ai_provider(None)

    def test_assistant_chat_end_to_end_with_mock(self):
        result = self.service.chat(
            message="What size solar system should I install?",
            user_email="customer@example.com",
            user_role="Free User",
            user_name="Rajesh",
            session_id="test-session-101",
        )

        # Verify standard API response envelope
        self.assertIn("response", result)
        self.assertIn("tool_results", result)
        self.assertIn("recommendations", result)
        self.assertIn("next_actions", result)
        self.assertIn("confidence", result)
        self.assertEqual(result["conversation_id"], "test-session-101")
        self.assertIn("request_id", result)
        self.assertIn("timestamp", result)
        self.assertIn("elapsed_ms", result)
        self.assertIn("warnings", result)
        self.assertIn("errors", result)

        # Verify content from mock provider
        self.assertIn("5kW system recommendation", result["response"])

        # Verify memory update
        history = self.service.get_history("test-session-101")
        self.assertEqual(len(history["history"]), 2)
        self.assertEqual(history["history"][0]["role"], "user")
        self.assertEqual(history["history"][1]["role"], "assistant")

    def test_assistant_chat_end_to_end_with_luna_mocked(self):
        mock_client = MagicMock()
        mock_completion = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = "OpenAI Luna: 4kW solar system suggested with PM Surya Ghar subsidy."
        mock_choice.finish_reason = "stop"
        mock_completion.choices = [mock_choice]
        mock_completion.model = "luna-v1"
        mock_completion.usage.prompt_tokens = 90
        mock_completion.usage.completion_tokens = 30
        mock_completion.usage.total_tokens = 120
        mock_client.chat.completions.create.return_value = mock_completion

        luna_provider = LunaProvider(api_key="sk-test", model_name="luna-v1", client=mock_client)
        set_ai_provider(luna_provider)
        self.service._provider = luna_provider

        result = self.service.chat(
            message="Calculate my subsidy and solar system",
            user_email="customer@example.com",
            user_role="Free User",
            user_name="Priya",
            session_id="test-session-luna-01",
        )

        self.assertIn("response", result)
        self.assertIn("OpenAI Luna: 4kW solar system suggested", result["response"])
        self.assertEqual(result["conversation_id"], "test-session-luna-01")

    def test_assistant_graceful_fallback_on_provider_failure(self):
        self.mock_provider.set_simulate_error(AIProviderUnavailableError("Provider offline", provider="mock"))

        result = self.service.chat(
            message="Help me with solar",
            user_email="test@example.com",
            user_role="Free User",
            session_id="test-session-102",
        )

        self.assertIn("response", result)
        self.assertIn("experiencing high demand", result["response"])

    def test_assistant_explicit_tool_execution(self):
        # Execute tool directly through assistant service
        res = self.service.execute_tool(
            tool_name="roi_calculate",
            params={"monthly_bill": 2500.0, "system_size": 3.0},
            user_email="admin@getsolar.in",
            user_role="Administrator",
        )
        self.assertTrue(res.get("success"), f"Tool failed: {res}")
        self.assertEqual(res.get("tool"), "roi_calculate")


if __name__ == "__main__":
    unittest.main()
